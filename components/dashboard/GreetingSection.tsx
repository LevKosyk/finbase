"use client";

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Edit2, Plus, FileText, ArrowUpRight } from "lucide-react";
import Link from 'next/link';

export default function GreetingSection() {
  const profileCompletion = 70;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Welcome Card - Clean & Minimal */}
      <div className="md:col-span-3 bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-white rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none opacity-50"></div>
        
        <div className="relative z-10">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                Привіт, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--fin-primary)] to-blue-600">Lev</span>! 👋
            </h1>
            <p className="text-gray-500 text-lg">
                Ваш фінансовий статус в порядку.
            </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
             <Link href="/dashboard/income" className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-gray-200 hover:bg-gray-800 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                <Plus className="w-4 h-4" />
                Додати дохід
             </Link>
             <Link href="/dashboard/statistics" className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl text-sm font-bold border border-gray-200 hover:bg-gray-50 transition-all">
                <ArrowUpRight className="w-4 h-4" />
                Аналітика
             </Link>
        </div>
      </div>

      {/* Completion Widget - Compact */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-[var(--fin-primary)]/20 transition-colors">
         <div className="w-20 h-20 mb-3 relative">
            <CircularProgressbar 
                value={profileCompletion} 
                text={`${profileCompletion}%`} 
                styles={buildStyles({
                    pathColor: `var(--fin-primary)`,
                    textColor: '#1f2937',
                    trailColor: '#f3f4f6',
                    textSize: '22px',
                    pathTransitionDuration: 0.5,
                })}
            />
         </div>
         <h3 className="font-bold text-gray-900 text-sm">Профіль</h3>
         <Link href="/dashboard/settings" className="text-[var(--fin-primary)] text-xs font-bold hover:underline mt-1">
            Заповнити дані
         </Link>
      </div>
    </div>
  );
}
