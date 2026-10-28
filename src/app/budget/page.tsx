'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, AlertCircle, ArrowRight, TrendingUp, Sparkles, TrendingDown, PieChart, Check } from 'lucide-react';
import { FullEvent } from '@/lib/types';
import { getAllEvents, updateEvent, initializeStore } from '@/lib/store';
import { calculateTotalEstimated, calculateTotalActual, calculateRemainingBudget, isOverBudget, formatCurrency } from '@/lib/budget';
import DonutChart from '@/components/DonutChart';
import { useToast } from '@/components/Toast';

const CATEGORY_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#f43f5e', // Rose
];

export default function BudgetOverviewPage() {
  const { addToast } = useToast();
  const [events, setEvents] = useState<FullEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initializeStore();
    const all = getAllEvents();
    setEvents(all);
    if (all.length > 0) {
      setSelectedEventId(all[0].setup.id);
    }
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-48" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  const selectedEvent = events.find(e => e.setup.id === selectedEventId) || events[0];

  if (!selectedEvent) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Wallet size={48} className="text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Events Found</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">Create an event first to start tracking and budgeting.</p>
        <Link href="/create" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
          Create Event
        </Link>
      </div>
    );
  }

  const { setup, budget } = selectedEvent;
  const totalEstimated = calculateTotalEstimated(budget.categories);
  const totalActual = calculateTotalActual(budget.categories);
  const remaining = calculateRemainingBudget(budget.totalBudget, budget.categories);
  const over = isOverBudget(budget.totalBudget, budget.categories);

  // Prepare chart segments
  const chartSegments = budget.categories.map((cat, idx) => ({
    label: cat.name,
    value: cat.estimated,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }));

  const handleUpdateCategory = (idx: number, updates: Partial<typeof budget.categories[0]>) => {
    const updated = [...budget.categories];
    updated[idx] = { ...updated[idx], ...updates };
    updateEvent(selectedEvent.setup.id, { budget: { ...budget, categories: updated } });
    setEvents(getAllEvents());
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Wallet size={22} />
            </span>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Smart Budget Planner</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track allocations, estimate expenses, and avoid overspending with real-time charts.
          </p>
        </div>

        {events.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Event:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            >
              {events.map(ev => (
                <option key={ev.setup.id} value={ev.setup.id}>{ev.setup.eventName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedEvent.isDemo && (
        <div className="demo-banner">
          <AlertCircle size={18} />
          <span>Viewing sample demo event budget. Numbers are simulated for illustration.</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Budget</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(budget.totalBudget, budget.currency)}</p>
          <span className="text-xs text-slate-400 mt-1 block">Set during setup</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Total</span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{formatCurrency(totalEstimated, budget.currency)}</p>
          <span className="text-xs text-slate-400 mt-1 block">Sum of all planned categories</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actual Spent</span>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(totalActual, budget.currency)}</p>
          <span className="text-xs text-slate-400 mt-1 block">Paid / confirmed invoices</span>
        </div>
        <div className={`p-5 rounded-2xl border shadow-sm ${
          over
            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50'
            : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Remaining</span>
          <p className={`text-2xl font-bold mt-1 ${over ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
            {formatCurrency(remaining, budget.currency)}
          </p>
          <span className={`text-xs font-bold block mt-1 ${over ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-300'}`}>
            {over ? 'Over budget by ' + formatCurrency(totalEstimated - budget.totalBudget, budget.currency) : 'Within budget target'}
          </span>
        </div>
      </div>

      {/* Visual Chart and Category Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart size={16} className="text-indigo-500" /> Allocation Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{budget.currency}</span>
          </div>

          <DonutChart
            segments={chartSegments}
            total={totalEstimated}
            currency={budget.currency}
            size={220}
          />
        </div>

        {/* Category Budget Bars */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Category Proportions</h3>
              <p className="text-xs text-slate-400">Share of total estimated expenditure</p>
            </div>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
              {budget.categories.length} Categories
            </span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {budget.categories.map((cat, idx) => {
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              const pct = totalEstimated > 0 ? Math.round((cat.estimated / totalEstimated) * 100) : 0;
              const actualPct = cat.estimated > 0 ? Math.min(Math.round((cat.actual / cat.estimated) * 100), 100) : 0;

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">
                        Spent: <span className="text-slate-700 dark:text-slate-300 font-medium">{formatCurrency(cat.actual, budget.currency)}</span>
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(cat.estimated, budget.currency)} ({pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Detailed Allocation & Invoice Table</h2>
            <p className="text-xs text-slate-400 mt-0.5">Edit planned estimates and actual spend per category.</p>
          </div>
          <Link
            href={`/events/${selectedEvent.setup.id}`}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
          >
            Manage full event <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Estimated ({budget.currency})</th>
                <th className="py-3 px-4 font-semibold">Actual ({budget.currency})</th>
                <th className="py-3 px-4 font-semibold">% of Budget</th>
                <th className="py-3 px-4 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {budget.categories.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                    />
                    {cat.name}
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={cat.estimated}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        handleUpdateCategory(idx, { estimated: val });
                      }}
                      className="w-28 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={cat.actual}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        handleUpdateCategory(idx, { actual: val });
                      }}
                      className="w-28 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                    {budget.totalBudget > 0 ? `${Math.round((cat.estimated / budget.totalBudget) * 100)}%` : '0%'}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                    <input
                      type="text"
                      value={cat.notes}
                      onChange={(e) => {
                        handleUpdateCategory(idx, { notes: e.target.value });
                      }}
                      placeholder="Add note..."
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
