'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Wallet,
  ListChecks,
  Users,
  Sparkles,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { FullEvent } from '@/lib/types';
import { getAllEvents, initializeStore } from '@/lib/store';
import { calculateTotalEstimated, calculateRemainingBudget, formatCurrency } from '@/lib/budget';

export default function DashboardPage() {
  const [events, setEvents] = useState<FullEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initializeStore();
    setEvents(getAllEvents());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return <DashboardSkeleton />;
  }

  const totalEvents = events.length;
  const upcomingEvents = events.filter(e => new Date(e.setup.eventDate) >= new Date()).length;
  const totalTasks = events.reduce((s, e) => s + e.tasks.length, 0);
  const completedTasks = events.reduce((s, e) => s + e.tasks.filter(t => t.status === 'completed').length, 0);
  const totalVendors = events.reduce((s, e) => s + e.vendors.length, 0);

  const activeEvent = events.find(e => new Date(e.setup.eventDate) >= new Date()) || events[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome to <span className="gradient-text">EventGenie AI</span>
          </h1>
          <p className="text-slate-500 mt-1">Plan Smarter. Celebrate Better. Powered by AI.</p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all duration-200 hover:-translate-y-0.5"
        >
          <PlusCircle size={18} />
          Create Event
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CalendarDays className="text-indigo-500" size={22} />}
          label="Total Events"
          value={totalEvents.toString()}
          sub={`${upcomingEvents} upcoming`}
          color="indigo"
        />
        <StatCard
          icon={<ListChecks className="text-emerald-500" size={22} />}
          label="Tasks"
          value={`${completedTasks}/${totalTasks}`}
          sub={totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% complete` : 'No tasks yet'}
          color="emerald"
        />
        <StatCard
          icon={<Users className="text-cyan-500" size={22} />}
          label="Vendors"
          value={totalVendors.toString()}
          sub="Across all events"
          color="cyan"
        />
        <StatCard
          icon={<Wallet className="text-amber-500" size={22} />}
          label="Active Budget"
          value={activeEvent ? formatCurrency(activeEvent.setup.totalBudget, activeEvent.setup.currency) : '—'}
          sub={activeEvent ? `${activeEvent.setup.eventName.substring(0, 25)}…` : 'No events'}
          color="amber"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          href="/create"
          icon={<PlusCircle className="text-indigo-500" size={24} />}
          title="Create New Event"
          description="Set up a new event with AI-powered planning"
        />
        <QuickActionCard
          href="/ideas"
          icon={<Sparkles className="text-purple-500" size={24} />}
          title="Explore AI Ideas"
          description="Get personalized theme and decor suggestions"
        />
        <QuickActionCard
          href="/budget"
          icon={<TrendingUp className="text-emerald-500" size={24} />}
          title="Budget Planner"
          description="Track spending and optimize allocations"
        />
      </div>

      {/* Recent Events */}
      {events.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Recent Events</h2>
            <Link href="/events" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.slice(0, 4).map((event) => (
              <EventPreviewCard key={event.setup.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    indigo: 'bg-indigo-50',
    emerald: 'bg-emerald-50',
    cyan: 'bg-cyan-50',
    amber: 'bg-amber-50',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${bgMap[color] || 'bg-slate-50'} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function QuickActionCard({ href, icon, title, description }: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{title}</h3>
      </div>
      <p className="text-sm text-slate-500">{description}</p>
      <div className="mt-3 text-sm text-indigo-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        Get started <ArrowRight size={14} />
      </div>
    </Link>
  );
}

function EventPreviewCard({ event }: { event: FullEvent }) {
  const { setup, tasks, budget } = event;
  const isPast = new Date(setup.eventDate) < new Date();
  const totalEstimated = calculateTotalEstimated(budget.categories);
  const remaining = calculateRemainingBudget(budget.totalBudget, budget.categories);
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <Link
      href={`/events/${setup.id}`}
      className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {setup.eventName}
            </h3>
            {event.isDemo && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">DEMO</span>
            )}
          </div>
          <p className="text-sm text-slate-500 capitalize">{setup.eventType}</p>
        </div>
        {isPast ? (
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Clock size={12} /> Past
          </span>
        ) : (
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={12} /> Upcoming
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-slate-900">{setup.guestCount}</p>
          <p className="text-[11px] text-slate-400">Guests</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">{completedTasks}/{tasks.length}</p>
          <p className="text-[11px] text-slate-400">Tasks</p>
        </div>
        <div>
          <p className={`text-lg font-bold ${remaining < 0 ? 'text-red-500' : 'text-slate-900'}`}>
            {remaining < 0 ? (
              <span className="flex items-center justify-center gap-0.5"><AlertCircle size={14} /> Over</span>
            ) : (
              formatCurrency(remaining, setup.currency)
            )}
          </p>
          <p className="text-[11px] text-slate-400">Remaining</p>
        </div>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="skeleton h-10 w-80" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
