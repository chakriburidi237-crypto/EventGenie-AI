'use client';

import Link from 'next/link';
import { Sparkles, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-inner">
        <Sparkles size={40} />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-5xl">
        404 — Page Not Found
      </h1>
      <p className="mt-4 text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        The celebration page or event plan you are looking for doesn&apos;t exist or has been relocated.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all text-sm"
        >
          <Home size={18} />
          Back to Dashboard
        </Link>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
        >
          <ArrowLeft size={18} />
          View Events
        </Link>
      </div>
    </div>
  );
}
