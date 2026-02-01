import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'glass' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({ className = '', variant = 'white', padding = 'md', children, ...props }: CardProps) => {
  
  const variants = {
    white: "bg-white border border-gray-100 shadow-sm",
    glass: "bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm",
    gradient: "bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-md",
  };

  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div 
      className={`rounded-[2rem] ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
