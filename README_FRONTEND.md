# TechGadgets Chatbot Frontend

This is a React-based frontend for the TechGadgets customer support chatbot that uses the fine-tuned LLM.

## Project Structure

```
fine-tuning-llm/
├── backend/
│   ├── app.py              # Flask API server
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── App.css         # Styles
│   │   ├── index.js        # React entry point
│   │   └── index.css       # Global styles
│   └── package.json        # Node dependencies
└── README_FRONTEND.md       # This file
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Make sure you have a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. Update the `FINE_TUNED_MODEL` variable in `backend/app.py` with your actual fine-tuned model ID.

5. Start the Flask server:
   ```bash
   python app.py
   ```
   The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```
   The app will open in your browser at `http://localhost:3000`

## Features

- **TechGadgets Logo**: Displayed in the header
- **Chat Interface**: Clean, modern chat UI with message bubbles
- **Text Input**: Multi-line textarea with auto-resize
- **Keyboard Shortcuts**:
  - `Enter`: Send message
  - `Shift + Enter`: New line
- **Loading Indicator**: Shows typing animation while waiting for response
- **Responsive Design**: Works on desktop and mobile devices

## Usage

1. Start the backend server first (port 5000)
2. Start the frontend server (port 3000)
3. Open your browser to `http://localhost:3000`
4. Start chatting with the TechGadgets support bot!

## API Endpoints

- `POST /api/chat`: Send a message and receive a response
  - Request body: `{ "message": "your message here" }`
  - Response: `{ "response": "bot response" }`

- `GET /api/health`: Health check endpoint

## Notes

- The frontend is configured to proxy API requests to `http://localhost:5000` (see `package.json` proxy setting)
- Make sure your `.env` file contains the correct OpenAI API key
- Update the `FINE_TUNED_MODEL` ID in `backend/app.py` to match your fine-tuned model
