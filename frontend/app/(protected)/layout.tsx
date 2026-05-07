'use client';

import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { ProtectedRoute } from '@/components/protected-route';
import { Toaster } from 'sonner';
import { useState } from 'react';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">

        {/* ✅ ALWAYS MOUNT SIDEBAR */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        {/* MAIN CONTENT */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Header setSidebarOpen={setSidebarOpen} />

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