"use client";

import { useState, useRef, useEffect } from "react";
import { 
  SendHorizontal, 
  Bot, 
  User, 
  X, 
  Sparkles,
  Maximize2,
  Minimize2
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIHelperProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIHelper({ isOpen, onClose }: AIHelperProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Привіт! Я ваш AI-помічник Finbase. Чим можу допомогти вам сьогодні? Ви можете запитати мене про податки, звіти або як користуватися сервісом.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
        scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Це демонстраційна версія чату. Незабаром я зможу відповідати на складні запитання, використовуючи базу знань Finbase. А поки що — спробуйте зареєструватися, це дуже просто!"
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-md">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--fin-primary)] text-white flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Finbase AI</h3>
                    <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Online
                    </p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50">
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${
                        msg.role === 'assistant' 
                            ? 'bg-white text-[var(--fin-primary)] border border-gray-100' 
                            : 'bg-gray-900 text-white'
                    }`}>
                        {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        msg.role === 'user' 
                            ? 'bg-[var(--fin-primary)] text-white rounded-tr-sm' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                    }`}>
                        {msg.content}
                    </div>
                </div>
            ))}
            
            {isTyping && (
                <div className="flex gap-3 mb-4">
                     <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-white text-[var(--fin-primary)] border border-gray-100 shadow-sm">
                        <Bot className="w-5 h-5" />
                    </div>
                     <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                        <div className="flex gap-1 h-4 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-white">
            <form 
                onSubmit={handleSend}
                className="relative flex items-center gap-2"
            >
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Запитайте щось..."
                    className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--fin-primary)]/20 focus:bg-white transition-all outline-none"
                />
                <button 
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="p-3 bg-[var(--fin-primary)] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--fin-secondary)] transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <SendHorizontal className="w-5 h-5" />
                </button>
            </form>
            <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-400">
                    Finbase AI v1.0 • Demo
                </p>
            </div>
        </div>
      </div>
    </>
  );
}
