"use client";

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Welcome to **Fatimas Collection**. I can help with products, sizes, checkout, or newsletter/contact support. What do you need?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev: Message[]) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }].slice(-6) 
        })
      });

      const data = await res.json();
      if (data.message) {
        setMessages((prev: Message[]) => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      setMessages((prev: Message[]) => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-assistant-wrapper">
      {/* Floating Trigger */}
      <button 
        className={`ai-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <i className="fas fa-times"></i> : <i className="fas fa-comment-dots"></i>}
        {!isOpen && <span className="trigger-badge">AI</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <div className="header-info">
              <span className="dot"></span>
              <h4>Shali Assistant</h4>
            </div>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.map((msg: Message, idx: number) => (
              <div key={idx} className={`message-row ${msg.role}`}>
                <div className="message-bubble">
                  {msg.role === 'assistant' ? (
                    <div className="markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          p: ({ children }) => <p className="md-paragraph">{children}</p>,
                          ul: ({ children }) => <ul className="md-list">{children}</ul>,
                          ol: ({ children }) => <ol className="md-list md-list-ordered">{children}</ol>,
                          li: ({ children }) => <li className="md-list-item">{children}</li>,
                          strong: ({ children }) => <strong className="md-strong">{children}</strong>,
                          em: ({ children }) => <em className="md-em">{children}</em>,
                          h1: ({ children }) => <h4 className="md-heading">{children}</h4>,
                          h2: ({ children }) => <h4 className="md-heading">{children}</h4>,
                          h3: ({ children }) => <h4 className="md-heading">{children}</h4>,
                          code: ({ children }) => <code className="md-code">{children}</code>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-row assistant">
                <div className="message-bubble typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
          </div>

          <form className="chat-input" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Ask anything about products, checkout, or site help..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={!input.trim() || isLoading}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
