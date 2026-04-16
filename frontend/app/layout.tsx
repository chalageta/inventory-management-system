import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inventory Management System',
  description:
    'A modern inventory management system for tracking stock, sales, and purchases efficiently.',
  icons: {
    icon: '/images/logo/gilando_logo.webp', // ✅ logo as favicon
  },
  openGraph: {
    title: 'Inventory Management System',
    description:
      'Manage your inventory, sales, and purchases in one unified platform.',
    images: ['/images/logo/gilando_logo.webp'], // ✅ social preview logo
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inventory Management System',
    images: ['/images/logo/gilando_logo.webp'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}