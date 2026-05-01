import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, X } from 'lucide-react';
import { getUser } from '../utils/storage';
import '../styles/chatbot.css';

// AI backend URL — FastAPI runs on port 8000
let AI_API_URL = process.env.REACT_APP_AI_URL || 'http://localhost:8000';
if (AI_API_URL.includes('localhost') && window.location.hostname !== 'localhost') {
  AI_API_URL = `http://${window.location.hostname}:8000`;
}

function Chatbot() {
  const location = useLocation();
  const isWatchPage = location.pathname.startsWith('/watch/');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hi! I'm HnH TV's AI assistant. Tell me your mood or ask for a recommendation! You can also say \"surprise me\" or enable \"kid mode\".",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isWatchPage) return null;

  const user = getUser();

  /**
   * Parse the AI reply for movie titles and make them clickable.
   * The reply format is: "- Title (Rating)\n"
   */
  const parseReply = (text) => {
    // Split into lines and process each
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      return <span key={i}>{trimmed}<br /></span>;
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userMessage,
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const userId = user?._id || user?.id || 'anonymous';

      const response = await fetch(`${AI_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`AI server responded with ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: data.reply || 'No response from AI engine.',
          time: new Date(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: `⚠️ Could not reach the AI engine. Make sure the AI server is running.\n(${error.message})`,
          time: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const BotIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="8" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none"/>
      <circle cx="9" cy="14" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="14" r="1.5" fill="currentColor"/>
      <path d="M9.5 17.5C10.5 18.5 13.5 18.5 14.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="2" x2="12" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="2" r="1.5" fill="currentColor"/>
      <line x1="1" y1="13" x2="3" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="21" y1="13" x2="23" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`chatbot-fab ${isOpen ? 'chatbot-fab-hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        title="Chat with AI Assistant"
      >
        <span className="chatbot-fab-icon"><BotIcon size={28} /></span>
        <span className="chatbot-fab-pulse"></span>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar"><BotIcon size={28} /></div>
              <div>
                <h4>HnH AI Assistant</h4>
                <span className="chatbot-status">
                  <span className="chatbot-status-dot"></span>
                  Online
                </span>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-msg ${msg.sender === 'user' ? 'chatbot-msg-user' : 'chatbot-msg-bot'}`}
              >
                {msg.sender === 'bot' && <span className="chatbot-msg-avatar"><BotIcon size={18} /></span>}
                <div className="chatbot-msg-content">
                  <p>{parseReply(msg.text)}</p>
                  <span className="chatbot-msg-time">{formatTime(msg.time)}</span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-msg chatbot-msg-bot">
                <span className="chatbot-msg-avatar"><BotIcon size={18} /></span>
                <div className="chatbot-msg-content">
                  <p className="chatbot-typing">
                    <span></span><span></span><span></span>
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-area" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? 'Thinking...' : 'Type a message...'}
              autoFocus
              disabled={isLoading}
            />
            <button type="submit" disabled={!input.trim() || isLoading}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default Chatbot;
