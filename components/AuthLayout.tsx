import Link from "next/link";
import { Wallet, ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  image?: ReactNode; // Optional custom content for the right side
}

export default function AuthLayout({ children, title, subtitle, image }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16 relative">
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 group text-gray-900 font-bold text-xl">
             <div className="w-8 h-8 bg-[var(--fin-primary)] rounded-lg flex items-center justify-center text-white shadow-md">
              <Wallet className="w-4 h-4" />
            </div>
            Finbase
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{title}</h1>
            <p className="text-gray-500 text-lg">{subtitle}</p>
          </div>

          {children}
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Finbase. Всі права захищено.
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex w-1/2 bg-[var(--fin-primary)] text-white relative overflow-hidden items-center justify-center p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--fin-primary)] to-blue-700"></div>
        
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10 max-w-lg text-center">
            {image ? image : (
                <>
                  <div className="mb-8 relative inline-block">
                     <div className="absolute inset-0 bg-blue-400/30 blur-2xl rounded-full"></div>
                     <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
                        <Wallet className="w-24 h-24 text-white" />
                     </div>
                  </div>
                  <h2 className="text-3xl font-bold mb-6">Керуйте фінансами легко</h2>
                  <p className="text-blue-100 text-lg leading-relaxed">
                    "Finbase допоміг мені навести лад у документах за лічені дні. Тепер я не хвилююсь про штрафи та забуті звіти."
                  </p>
                  <div className="mt-8 flex items-center justify-center gap-3">
                      <div className="h-1 w-8 bg-white rounded-full"></div>
                      <div className="h-1 w-2 bg-white/30 rounded-full"></div>
                      <div className="h-1 w-2 bg-white/30 rounded-full"></div>
                  </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
}
