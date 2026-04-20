'use client';

import { cn } from '@/lib/utils';

interface ModernSpinnerProps {
  className?: string;
}

export function ModernSpinner({ className }: ModernSpinnerProps) {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Background ring */}
      <div className="h-12 w-12 rounded-full border-4 border-slate-100 dark:border-slate-800" />
      
      {/* Main spinning ring with gradient-like effect using borders */}
      <div className="absolute h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(37,99,235,0.3)]" />
      
      {/* Secondary inner ring spinning faster in reverse for a "complex" feel */}
      <div className="absolute h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-b-transparent opacity-60" 
           style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      
      {/* Subtle pulse core */}
      <div className="absolute h-3 w-3 animate-pulse rounded-full bg-blue-400/50 blur-[2px]" />
    </div>
  );
}
