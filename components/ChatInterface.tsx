
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isTyping: boolean;
  persona: 'teacher' | 'student';
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isOpen, onClose, messages, onSendMessage, isTyping, persona
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isTeacher = persona === 'teacher';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isTyping) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" 
          onClick={onClose}
        ></div>
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${
        isTeacher 
          ? 'bg-[#fcfbf9] dark:bg-stone-950 border-l border-stone-200 dark:border-stone-800' 
          : 'bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800'
      }`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isTeacher 
            ? 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800' 
            : 'bg-indigo-600 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <Bot className={`w-5 h-5 ${isTeacher ? 'text-emerald-600' : 'text-white'}`} />
            <h3 className={`font-bold text-lg ${isTeacher ? 'text-stone-800 dark:text-stone-100' : 'text-white'}`}>
              AI Tutor
            </h3>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isTeacher 
                ? 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500' 
                : 'hover:bg-white/20 text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          isTeacher ? 'bg-stone-50/50 dark:bg-stone-950' : 'bg-slate-50 dark:bg-slate-900'
        }`}>
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                <Sparkles className={`w-12 h-12 mb-4 ${isTeacher ? 'text-emerald-300' : 'text-indigo-300'}`} />
                <p className={`text-sm font-medium ${isTeacher ? 'text-stone-500' : 'text-slate-500'}`}>
                  Ask me anything about your homework! I can explain steps, clarify feedback, or help with concepts.
                </p>
             </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                  isUser
                    ? (isTeacher 
                        ? 'bg-emerald-600 text-white rounded-br-none' 
                        : 'bg-indigo-600 text-white rounded-br-none')
                    : (isTeacher
                        ? 'bg-white border border-stone-200 text-stone-800 rounded-bl-none dark:bg-stone-800 dark:border-stone-700 dark:text-stone-100'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100')
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex justify-start">
               <div className={`rounded-2xl rounded-bl-none p-3 border shadow-sm ${
                 isTeacher 
                   ? 'bg-white border-stone-200 dark:bg-stone-800 dark:border-stone-700' 
                   : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'
               }`}>
                 <Loader2 className={`w-4 h-4 animate-spin ${
                   isTeacher ? 'text-emerald-600' : 'text-indigo-600'
                 }`} />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form 
          onSubmit={handleSubmit}
          className={`p-4 border-t ${
            isTeacher 
              ? 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800' 
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
          }`}
        >
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question..."
              className={`flex-1 px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                isTeacher
                  ? 'bg-stone-50 border-stone-200 focus:ring-emerald-500/20 focus:border-emerald-500 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-100 dark:placeholder-stone-500'
                  : 'bg-slate-50 border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500'
              }`}
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={`p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isTeacher
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
