import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'EventGenie AI — Plan Smarter. Celebrate Better.',
  description: 'AI-powered event planning assistant for weddings, birthdays, and community events. Generate personalized plans, manage budgets, timelines, and vendors.',
  keywords: 'event planning, AI planner, wedding planner, birthday planner, budget planner',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
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
      </body>
    </html>
  );
}
