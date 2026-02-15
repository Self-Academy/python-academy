// Python Academy Test Application

class PythonAcademy {
    constructor() {
        this.config = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.selectedQuestions = [];
        this.userAnswers = [];
        this.topicScores = {};
        this.numQuestions = 10;

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
        this.numQuestions = this.config.defaultQuestions || 10;
        document.getElementById('num-questions').value = this.numQuestions;

        // Initialize topic scores
        this.config.topics.forEach(topic => {
            this.topicScores[topic.id] = { score: 0, total: 0 };
        });
    }

    async loadQuestions() {
        const questionFiles = this.config.questionFiles || ['questions.json'];

        for (const file of questionFiles) {
            try {
                const response = await fetch(file);
                const data = await response.json();
                this.questions.push(...data.questions);
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

        document.getElementById('num-questions').addEventListener('change', (e) => {
            this.numQuestions = parseInt(e.target.value);
        });
    }

    startTest() {
        // Get number of questions from input
        const numQuestionsInput = document.getElementById('num-questions');
        this.numQuestions = Math.min(parseInt(numQuestionsInput.value), this.questions.length);

        // Select random questions
        this.selectedQuestions = this.getRandomQuestions(this.numQuestions);
        this.currentQuestionIndex = 0;
        this.userAnswers = [];

        // Reset scores
        Object.keys(this.topicScores).forEach(key => {
            this.topicScores[key] = { score: 0, total: 0 };
        });

        // Show question screen
        this.switchScreen('question-screen');
        document.getElementById('total-questions').textContent = this.numQuestions;
        this.displayQuestion();
    }

    getRandomQuestions(num) {
        const shuffled = [...this.questions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, num);
    }

    displayQuestion() {
        const question = this.selectedQuestions[this.currentQuestionIndex];

        // Update progress
        const progress = ((this.currentQuestionIndex + 1) / this.numQuestions) * 100;
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

    displayAnswers(question) {
        const container = document.getElementById('answers-container');
        container.innerHTML = '';

        const isMultiSelect = question.correctAnswers && question.correctAnswers.length > 1;
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

            input.addEventListener('change', () => {
                if (inputType === 'radio') {
                    document.querySelectorAll('.answer-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    optionDiv.classList.add('selected');
                }
                document.getElementById('submit-answer-btn').disabled = false;
            });

            label.addEventListener('click', (e) => {
                e.preventDefault();
                input.checked = !input.checked;
                input.dispatchEvent(new Event('change'));

                if (inputType === 'checkbox') {
                    optionDiv.classList.toggle('selected', input.checked);
                }
            });

            optionDiv.appendChild(input);
            optionDiv.appendChild(label);
            container.appendChild(optionDiv);
        });
    }

    submitAnswer() {
        const question = this.selectedQuestions[this.currentQuestionIndex];
        const selectedAnswers = Array.from(document.querySelectorAll('input[name="answer"]:checked'))
            .map(input => parseInt(input.value));

        // Store user answer
        this.userAnswers.push(selectedAnswers);

        // Check if answer is correct
        const correctAnswers = question.correctAnswers || [question.correctAnswer];
        const isFullyCorrect = this.checkAnswer(question, selectedAnswers);
        const isPartiallyCorrect = this.checkPartialAnswer(question, selectedAnswers);

        // Store detailed answer info for timeline
        this.answerDetails.push({
            question: question,
            userAnswers: selectedAnswers,
            correctAnswers: correctAnswers,
            isFullyCorrect: isFullyCorrect,
            isPartiallyCorrect: isPartiallyCorrect
        });

        // Update scores for all topics this question contributes to
        question.topics.forEach(topicId => {
            if (this.topicScores[topicId]) {
                this.topicScores[topicId].total += 1;
                if (isFullyCorrect) {
                    this.topicScores[topicId].score += 1;
                }
            }
        });

        // Move to next question or show results
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.selectedQuestions.length) {
            this.displayQuestion();
        } else {
            this.showResults();
        }
    }

    checkAnswer(question, selectedAnswers) {
        const correctAnswers = question.correctAnswers || [question.correctAnswer];

        if (selectedAnswers.length !== correctAnswers.length) {
            return false;
        }

        return selectedAnswers.sort().every((val, index) => val === correctAnswers.sort()[index]);
    }

    checkPartialAnswer(question, selectedAnswers) {
        const correctAnswers = question.correctAnswers || [question.correctAnswer];

        // For single answer questions, there's no partial credit
        if (correctAnswers.length === 1) {
            return false;
        }

        // For multiple answer questions, check if some answers are correct
        const correctCount = selectedAnswers.filter(ans => correctAnswers.includes(ans)).length;
        const incorrectCount = selectedAnswers.filter(ans => !correctAnswers.includes(ans)).length;

        // Partial if at least one correct and not all correct, and no incorrect selections
        return correctCount > 0 && correctCount < correctAnswers.length && incorrectCount === 0;
    }

    showResults() {
        this.switchScreen('results-screen');

        // Calculate overall score
        let totalScore = 0;
        let totalPossible = 0;

        Object.values(this.topicScores).forEach(topic => {
            totalScore += topic.score;
            totalPossible += topic.total;
        });

        const overallPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

        // Display overall score
        const overallDiv = document.getElementById('overall-score');
        overallDiv.innerHTML = `
            <h3>Overall Score</h3>
            <div class="score-value">${overallPercentage}%</div>
            <p>${totalScore} out of ${totalPossible} correct</p>
        `;

        // Display topic scores
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
                <p>${score.score}/${score.total} correct</p>
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
        const correctAnswers = detail.correctAnswers;
        const userAnswers = detail.userAnswers;

        let html = `
            <h4>Question ${index + 1}</h4>
            <div class="question-info">
                <span class="question-type">${question.type || 'Theory'}</span>
                <p><strong>${question.question}</strong></p>
        `;

        if (question.code) {
            html += `<pre class="code-block">${this.escapeHtml(question.code)}</pre>`;
        }

        html += `</div><h5>Answers:</h5><ul class="answer-list">`;

        question.answers.forEach((answer, ansIndex) => {
            const isCorrect = correctAnswers.includes(ansIndex);
            const wasSelected = userAnswers.includes(ansIndex);

            let className = '';
            let badges = '';

            if (isCorrect && wasSelected) {
                className = 'correct-answer';
                badges = '<span class="answer-badge badge-correct">✓ Correct</span><span class="answer-badge badge-your-answer">Your Answer</span>';
            } else if (isCorrect && !wasSelected) {
                className = 'correct-answer';
                badges = '<span class="answer-badge badge-correct">✓ Correct Answer</span>';
            } else if (!isCorrect && wasSelected) {
                className = 'wrong-answer';
                badges = '<span class="answer-badge badge-incorrect">✗ Wrong</span><span class="answer-badge badge-your-answer">Your Answer</span>';
            }

            html += `<li class="${className}">${this.escapeHtml(answer)} ${badges}</li>`;
        });

        html += `</ul>`;

        // Add result summary
        if (detail.isFullyCorrect) {
            html += `<p style="color: var(--success-color); font-weight: bold; margin-top: 15px;">✓ You answered this correctly!</p>`;
        } else if (detail.isPartiallyCorrect) {
            html += `<p style="color: var(--warning-color); font-weight: bold; margin-top: 15px;">⚠ Partially correct - you missed some correct answers.</p>`;
        } else {
            html += `<p style="color: var(--danger-color); font-weight: bold; margin-top: 15px;">✗ This answer was incorrect.</p>`;
        }

        detailContainer.innerHTML = html;
        detailContainer.classList.add('visible');
        detailContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    restartTest() {
        this.switchScreen('start-screen');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PythonAcademy();
});

