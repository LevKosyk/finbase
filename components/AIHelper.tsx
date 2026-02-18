"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  SendHorizontal, 
  Bot, 
  User, 
  X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIHelperProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string | null;
}

export default function AIHelper({ isOpen, onClose, initialMessage }: AIHelperProps) {
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
  const hasProcessedInitialRef = useRef(false);
  const pathname = usePathname();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendUserMessage = async (content: string) => {
    if (!content.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const history = [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }));
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: history,
          currentPath: pathname,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Не вдалося отримати відповідь");
      }
      const assistant: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.assistant?.content || result.choices?.[0]?.message?.content || "Не вдалося сформувати відповідь.",
      };
      setMessages((prev) => [...prev, assistant]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Виникла помилка під час відповіді AI. Спробуйте ще раз.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      hasProcessedInitialRef.current = false;
      return;
    }

    scrollToBottom();
    if (initialMessage && !hasProcessedInitialRef.current) {
      hasProcessedInitialRef.current = true;
      void sendUserMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMessage]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const value = input;
    setInput('');
    await sendUserMessage(value);
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
            <Button 
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="!p-2 !h-auto"
            >
                <X className="w-5 h-5" />
            </Button>
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
                    <Card 
                        variant={msg.role === 'user' ? 'white' : 'white'}
                        padding="sm"
                        className={`max-w-[75%] !rounded-2xl text-sm shadow-sm ${
                            msg.role === 'user' 
                                ? 'bg-[var(--fin-primary)] text-white !rounded-tr-sm !border-none' 
                                : 'text-gray-800 !rounded-tl-sm'
                        }`}
                    >
                        {msg.content}
                    </Card>
                </div>
            ))}
            
            {isTyping && (
                <div className="flex gap-3 mb-4">
                     <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-white text-[var(--fin-primary)] border border-gray-100 shadow-sm">
                        <Bot className="w-5 h-5" />
                    </div>
                    <Card variant="white" padding="sm" className="!rounded-2xl !rounded-tl-sm shadow-sm">
                        <div className="flex gap-1 h-4 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        </div>
                    </Card>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex items-end gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Запитайте щось..."
                    rows={1}
                    className="flex-1 min-h-[44px] max-h-40 resize-none overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm leading-6 text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-[var(--fin-primary)] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
                <Button 
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || isTyping}
                    size="md"
                    className="!px-4"
                    rightIcon={<SendHorizontal className="w-5 h-5" />}
                >
                </Button>
            </div>
            <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-400">
                    Finbase AI • Context mode
                </p>
            </div>
        </div>
      </div>
    </>
  );
}
