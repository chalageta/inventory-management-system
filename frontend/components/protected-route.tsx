'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

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

  // Show loader while fetching user
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Render nothing if not authenticated after loading
  if (!isAuthenticated) return null;

  return <>{children}</>;
}