import React, { useState, useRef, useEffect } from 'react';
import LinklensLogo from '../../Linklens.jpg';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

// Add a function to clean AI responses
function cleanAIResponse(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold**
    .replace(/\*([^*]+)\*/g, '$1')       // *italic*
    .replace(/`([^`]+)`/g, '$1')           // `code`
    .replace(/^\*+|\*+$/g, '')           // leading/trailing *
    .replace(/^- /gm, '')                  // leading - for bullet points
    .replace(/^\s+|\s+$/g, '');          // trim
}

export const AIAgent: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          sender: 'ai',
          text: "Hi! I'm the LinkLens AI Assistant. Ask me anything about LinkedIn profile optimization, career tips, or how to use this app!",
        },
      ]);
    }
  }, [open]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleAsk = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput('');
    try {
      const res = await fetch('http://localhost:3001/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      if (!res.ok || !data.response) {
        setMessages((prev) => [...prev, { sender: 'ai', text: 'AI agent error: ' + (data.response || res.statusText) }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.response }]);
      }
    } catch {
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Error contacting AI agent.' }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      {/* Floating Button */}
      {!open && (
        <button
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-all flex items-center justify-center gap-2"
          onClick={() => setOpen(true)}
          title="Ask LinkLens AI"
        >
          <img
            src={LinklensLogo}
            alt="LinkLens Logo"
            className="w-7 h-7 rounded-lg object-cover bg-white"
            style={{ boxShadow: '0 0 8px #a78bfa55' }}
          />
          <span className="font-bold text-lg">Ask LinkLens AI</span>
        </button>
      )}
      {/* Chatbox */}
      {open && (
        <div className="w-96 max-w-full bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-2xl shadow-2xl border border-blue-700/40 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-slate-900/80 border-b border-blue-700/30">
            <div className="flex items-center space-x-3">
              <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text font-extrabold text-xl tracking-tight drop-shadow">LinkLens AI Assistant</span>
            </div>
            <button
              className="text-blue-300 hover:text-white transition-colors text-lg font-bold px-2"
              onClick={() => setOpen(false)}
              title="Close"
            >
              ×
            </button>
          </div>
          {/* Subtitle */}
          <div className="px-4 pt-2 pb-1 text-blue-200/80 text-sm text-center border-b border-blue-700/20">
            Ask anything about LinkedIn profiles, career growth, or how to use LinkLens!
          </div>
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/60 scrollbar-hide" style={{ maxHeight: 350 }}>
            {messages.length === 0 && (
              <div className="text-center text-blue-200/60 text-sm">Ask for LinkedIn profile improvement tips, or anything career-related!</div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-xl max-w-[80%] whitespace-pre-line shadow ${msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gradient-to-r from-blue-700 via-purple-700 to-blue-800 text-blue-100 border border-blue-700 rounded-bl-none'}`}
                >
                  {msg.sender === 'ai' ? cleanAIResponse(msg.text) : msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <div className="p-4 bg-slate-900/80 border-t border-blue-700/30 flex items-end space-x-2">
            <textarea
              className="w-full p-3 rounded-xl border border-blue-700 bg-slate-800 text-blue-100 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-base resize-none transition-all duration-200 shadow-inner min-h-[48px] max-h-32"
              rows={2}
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleAsk}
              disabled={loading || !input.trim()}
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
          <div className="text-xs text-blue-300/70 text-right font-mono px-4 pb-2">Powered by DeepSeek • LinkLens</div>
        </div>
      )}
    </div>
  );
};