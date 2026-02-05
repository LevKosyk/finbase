"use client";

import React, { createContext, useContext, useState } from "react";

interface UIContextType {
  isAIHelperOpen: boolean;
  openAIHelper: () => void;
  closeAIHelper: () => void;
  toggleAIHelper: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isAIHelperOpen, setIsAIHelperOpen] = useState(false);

  const openAIHelper = () => setIsAIHelperOpen(true);
  const closeAIHelper = () => setIsAIHelperOpen(false);
  const toggleAIHelper = () => setIsAIHelperOpen(prev => !prev);

  return (
    <UIContext.Provider value={{ isAIHelperOpen, openAIHelper, closeAIHelper, toggleAIHelper }}>
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
