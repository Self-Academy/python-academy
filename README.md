# 🐍 Python Academy

Test your Python knowledge on different concepts and evaluate where you are at!

## Features

- 📝 Interactive web-based test with multiple question types (theory and code analysis)
- 🎯 Multiple Python topics covered: I/O, Exception Handling, OOP, Data Structures, Functions, Control Flow, Modules, and Advanced Concepts
- 📊 Detailed score breakdown by topic with personalized feedback
- 🔀 Random question selection from a pool of questions
- ⚙️ Configurable number of questions per test
- 📱 Responsive design that works on all devices
- 🚀 Easy to deploy with GitHub Pages

## Quick Start

### Live Demo
Visit the live test at: `https://[your-username].github.io/python-academy/`

### Local Testing
1. Clone the repository
2. Open `index.html` in your web browser
3. Start testing your Python knowledge!

## Adding More Questions

Questions are stored in JSON files for easy management. To add more questions:

1. Edit `questions.json` or create a new question file
2. Follow this format:

```json
{
  "questions": [
    {
      "id": 1,
      "type": "Theory",
      "question": "Your question here?",
      "answers": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ],
      "correctAnswer": 0,
      "topics": ["io", "functions"]
    }
  ]
}
```

### Question Format

- **id**: Unique identifier for the question
- **type**: Type of question (e.g., "Theory", "Code Analysis", "Multiple Select")
- **question**: The question text
- **code** (optional): Code snippet to display
- **answers**: Array of answer options
- **correctAnswer**: Index of the correct answer (for single answer questions)
- **correctAnswers**: Array of correct answer indices (for multiple select questions)
- **topics**: Array of topic IDs this question contributes to

### Adding New Topics

Edit `config.json` to add new topics:

```json
{
  "topics": [
    {
      "id": "new-topic",
      "name": "New Topic Name",
      "icon": "🎯"
    }
  ]
}
```

## Deployment to GitHub Pages

1. Push your repository to GitHub
2. Go to repository Settings → Pages
3. Under "Source", select "Deploy from a branch"
4. Select the `main` branch and `/ (root)` folder
5. Click Save
6. Your test will be live at `https://[your-username].github.io/python-academy/`

## Configuration

Edit `config.json` to customize:

- `defaultQuestions`: Default number of questions per test
- `topics`: List of available topics with icons
- `questionFiles`: Array of JSON files containing questions

## File Structure

```
python-academy/
├── index.html          # Main HTML page
├── styles.css          # Styling
├── app.js             # Application logic
├── config.json        # Configuration file
├── questions.json     # Question bank
└── README.md          # Documentation
```

## Features in Detail

### Score Feedback System

The test provides personalized feedback based on performance:
- **100%**: Perfect! You've mastered [topic]! 🎉
- **90-99%**: Excellent! Strong understanding
- **70-89%**: Good job! Solid grasp
- **50-69%**: Not bad! Requires more practice
- **1-49%**: Needs more work
- **0%**: A whole new world! Time to start learning! 🌍

### Question Types

1. **Theory**: Test conceptual knowledge
2. **Code Analysis**: Analyze code snippets and predict output
3. **Multiple Select**: Questions with multiple correct answers

### Multi-Topic Questions

Questions can contribute to multiple topics simultaneously, allowing for comprehensive evaluation of interconnected concepts.

## Contributing

Feel free to contribute by:
- Adding more questions to `questions.json`
- Improving the UI/UX
- Adding new features
- Reporting bugs

## License

This project is open source and available for educational purposes.
