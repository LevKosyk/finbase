"use client";

import React, { createContext, useContext, useState } from "react";

interface UIContextType {
  isAIHelperOpen: boolean;
  initialMessage: string | null;
  openAIHelper: (msg?: string) => void;
  closeAIHelper: () => void;
  toggleAIHelper: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isAIHelperOpen, setIsAIHelperOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  const openAIHelper = (msg?: string) => {
      if (msg) setInitialMessage(msg);
      setIsAIHelperOpen(true);
  };
  const closeAIHelper = () => {
      setIsAIHelperOpen(false);
      // Optional: clear message on close, or keep it? Clearing is safer related to re-opens.
       setTimeout(() => setInitialMessage(null), 300); // clear after animation
  };
  const toggleAIHelper = () => setIsAIHelperOpen(prev => !prev);
  
  return (
    <UIContext.Provider value={{ isAIHelperOpen, initialMessage, openAIHelper, closeAIHelper, toggleAIHelper }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
