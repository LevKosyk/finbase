"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { getAIResponse } from "@/app/actions/chat";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'Привіт! Я ваш фінансовий асистент Finbase AI. Я знаю ваші доходи та податкову групу. Чим можу допомогти?' }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Prepare history for API (excluding initial greeting to save tokens if needed, or keep it)
    // We send only the new message history to the server action
    const history = [...messages, userMsg].filter(m => m.role !== 'system'); // simple filter

    const response = await getAIResponse(history);
    
    setLoading(false);

    if (response.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Вибачте, виникла помилка. Перевірте налаштування API ключа.' }]);
    } else {
        setMessages(prev => [...prev, response]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto pb-6">
       <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Фінансовий Асистент</h1>
                <p className="text-gray-500 text-sm">Запитайте про податки, доходи чи аналітику</p>
            </div>
       </div>

       {/* Chat Container */}
       <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-50"></div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                {messages.map((m, i) => (
                    <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-gray-100' : 'bg-indigo-100'}`}>
                            {m.role === 'user' ? <User className="w-5 h-5 text-gray-600" /> : <Bot className="w-5 h-5 text-indigo-600" />}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                            m.role === 'user' 
                                ? 'bg-gray-900 text-white rounded-tr-none' 
                                : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
                        }`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-4">
                         <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 animate-pulse">
                            <Bot className="w-5 h-5 text-indigo-600" />
                        </div>
                         <div className="bg-gray-50 rounded-2xl p-4 rounded-tl-none border border-gray-100 flex items-center gap-2 text-gray-400 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Думаю...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 bg-white relative z-10">
                <form onSubmit={handleSubmit} className="relative">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Напишіть ваше питання..." 
                        className="w-full pl-6 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                    />
                    <button 
                        type="submit" 
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
       </div>
    </div>
  );
}
