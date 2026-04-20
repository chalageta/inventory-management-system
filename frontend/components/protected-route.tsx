'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ModernSpinner } from '@/components/ui/modern-spinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Wait until loading finishes
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/'); // redirect to login only if done loading
    }
  }, [loading, isAuthenticated, router]);

  // Show modern loader while fetching user
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6 p-10 rounded-2xl">
          <ModernSpinner />
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 uppercase tracking-widest text-[10px]">
              Authenticating
            </h3>
            <div className="h-1 w-12 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Render nothing if not authenticated after loading
  if (!isAuthenticated) return null;

  return <>{children}</>;
}