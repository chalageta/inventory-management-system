'use client';

import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { ProtectedRoute } from '@/components/protected-route';
import { Toaster } from 'sonner';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">

        {/* DESKTOP SIDEBAR: Completely hidden on mobile, fixed on large screens (lg) */}
        <aside className="hidden lg:block h-full shrink-0">
          <Sidebar />
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto">
              {children}
              <Toaster position="top-right" richColors />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}