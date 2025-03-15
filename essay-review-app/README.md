# Essay Review App

## Overview
The Essay Review App is a web application designed to help kids review their essays by providing AI-driven feedback on grammar, style, tone, and overall writing quality. The app features an interactive text editor built with Tiptap, allowing users to write and edit their essays while receiving real-time suggestions and insights.

## Features
- **Text Editor**: A rich text editor for writing essays.
- **AI Analysis**: Automatic detection of grammatical and punctuation errors, along with explanations and suggested changes.
- **Tone and Style Analysis**: Identification of writing tone and style, with insights on how to improve.
- **Metrics and Scoring**: Calculation of various writing metrics and an overall score to help users understand their writing quality.
- **Commenting System**: Ability to add comments and suggestions directly on the text.
- **Visual Insights**: An insights overlay that visualizes different metrics and provides feedback in an engaging way.
- **Avatar Representation**: A fun mascot or avatar that represents the user's writing style.
- **Translation and Voice Features**: Options for translating text and voice-related functionalities.

## Project Structure
```
essay-review-app
├── client                # Frontend application
│   ├── public            # Public assets
│   ├── src               # Source code for the frontend
│   └── package.json      # Frontend dependencies and scripts
├── server                # Backend application
│   ├── src               # Source code for the backend
│   └── package.json      # Backend dependencies and scripts
├── shared                # Shared types and interfaces
├── .env.example          # Example environment variables
├── docker-compose.yml    # Docker configuration
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)
- Docker (for containerization)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/essay-review-app.git
   cd essay-review-app
   ```

2. Install dependencies for the client:
   ```
   cd client
   npm install
   ```

3. Install dependencies for the server:
   ```
   cd ../server
   npm install
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in the required values.

### Running the Application

1. Start the backend server:
   ```
   cd server
   npm start
   ```

2. Start the frontend application:
   ```
   cd ../client
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000` to access the application.

### Usage
- Write or paste your essay into the text editor.
- Use the formatting bar to style your text.
- Review AI-generated suggestions and insights.
- Add comments and track your writing progress.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.