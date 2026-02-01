"use client";

import Link from "next/link";
import { ArrowLeft, FileQuestion, Wallet, Bot } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--fin-background)] flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Header */}
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-[var(--fin-primary)] rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Finbase</span>
        </Link>
      </header>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-8 rotate-12 shadow-inner">
           <FileQuestion className="w-12 h-12 text-[var(--fin-primary)]" />
        </div>
        
        <p className="text-[var(--fin-primary)] font-bold text-sm uppercase tracking-widest mb-4">
          Помилка 404
        </p>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Сторінку не знайдено
        </h1>
        
        <p className="text-lg text-gray-600 mb-10 max-w-md mx-auto leading-relaxed">
          Схоже, сторінка, яку ви шукаєте, була переміщена або ніколи не існувала.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-[var(--fin-primary)] text-white font-semibold shadow-lg shadow-blue-500/20 hover:bg-[var(--fin-secondary)] hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
            На головну
          </Link>
          <Link
            href="/helper"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-white text-gray-700 font-semibold border border-gray-200 hover:bg-gray-50 hover:text-[var(--fin-primary)] transition-all"
          >
            <Bot className="w-5 h-5" />
            Запитати AI
          </Link>
        </div>
      </div>
      
       <footer className="p-6 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Finbase.
      </footer>
    </main>
  );
}
