"use client";

import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'primary' | 'white' | 'gray';
    className?: string;
    text?: string;
    fullScreen?: boolean;
}

export default function Loader({ 
    size = 'md', 
    variant = 'primary', 
    className,
    text,
    fullScreen = false
}: LoaderProps) {
    
    // Size Map
    const sizes = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-10 h-10",
        xl: "w-16 h-16"
    };

    // Color Map
    const colors = {
        primary: "text-[var(--fin-primary)]",
        white: "text-white",
        gray: "text-gray-400"
    };

    const loaderContent = (
        <div className={cn("flex flex-col items-center gap-3", className)}>
            <div className="relative">
                {/* Outer Glow */}
                <div className={cn(
                    "absolute inset-0 rounded-full blur-xl opacity-20 animate-pulse",
                    variant === 'primary' ? "bg-blue-500" : "bg-white"
                )}></div>
                
                {/* Spinner */}
                <Loader2 className={cn(
                    "animate-spin", 
                    sizes[size], 
                    colors[variant]
                )} />
            </div>
            {text && (
                <p className={cn(
                    "text-sm font-bold animate-pulse",
                    variant === 'white' ? "text-white/80" : "text-gray-500"
                )}>
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
                {loaderContent}
            </div>
        );
    }

    return loaderContent;
}
