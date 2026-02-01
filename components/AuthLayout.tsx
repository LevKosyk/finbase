import Link from "next/link";
import { Wallet, ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface AuthStep {
  icon: ReactNode;
  title: string;
  description: string;
}

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  currentStep?: number; // Current step number (1-indexed)
  totalSteps?: number; // Total number of steps
  stepContent?: AuthStep; // Content for the current step
}

export default function AuthLayout({ 
  children, 
  title, 
  subtitle, 
  currentStep = 1,
  totalSteps = 1,
  stepContent
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16 relative animate-in fade-in slide-in-from-left-8 duration-700">
        {/* Back Button */}
        <Link 
          href="/" 
          className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Назад
        </Link>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{title}</h1>
            <p className="text-gray-500 text-lg">{subtitle}</p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            {children}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Finbase. Всі права захищено.
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex w-1/2 bg-[var(--fin-primary)] text-white relative overflow-hidden flex-col items-center justify-center p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--fin-primary)] to-blue-700"></div>
        
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10 max-w-lg text-center flex-1 flex flex-col justify-center">
          {stepContent ? (
            <>
              <div className="mb-8 relative inline-block mx-auto animate-in fade-in zoom-in-50 duration-700">
                 <div className="absolute inset-0 bg-blue-400/30 blur-2xl rounded-full"></div>
                 <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
                    {stepContent.icon}
                 </div>
              </div>
              <h2 className="text-3xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">{stepContent.title}</h2>
              <p className="text-blue-100 text-lg leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                {stepContent.description}
              </p>
            </>
          ) : (
            <>
              <div className="mb-8 relative inline-block mx-auto animate-in fade-in zoom-in-50 duration-700">
                 <div className="absolute inset-0 bg-blue-400/30 blur-2xl rounded-full"></div>
                 <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
                    <Wallet className="w-24 h-24 text-white" />
                 </div>
              </div>
              <h2 className="text-3xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">Керуйте фінансами легко</h2>
              <p className="text-blue-100 text-lg leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                "Finbase допоміг мені навести лад у документах за лічені дні. Тепер я не хвилююсь про штрафи та забуті звіти."
              </p>
            </>
          )}
        </div>

        {/* Progress Indicator */}
        {totalSteps > 1 && (
          <div className="relative z-10 mt-8 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index + 1 === currentStep
                    ? 'w-12 bg-white'
                    : 'w-1.5 bg-white/40'
                }`}
              ></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
