// Python Academy Test Application

class PythonAcademy {
    constructor() {
        this.config = null;
        this.questions = [];
        this.questionsByTopic = {};
        this.currentQuestionIndex = 0;
        this.selectedQuestions = [];
        this.userAnswers = [];
        this.answerDetails = [];
        this.topicScores = {};

        this.initializeApp();
    }

    async initializeApp() {
        try {
            await this.loadConfig();
            await this.loadQuestions();
            this.setupEventListeners();
            this.displayTopics();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            alert('Failed to load test configuration. Please check the console for details.');
        }
    }

    async loadConfig() {
        const response = await fetch('config.json');
        this.config = await response.json();

        // Initialize topic scores and questionsByTopic
        this.config.topics.forEach(topic => {
            this.topicScores[topic.id] = { score: 0, total: 0 };
            this.questionsByTopic[topic.id] = [];
        });
    }

    async loadQuestions() {
        const questionFiles = this.config.questionFiles || ['questions.json'];

        for (const file of questionFiles) {
            try {
                const response = await fetch(file);
                const data = await response.json();
                this.questions.push(...data.questions);

                // Organize questions by topic
                data.questions.forEach(q => {
                    q.topics.forEach(topicId => {
                        if (this.questionsByTopic[topicId]) {
                            this.questionsByTopic[topicId].push(q);
                        }
                    });
                });
            } catch (error) {
                console.warn(`Could not load ${file}:`, error);
            }
        }

        if (this.questions.length === 0) {
            throw new Error('No questions loaded');
        }
    }

