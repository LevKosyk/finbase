import React from 'react';
import Loader from './Loader';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-[var(--fin-primary)] text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5",
      secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
      outline: "bg-transparent text-[var(--fin-primary)] border-2 border-[var(--fin-primary)] hover:bg-blue-50",
      ghost: "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100",
      danger: "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-12 px-6 text-base",
      lg: "h-14 px-8 text-lg",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader size="sm" variant={variant === 'primary' ? 'white' : 'primary'} />}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
