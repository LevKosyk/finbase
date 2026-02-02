'use client';

import { useState } from 'react';
import { Bot } from 'lucide-react';
import AiChat from './AiChat';

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-300 z-50 group ${
            isOpen 
            ? 'bg-zinc-800 rotate-90 scale-0 opacity-0' 
            : 'bg-gradient-to-tr from-blue-600 to-indigo-600 hover:shadow-blue-500/25 rotate-0 scale-100 opacity-100'
        }`}
      >
        <Bot className="w-6 h-6 text-white" />
      </button>

      {/* Invisible toggle wrapper to handle close/open transition smoothly if needed, but for now just rendering conditionally in AiChat works or we can control it here */}
      <AiChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
      
      {/* Re-add button if chat is open? No, typically FAB transforms or disappears. 
          Let's make the FAB disappear when open, and the Chat window has a close button. 
          Wait, if I close the chat window, I need the FAB back.
          My logic above hides the FAB when open.
          When AiChat calls onClose, setIsOpen(false), FAB reappears. 
          Perfect. 
      */}
      
      {/* 
        Actually, let's keep the FAB visible but change its icon or style?
        The user might want to collapse the chat quickly.
        The design rule "glassmorphism" suggests a clean UI.
        Let's stick to: FAB hides, Chat opens. Chat close -> FAB returns.
       */}
       
       { isOpen && (
           <button
             onClick={() => setIsOpen(false)}
             className="fixed bottom-6 right-6 p-4 bg-zinc-800 dark:bg-zinc-700 text-white rounded-full shadow-lg z-40 hover:bg-zinc-700 transition-all animate-in fade-in zoom-in duration-200"
             title="Close Chat"
           >
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
           </button>
       )}
    </>
  );
}