    displayTopics() {
        const topicsList = document.getElementById('topics-list');
        topicsList.innerHTML = '';

        this.config.topics.forEach(topic => {
            const li = document.createElement('li');
            li.textContent = `${topic.icon} ${topic.name}`;
            topicsList.appendChild(li);
        });
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startTest());
        document.getElementById('submit-answer-btn').addEventListener('click', () => this.submitAnswer());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartTest());
        document.getElementById('toggle-timeline-btn').addEventListener('click', () => this.toggleTimeline());
    }

    startTest() {
        // Generate questions using smart selection algorithm
        this.selectedQuestions = this.generateQuestionList();
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.answerDetails = [];

        // Reset scores
        Object.keys(this.topicScores).forEach(key => {
            this.topicScores[key] = { score: 0, total: 0 };
        });

        // Show question screen
        this.switchScreen('question-screen');
        document.getElementById('total-questions').textContent = this.selectedQuestions.length;
        this.displayQuestion();
    }

    generateQuestionList() {
        const minPerTopic = this.config.minQuestionsPerTopic || 5;
        const minTotal = this.config.minTotalQuestions || 10;
        const selectedQuestions = [];
        const usedQuestionIds = new Set();

        // Step 1: Ensure minimum questions per topic
        this.config.topics.forEach(topic => {
            const topicQuestions = this.questionsByTopic[topic.id] || [];
            const shuffled = [...topicQuestions].sort(() => Math.random() - 0.5);

            let added = 0;
            for (const q of shuffled) {
                if (!usedQuestionIds.has(q.id) && added < minPerTopic) {
                    selectedQuestions.push(q);
                    usedQuestionIds.add(q.id);
                    added++;
                }
            }
        });

        // Step 2: Add more questions if below minimum total
        const remainingQuestions = this.questions.filter(q => !usedQuestionIds.has(q.id));
        const shuffledRemaining = [...remainingQuestions].sort(() => Math.random() - 0.5);

        while (selectedQuestions.length < minTotal && shuffledRemaining.length > 0) {
            const q = shuffledRemaining.pop();
            selectedQuestions.push(q);
            usedQuestionIds.add(q.id);
        }

        // Step 3: Shuffle to avoid same topics in a row (while maintaining some diversity)
        return this.shuffleWithTopicDiversity(selectedQuestions);
    }

    shuffleWithTopicDiversity(questions) {
        // Try to avoid consecutive questions from the same single topic
        const result = [];
        const remaining = [...questions];
        let lastTopic = null;

        while (remaining.length > 0) {
            let bestIndex = -1;

            // Try to find a question with a different primary topic
            for (let i = 0; i < remaining.length; i++) {
                const q = remaining[i];
                const primaryTopic = q.topics[0];

                if (primaryTopic !== lastTopic) {
                    bestIndex = i;
                    break;
                }
            }

            // If all remaining are same topic or we couldn't find different, just take first
            if (bestIndex === -1) {
                bestIndex = 0;
            }

            const selected = remaining.splice(bestIndex, 1)[0];
            result.push(selected);
            lastTopic = selected.topics[0];
        }

        return result;
    }

    displayQuestion() {
        const question = this.selectedQuestions[this.currentQuestionIndex];

        // Update progress
        const progress = ((this.currentQuestionIndex + 1) / this.selectedQuestions.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('current-question').textContent = this.currentQuestionIndex + 1;

        // Display question type
        document.getElementById('question-type').textContent = question.type || 'Theory';

        // Display question text
        document.getElementById('question-text').textContent = question.question;

        // Display code if present
        const codeBlock = document.getElementById('question-code');
        if (question.code) {
            codeBlock.textContent = question.code;
            codeBlock.classList.add('visible');
        } else {
            codeBlock.classList.remove('visible');
        }

        // Display answers
        this.displayAnswers(question);

        // Disable submit button until answer is selected
        document.getElementById('submit-answer-btn').disabled = true;
    }

    /**
     * Display answer options for the current question.
     * Uses explicit multipleChoice property to determine input type.
     */
    displayAnswers(question) {
        const container = document.getElementById('answers-container');
        container.innerHTML = '';

        const isMultiSelect = question.multipleChoice || false;
        const inputType = isMultiSelect ? 'checkbox' : 'radio';

        question.answers.forEach((answer, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'answer-option';

            const input = document.createElement('input');
            input.type = inputType;
            input.name = 'answer';
            input.id = `answer-${index}`;
            input.value = index;

            const label = document.createElement('label');
            label.htmlFor = `answer-${index}`;
            label.textContent = answer;

            optionDiv.addEventListener('click', (e) => {
                if (e.target === input || e.target === label) {
                    return;
                }

                if (inputType === 'radio') {
                    input.checked = true;
                    document.querySelectorAll('.answer-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    optionDiv.classList.add('selected');
                    document.getElementById('submit-answer-btn').disabled = false;
                    return;
                }

                input.checked = !input.checked;
                optionDiv.classList.toggle('selected', input.checked);
                document.getElementById('submit-answer-btn').disabled = false;
            });

            input.addEventListener('change', () => {
                if (inputType === 'radio') {
                    document.querySelectorAll('.answer-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    optionDiv.classList.add('selected');
                } else {
                    optionDiv.classList.toggle('selected', input.checked);
                }
                document.getElementById('submit-answer-btn').disabled = false;
            });

            label.addEventListener('click', (e) => {
                e.preventDefault();
                input.checked = !input.checked;
                input.dispatchEvent(new Event('change'));
            });

            optionDiv.appendChild(input);
            optionDiv.appendChild(label);
            container.appendChild(optionDiv);
        });
    }

    /**
     * Process the user's answer submission and move to next question or show results.
     */
    submitAnswer() {
        const question = this.selectedQuestions[this.currentQuestionIndex];
        const selectedAnswers = Array.from(document.querySelectorAll('input[name="answer"]:checked'))
            .map(input => parseInt(input.value));

        this.userAnswers.push(selectedAnswers);

        const scoreResult = this.calculateScore(question, selectedAnswers);
        const correctnessResult = this.determineCorrectness(question, scoreResult.score, selectedAnswers);

        this.answerDetails.push({
            question: question,
            userAnswers: selectedAnswers,
            score: scoreResult.score,
            isFullyCorrect: correctnessResult.isFullyCorrect,
            isPartiallyCorrect: correctnessResult.isPartiallyCorrect
        });

        question.topics.forEach(topicId => {
            if (this.topicScores[topicId]) {
                this.topicScores[topicId].total += 1;
                this.topicScores[topicId].score += scoreResult.score;
            }
        });

        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.selectedQuestions.length) {
            this.displayQuestion();
            return;
        }

        this.showResults();
    }

    /**
     * Determine if answer is fully correct, partially correct, or incorrect.
     *
     * @param {Object} question - The question object
     * @param {number} score - The calculated score (0-1)
     * @param {Array} selectedAnswers - Array of selected answer indices
     * @returns {Object} Object with isFullyCorrect and isPartiallyCorrect booleans
     */
    determineCorrectness(question, score, selectedAnswers) {
        if (question.multipleChoice) {
            const correctIndices = question.answerScores
                .map((s, idx) => s > 0 ? idx : -1)
                .filter(idx => idx !== -1);
            const incorrectIndices = question.answerScores
                .map((s, idx) => s < 0 ? idx : -1)
                .filter(idx => idx !== -1);

            const selectedCorrect = selectedAnswers.filter(idx => correctIndices.includes(idx)).length;
            const selectedIncorrect = selectedAnswers.filter(idx => incorrectIndices.includes(idx)).length;

            const allCorrectSelected = selectedCorrect === correctIndices.length;
            const noIncorrectSelected = selectedIncorrect === 0;

            if (allCorrectSelected && noIncorrectSelected) {
                return { isFullyCorrect: true, isPartiallyCorrect: false };
            }

            const allIncorrectSelected = selectedIncorrect === incorrectIndices.length;
            const noCorrectSelected = selectedCorrect === 0;

            if (allIncorrectSelected && noCorrectSelected) {
                return { isFullyCorrect: false, isPartiallyCorrect: false };
            }

            return { isFullyCorrect: false, isPartiallyCorrect: true };
        }

        if (score >= 0.99) {
            return { isFullyCorrect: true, isPartiallyCorrect: false };
        }

        if (score > 0.01) {
            return { isFullyCorrect: false, isPartiallyCorrect: true };
        }

        return { isFullyCorrect: false, isPartiallyCorrect: false };
    }

    /**
     * Calculate the score for a question based on selected answers.
     * Simply sums the scores of selected answers, then clamps to 0-1 range.
     *
     * @param {Object} question - The question object with answerScores array
     * @param {Array} selectedAnswers - Array of selected answer indices
     * @returns {Object} Object with score property (0-1 range)
     */
    calculateScore(question, selectedAnswers) {
        if (!question.answerScores) {
            const correctAnswers = question.correctAnswers || [question.correctAnswer];
            const isCorrect = selectedAnswers.length === correctAnswers.length &&
                selectedAnswers.sort().every((val, index) => val === correctAnswers.sort()[index]);
            return { score: isCorrect ? 1 : 0 };
        }

        if (selectedAnswers.length === 0) {
            return { score: 0 };
        }

        let earnedScore = 0;
        selectedAnswers.forEach(idx => {
            earnedScore += question.answerScores[idx];
        });

        return { score: Math.max(0, Math.min(1, earnedScore)) };
    }

    /**
     * Display the results screen with overall and topic-specific scores.
     */
    showResults() {
        this.switchScreen('results-screen');

        let totalScore = 0;
        let totalPossible = 0;

        Object.values(this.topicScores).forEach(topic => {
            totalScore += topic.score;
            totalPossible += topic.total;
        });

        const overallPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

        const overallDiv = document.getElementById('overall-score');
        overallDiv.innerHTML = `
            <h3>Overall Score</h3>
            <div class="score-value">${overallPercentage}%</div>
            <p>${totalScore.toFixed(1)} out of ${totalPossible} points</p>
        `;

        this.displayTopicScores();
    }

    displayTopicScores() {
        const container = document.getElementById('topic-scores');
        container.innerHTML = '';

        this.config.topics.forEach(topic => {
            const score = this.topicScores[topic.id];

            if (score.total === 0) {
                return; // Skip topics with no questions
            }

            const percentage = Math.round((score.score / score.total) * 100);
            const level = this.getScoreLevel(percentage);
            const feedback = this.getFeedback(percentage, topic.name);

            const topicDiv = document.createElement('div');
            topicDiv.className = `topic-score ${level}`;
            topicDiv.innerHTML = `
                <h4>${topic.icon} ${topic.name}</h4>
                <div class="score-bar">
                    <div class="score-bar-fill" style="width: ${percentage}%">
                        ${percentage}%
                    </div>
                </div>
                <p>${score.score.toFixed(1)}/${score.total} points (${percentage}%)</p>
                <p class="feedback">${feedback}</p>
            `;

            container.appendChild(topicDiv);
        });
    }

    getScoreLevel(percentage) {
        if (percentage >= 90) return 'excellent';
        if (percentage >= 70) return 'good';
        if (percentage >= 50) return 'average';
        return 'needs-work';
    }

    getFeedback(percentage, topicName) {
        if (percentage === 100) {
            return `Perfect! You've mastered ${topicName}! 🎉`;
        } else if (percentage >= 90) {
            return `Excellent! You have a strong understanding of ${topicName}!`;
        } else if (percentage >= 70) {
            return `Good job! You have a solid grasp of ${topicName}.`;
        } else if (percentage >= 50) {
            return `Not bad! ${topicName} requires more practice.`;
        } else if (percentage > 0) {
            return `${topicName} needs more work. Consider reviewing the basics.`;
        } else {
            return `${topicName} is a whole new world! Time to start learning! 🌍`;
        }
    }

    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    toggleTimeline() {
        const container = document.getElementById('timeline-container');
        const toggleText = document.getElementById('timeline-toggle-text');

        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            container.classList.add('visible');
            toggleText.textContent = '📋 Hide Question Timeline';
            this.renderTimeline();
        } else {
            container.classList.add('hidden');
            container.classList.remove('visible');
            toggleText.textContent = '📋 View Question Timeline';
        }
    }

    renderTimeline() {
        const circlesContainer = document.getElementById('timeline-circles');
        circlesContainer.innerHTML = '';

        this.answerDetails.forEach((detail, index) => {
            const circle = document.createElement('div');
            circle.className = 'timeline-circle';

            if (detail.isFullyCorrect) {
                circle.classList.add('correct');
            } else if (detail.isPartiallyCorrect) {
                circle.classList.add('partial');
            } else {
                circle.classList.add('incorrect');
            }

            circle.textContent = index + 1;
            circle.addEventListener('click', () => this.showTimelineDetail(index));

            circlesContainer.appendChild(circle);
        });
    }

    showTimelineDetail(index) {
        const detail = this.answerDetails[index];
        const detailContainer = document.getElementById('timeline-detail');

        // Remove active class from all circles
        document.querySelectorAll('.timeline-circle').forEach(c => c.classList.remove('active'));

        // Add active class to clicked circle
        document.querySelectorAll('.timeline-circle')[index].classList.add('active');

        const question = detail.question;
        const userAnswers = detail.userAnswers;
        const userScore = detail.score;

        let html = `
            <h4>Question ${index + 1} - Score: ${(userScore * 100).toFixed(0)}%</h4>
            <div class="question-info">
                <span class="question-type">${question.type || 'Theory'}</span>
                <p><strong>${question.question}</strong></p>
        `;

        if (question.code) {
            html += `<pre class="code-block">${this.escapeHtml(question.code)}</pre>`;
        }

        html += `</div><h5>Answers:</h5><ul class="answer-list">`;

        // Use answerScores if available to determine correctness
        question.answers.forEach((answer, ansIndex) => {
            const wasSelected = userAnswers.includes(ansIndex);
            let answerScore;

            if (question.answerScores) {
                answerScore = question.answerScores[ansIndex];
            } else {
                const correctAnswers = question.correctAnswers || [question.correctAnswer];
                answerScore = correctAnswers.includes(ansIndex) ? 1 : 0;
            }

            // For display purposes
            const isPositive = answerScore > 0;
            const isNegative = answerScore < 0;
            const isNeutral = answerScore === 0;
            const isFullScore = answerScore === 1.0;

            let className = '';
            let badges = '';
            let scoreDisplay = '';

            if (question.answerScores) {
                // Show score with + or - sign for clarity
                const scoreText = answerScore > 0 ? `+${(answerScore * 100).toFixed(0)}%` :
                                  answerScore < 0 ? `${(answerScore * 100).toFixed(0)}%` :
                                  '0%';
                scoreDisplay = ` <span style="font-size: 0.85em; color: #666;">(${scoreText} value)</span>`;
            }

            if (isFullScore && wasSelected) {
                className = 'correct-answer';
                badges = '<span class="answer-badge badge-correct">✓ Correct</span><span class="answer-badge badge-your-answer">Your Answer</span>';
            } else if (isPositive && !isFullScore && wasSelected) {
                className = 'partial-answer';
                badges = '<span class="answer-badge badge-partial">~ Partial</span><span class="answer-badge badge-your-answer">Your Answer</span>';
            } else if (isFullScore && !wasSelected) {
                className = 'correct-answer';
                badges = '<span class="answer-badge badge-correct">✓ Correct Answer</span>';
            } else if (isPositive && !isFullScore && !wasSelected) {
                className = 'partial-answer';
                badges = '<span class="answer-badge badge-partial">~ Partial Credit Available</span>';
            } else if (isNegative && wasSelected) {
                className = 'wrong-answer';
                badges = '<span class="answer-badge badge-incorrect">✗ Wrong</span><span class="answer-badge badge-your-answer">Your Answer</span>';
            } else if (isNegative && !wasSelected) {
                className = 'wrong-answer';
                badges = '<span class="answer-badge badge-incorrect">✗ Wrong (Avoided)</span>';
            } else if (isNeutral && wasSelected) {
                className = 'user-answer';
                badges = '<span class="answer-badge badge-your-answer">Your Answer (No Points)</span>';
            }

            html += `<li class="${className}">${this.escapeHtml(answer)}${scoreDisplay} ${badges}</li>`;
        });

        html += `</ul>`;

        const scorePercent = (userScore * 100).toFixed(0);
        if (detail.isFullyCorrect) {
            html += `<p style="color: var(--success-color); font-weight: bold; margin-top: 15px;">✓ Perfect! You earned ${scorePercent}% (${userScore.toFixed(2)} points)</p>`;
        } else if (detail.isPartiallyCorrect) {
            html += `<p style="color: var(--warning-color); font-weight: bold; margin-top: 15px;">⚠ Partially correct - You earned ${scorePercent}% (${userScore.toFixed(2)} points)</p>`;
        } else {
            html += `<p style="color: var(--danger-color); font-weight: bold; margin-top: 15px;">✗ Incorrect - You earned ${scorePercent}% (${userScore.toFixed(2)} points)</p>`;
        }

        detailContainer.innerHTML = html;
        detailContainer.classList.add('visible');
        detailContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Escape HTML special characters to prevent XSS attacks.
     * @param {string} text - Text to escape
     * @returns {string} HTML-escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Restart the test by returning to the start screen.
     */
    restartTest() {
        this.switchScreen('start-screen');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PythonAcademy();
});

