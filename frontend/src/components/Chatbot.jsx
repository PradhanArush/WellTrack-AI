import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Maximize2, Minimize2 } from 'lucide-react';
import api from '../services/api';

const CHATBOT_URL = '/users/chatbot/';

// Floating AI chatbot (Ava) — always visible in the bottom-right corner for logged-in users
const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  // Conversation history — each message has a role ('user' or 'assistant') and content
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Ava, your AI wellness assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false); // Shows the animated typing indicator
  const messagesEndRef = useRef(null);

  // Auto-scroll to the latest message whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      // Send the full conversation history to the backend so the AI has context
      const history = updatedMessages.map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

      const { data } = await api.post(CHATBOT_URL, { messages: history });
      if (data?.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I couldn't get a response. Please try again." }]);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Something went wrong. Please check your connection and try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Allow sending with Enter key (Shift+Enter adds a newline instead)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Toggle button — shows X when open, chat icon when closed */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
        aria-label="Open chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat window — size changes based on isExpanded (desktop only) */}
      {isOpen && (
        <div
          className="fixed bg-white rounded-xl shadow-2xl flex flex-col z-50 animate-slideUp transition-all duration-300"
          style={
            isExpanded
              ? { top: '5%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '90vh' }
              : { bottom: '96px', right: '24px', width: '384px', height: '500px', minWidth: '384px', maxWidth: '384px' }
          }
        >
          {/* Header with expand/collapse and close controls */}
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-4 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold">Ava</div>
                <div className="text-xs text-teal-100">AI Wellness Assistant</div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {/* Expand/minimize only shown on desktop */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition hidden md:block"
                aria-label={isExpanded ? 'Minimize chat' : 'Expand chat'}
              >
                {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={() => { setIsOpen(false); setIsExpanded(false); }}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable message list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* User messages are right-aligned with teal gradient; assistant messages are left-aligned gray */}
                <div
                  className={`max-w-[80%] p-3 rounded-lg break-words overflow-wrap-anywhere ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {/* Animated typing dots shown while waiting for the AI response */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            {/* Invisible element at the bottom — scrolled into view to keep latest message visible */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t overflow-hidden">
            <div className="flex space-x-2 min-w-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              />
              {/* Send button disabled when input is empty */}
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-up animation for the chat window */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Chatbot;
