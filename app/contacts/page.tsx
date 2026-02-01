"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Send, MapPin, Phone, Github, Twitter, Linkedin, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-[var(--fin-primary)] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">Finbase</span>
          </Link>
          
          <Link href="/" className="hidden md:flex items-center gap-2 text-gray-500 hover:text-[var(--fin-primary)] font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            На головну
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden bg-[var(--fin-primary)] text-white rounded-b-[3rem] md:rounded-b-[5rem] shadow-2xl shadow-blue-900/20">
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none"></div>
         
         <div className="container mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">Зв'яжіться з нами</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Ми цінуємо ваші відгуки та пропозиції. Наша команда завжди готова допомогти вам з будь-якими питаннями.
            </p>
         </div>
      </section>

      {/* Content */}
      <section className="py-20 -mt-20 relative z-20 px-6">
        <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                
                {/* Contact Info */}
                <div className="space-y-6">
                    <Card className="h-full flex flex-col justify-center space-y-8" padding="lg">
                        <h2 className="text-2xl font-bold text-gray-900">Наші контакти</h2>
                        
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-[var(--fin-primary)] rounded-2xl flex items-center justify-center shrink-0">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                                <p className="text-gray-500 text-sm mb-2">Для загальних питань та підтримки</p>
                                <a href="mailto:support@finbase.ua" className="text-[var(--fin-primary)] font-semibold hover:underline">
                                    support@finbase.ua
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-[#2AABEE] rounded-2xl flex items-center justify-center shrink-0">
                                <Send className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Telegram Support</h3>
                                <p className="text-gray-500 text-sm mb-2">Швидкі відповіді в чаті</p>
                                <a href="https://t.me/finbase_support" className="text-[#2AABEE] font-semibold hover:underline">
                                    @finbase_support
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Офіс</h3>
                                <p className="text-gray-500 text-sm">
                                    вул. Інноваційна 1,<br/>
                                    Київ, Україна 01001
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Contact Form */}
                <Card variant="white" padding="lg" className="shadow-xl shadow-blue-900/5">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Напишіть нам</h2>
                    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input placeholder="Ваше ім'я" className="bg-gray-50 border-transparent focus:bg-white" />
                            <Input placeholder="Email" type="email" className="bg-gray-50 border-transparent focus:bg-white" />
                        </div>
                        <Input placeholder="Тема повідомлення" className="bg-gray-50 border-transparent focus:bg-white" />
                        <div>
                            <textarea 
                                placeholder="Ваше повідомлення..." 
                                rows={5}
                                className="w-full bg-gray-50 border border-transparent text-gray-900 placeholder:text-gray-400 rounded-2xl p-4 transition-all duration-200 outline-none focus:bg-white focus:border-[var(--fin-primary)] focus:ring-4 focus:ring-blue-500/10 resize-none"
                            ></textarea>
                        </div>
                        <Button className="w-full h-14 text-lg">
                            Надіслати повідомлення
                            <Send className="w-5 h-5 ml-2" />
                        </Button>
                    </form>
                </Card>

            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                    <Wallet className="w-4 h-4" />
                </div>
                <span className="font-bold text-gray-900">Finbase</span>
            </div>
            <p className="text-gray-500 text-sm">© 2026 Finbase Inc. All rights reserved.</p>
            <div className="flex gap-4">
                <a href="#" className="p-2 bg-gray-50 rounded-full text-gray-500 hover:text-[var(--fin-primary)] hover:bg-blue-50 transition-colors">
                    <Github className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 bg-gray-50 rounded-full text-gray-500 hover:text-[var(--fin-primary)] hover:bg-blue-50 transition-colors">
                    <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 bg-gray-50 rounded-full text-gray-500 hover:text-[var(--fin-primary)] hover:bg-blue-50 transition-colors">
                    <Linkedin className="w-5 h-5" />
                </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
