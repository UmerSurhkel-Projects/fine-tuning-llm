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
            <div className="logo">TechGadgets</div>
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

        <div className="chat-input-container">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder="Type your message... (Shift+Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
