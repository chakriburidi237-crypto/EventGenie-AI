import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { ToastProvider } from '@/components/Toast';
import AIChatWidget from '@/components/AIChatWidget';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'EventGenie AI — Plan Smarter. Celebrate Better.',
  description: 'AI-powered celebration & event planning platform for weddings, birthdays, anniversaries, and community gatherings. Features smart budget charts, timeline milestones, vendor tracking, and guest RSVP management.',
  keywords: [
    'event planning',
    'celebration planner',
    'wedding planner',
    'birthday planner',
    'smart budget planner',
    'AI event assistant',
    'RSVP tracker',
    'vendor management',
  ],
  authors: [{ name: 'Surya Chakradhar Buridi' }],
  openGraph: {
    title: 'EventGenie AI — Celebration & Event Planner',
    description: 'Intelligent full-lifecycle event planning powered by Google Gemini and Next.js 16.',
    url: 'https://event-genie-ai-five.vercel.app',
    siteName: 'EventGenie AI',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200`}>
        <ToastProvider>
          <div className="flex min-h-screen">
            <Suspense fallback={<div className="w-64 bg-slate-900 h-screen hidden lg:block" />}>
              <Sidebar />
            </Suspense>
            <main className="flex-1 lg:ml-64 min-h-screen">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </div>
            </main>
          </div>
          <Suspense fallback={null}>
            <AIChatWidget />
          </Suspense>
        </ToastProvider>
      </body>
    </html>
  );
}
