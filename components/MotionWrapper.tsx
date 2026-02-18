"use client";

export default function MotionWrapper({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out ${className}`}>
      {children}
    </div>
  );
}
