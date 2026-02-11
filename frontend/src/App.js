import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Backend API base URL
const API_BASE_URL = 'http://127.0.0.1:5000';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Check backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (response.ok) {
          const data = await response.json();
          setBackendConnected(true);
          console.log('Backend connected:', data);
        } else {
          setBackendConnected(false);
        }
      } catch (error) {
        setBackendConnected(false);
        console.error('Backend connection check failed:', error);
      }
    };
    checkBackend();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      // Read response body as text first (can only be read once)
      const responseText = await response.text();
      
      // Check if response is ok
      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        let suggestion = '';
        try {
          // Try to parse as JSON to get error details
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorMsg;
          if (errorData.suggestion) {
            suggestion = `\n\n💡 ${errorData.suggestion}`;
          }
          if (errorData.error_type) {
            errorMsg = `[${errorData.error_type}] ${errorMsg}`;
          }
        } catch (e) {
          // If not JSON, use the text response or status text
          errorMsg = responseText || errorMsg;
        }
        console.error('Backend error:', errorMsg);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `❌ Error: ${errorMsg}${suggestion}` 
        }]);
        return;
      }

      // Try to parse JSON response
      let data;
      try {
        if (!responseText) {
          throw new Error('Empty response from server');
        }
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', responseText);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: Invalid response from server. Response: ${responseText.substring(0, 100)}` 
        }]);
        return;
      }

      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error('No response in data');
      }
    } catch (error) {
      console.error('Frontend error:', error);
      let errorMessage = error.message;
      
      // Handle network errors
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = `Cannot connect to backend server at ${API_BASE_URL}. Make sure the Flask server is running on port 5000.`;
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${errorMessage}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="App">
      <div className="chat-container">
        <header className="chat-header">
          <div className="logo-container">
            <div className="logo-monogram">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D1C4E9" />
                    <stop offset="100%" stopColor="#673AB7" />
                  </linearGradient>
                </defs>
                {/* Integrated TG monogram - T and G share vertical stem */}
                {/* T top bar with rounded corners */}
                <rect x="6" y="6" width="24" height="8" rx="4" fill="url(#logoGradient)" />
                {/* Shared vertical stem (T and G) */}
                <rect x="16" y="14" width="5" height="34" rx="2.5" fill="url(#logoGradient)" />
                {/* G shape - rounded rectangle integrated with T */}
                <path d="M28 16 C28 13, 30.5 11, 33.5 11 C36.5 11, 39 13, 39 16 L39 44 C39 47, 36.5 49, 33.5 49 C30.5 49, 28 47, 28 44 L28 32 L37 32 L37 44 C37 45.5, 35.5 47, 34 47 C32.5 47, 31 45.5, 31 44 L31 16 C31 14.5, 32.5 13, 34 13 C35.5 13, 37 14.5, 37 16 L37 28 L28 28 Z" fill="url(#logoGradient)" />
              </svg>
            </div>
            <div className="logo-text">
              <div className="logo-line1">TECH</div>
              <div className="logo-line2">GADGET</div>
            </div>
          </div>
        </header>

        <div className="chat-messages">
          {backendConnected === false && (
            <div className="error-banner">
              ⚠️ Cannot connect to backend server at {API_BASE_URL}. Make sure Flask is running on port 5000.
            </div>
          )}
          {messages.length === 0 && backendConnected !== false && (
            <div className="welcome-message">
              <p>Welcome to TechGadgets Support!</p>
              <p>How can I help you today?</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-wrapper">
          <div className="chat-input-container">
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder="Type your message... (Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              disabled={isLoading}
            />
            <button
              className="send-button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              title="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
