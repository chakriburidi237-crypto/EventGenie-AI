'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, AlertCircle, ArrowRight, TrendingUp, Sparkles, TrendingDown } from 'lucide-react';
import { FullEvent } from '@/lib/types';
import { getAllEvents, updateEvent, initializeStore } from '@/lib/store';
import { calculateTotalEstimated, calculateTotalActual, calculateRemainingBudget, isOverBudget, formatCurrency } from '@/lib/budget';

export default function BudgetOverviewPage() {
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
    return <div className="space-y-4"><div className="skeleton h-10 w-48" /><div className="skeleton h-64 rounded-2xl" /></div>;
  }

  const selectedEvent = events.find(e => e.setup.id === selectedEventId) || events[0];

  if (!selectedEvent) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <Wallet size={48} className="text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">No Events Found</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">Create an event first to start tracking and budgeting.</p>
        <Link href="/create" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold">
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

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Smart Budget Planner</h1>
          <p className="text-slate-500 mt-1">Track allocations, estimate expenses, and avoid overspending.</p>
        </div>

        {events.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Event:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500"
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Budget</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(budget.totalBudget, budget.currency)}</p>
          <span className="text-xs text-slate-400 mt-1 block">Set during setup</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Total</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(totalEstimated, budget.currency)}</p>
          <span className="text-xs text-slate-400 mt-1 block">Sum of all planned categories</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actual Spent</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalActual, budget.currency)}</p>
          <span className="text-xs text-slate-400 mt-1 block">Paid / confirmed invoices</span>
        </div>
        <div className={`p-5 rounded-2xl border shadow-sm ${over ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Remaining</span>
          <p className={`text-2xl font-bold mt-1 ${over ? 'text-red-600' : 'text-emerald-700'}`}>
            {formatCurrency(remaining, budget.currency)}
          </p>
          <span className={`text-xs font-semibold block mt-1 ${over ? 'text-red-600' : 'text-emerald-600'}`}>
            {over ? 'Over budget by ' + formatCurrency(totalEstimated - budget.totalBudget, budget.currency) : 'Within budget'}
          </span>
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Category Allocation Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Edit planned estimates and actual spend per category.</p>
          </div>
          <Link
            href={`/events/${selectedEvent.setup.id}`}
            className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
          >
            Manage full event <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Estimated ({budget.currency})</th>
                <th className="py-3 px-4 font-semibold">Actual ({budget.currency})</th>
                <th className="py-3 px-4 font-semibold">% of Budget</th>
                <th className="py-3 px-4 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {budget.categories.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-4 font-semibold text-slate-800">{cat.name}</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={cat.estimated}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const updated = [...budget.categories];
                        updated[idx] = { ...cat, estimated: val };
                        updateEvent(selectedEvent.setup.id, { budget: { ...budget, categories: updated } });
                        setEvents(getAllEvents());
                      }}
                      className="w-28 px-2 py-1 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={cat.actual}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const updated = [...budget.categories];
                        updated[idx] = { ...cat, actual: val };
                        updateEvent(selectedEvent.setup.id, { budget: { ...budget, categories: updated } });
                        setEvents(getAllEvents());
                      }}
                      className="w-28 px-2 py-1 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">
                    {budget.totalBudget > 0 ? `${Math.round((cat.estimated / budget.totalBudget) * 100)}%` : '0%'}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    <input
                      type="text"
                      value={cat.notes}
                      onChange={(e) => {
                        const updated = [...budget.categories];
                        updated[idx] = { ...cat, notes: e.target.value };
                        updateEvent(selectedEvent.setup.id, { budget: { ...budget, categories: updated } });
                        setEvents(getAllEvents());
                      }}
                      placeholder="Add note..."
                      className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:border-indigo-500"
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
