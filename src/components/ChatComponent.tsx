import React, { useState, useRef, useEffect } from 'react';
import type { Message, AimDataItem, Holding } from '../types';
import { handleApiError } from '../utils/errorHandler';
import { apiClient } from '../services/apiClient';

interface ChatComponentProps {
  isOpen: boolean;
  onClose: () => void;
  aimData: AimDataItem[];
  holdings: { [key: string]: Holding };
  displayCurrency: 'CAD' | 'USD';
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  isOpen,
  onClose,
  aimData,
  holdings,
  displayCurrency,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage, { role: 'model', text: '...' }]);
    setInput('');
    setIsLoading(true);

    try {
      const portfolioData = messages.length <= 1 ? { aimData, holdings } : undefined;
      const response = await apiClient.sendChatMessage(input, portfolioData, displayCurrency);
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = response.response || "I don't have a response for that.";
        return newMessages;
      });
    } catch (error) {
      const friendlyMessage = handleApiError(error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = friendlyMessage;
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="chat-window" role="dialog" aria-label="Chat with AI assistant">
      <div className="chat-header">
        <h3 className="font-bold">Ask Gemini</h3>
        <button
          onClick={onClose}
          className="chat-close-btn"
          aria-label="Close chat"
        >
          &times;
        </button>
      </div>
      
      <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <p>{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your portfolio..."
          disabled={isLoading}
          className="chat-input"
          aria-label="Type your message"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="chat-send-btn"
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </div>
  );
};
