import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import backgroundImage from './assets/background.png';

// Backend API base URL
const API_BASE_URL = 'http://127.0.0.1:5000';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(null);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
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
      const requestBody = {
        message: userMessage,
        session_id: sessionId,
      };
      
      // Include phone number if available
      if (phoneNumber) {
        requestBody.phone_number = phoneNumber;
      }

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          orderFound: data.order_found,
          orderId: data.order_id,
          orderStatus: data.order_status
        }]);
        
        // Check if phone number is needed
        if (data.needs_phone && !phoneNumber) {
          setNeedsPhone(true);
        } else {
          setNeedsPhone(false);
        }
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
    <div className="App" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="chat-container">
        <header className="chat-header">
          <div className="logo-container">
            <img src="/assets/logo.png" alt="TechGadgets Logo" className="logo-image" />
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
              <div className="message-content">
                {msg.content}
                {msg.orderFound && (
                  <div className="order-badge">
                    Order: {msg.orderId} | Status: {msg.orderStatus}
                  </div>
                )}
              </div>
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
        {needsPhone && !phoneNumber && (
          <div className="phone-input-container">
            <div className="phone-input-wrapper">
              <input
                type="tel"
                className="phone-input"
                placeholder="Enter your phone number (e.g., 555-123-4567)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && phoneNumber.trim()) {
                    handleSend();
                  }
                }}
              />
              <button
                className="phone-submit-button"
                onClick={async () => {
                  if (phoneNumber.trim()) {
                    setIsLoading(true);
                    setMessages(prev => [...prev, { role: 'user', content: `Phone: ${phoneNumber}` }]);
                    try {
                      const response = await fetch(`${API_BASE_URL}/api/chat`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                          message: `My phone number is ${phoneNumber}`,
                          session_id: sessionId,
                          phone_number: phoneNumber
                        }),
                      });
                      const responseText = await response.text();
                      if (response.ok) {
                        const data = JSON.parse(responseText);
                        if (data.response) {
                          setMessages(prev => [...prev, { 
                            role: 'assistant', 
                            content: data.response,
                            orderFound: data.order_found,
                            orderId: data.order_id,
                            orderStatus: data.order_status
                          }]);
                          setNeedsPhone(false);
                        }
                      }
                    } catch (error) {
                      console.error('Error submitting phone:', error);
                      setMessages(prev => [...prev, { 
                        role: 'assistant', 
                        content: 'Sorry, there was an error processing your phone number. Please try again.' 
                      }]);
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                disabled={!phoneNumber.trim() || isLoading}
              >
                Submit
              </button>
            </div>
            <p className="phone-hint">Please provide your phone number for order verification</p>
          </div>
        )}
        <div className="chat-input-container">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder={needsPhone && !phoneNumber ? "Please provide your phone number above first" : "Type your message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={isLoading || (needsPhone && !phoneNumber)}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading || (needsPhone && !phoneNumber)}
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
