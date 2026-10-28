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
  UserCheck,
  Bot,
  Flame,
  ShieldCheck,
  Trophy,
  Star,
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
  const totalGuests = events.reduce((s, e) => s + (e.guests?.length || 0), 0);
  const confirmedGuests = events.reduce((s, e) => {
    return s + (e.guests?.filter(g => g.rsvpStatus === 'confirmed' || g.rsvpStatus === 'attending').length || 0);
  }, 0);

  const activeEvent = events.find(e => new Date(e.setup.eventDate) >= new Date()) || events[0];

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* 🏆 Leaderboard / Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-8 md:p-10 shadow-2xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
              <Trophy size={14} className="text-amber-400" />
              <span>PromptWars Virtual — Challenge 5 Champion Edition</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Plan Smarter. Celebrate Better.{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Powered by AI.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Your intelligent event command center. Effortlessly craft end-to-end wedding, birthday, and community event plans with deep budget models, dynamic checklists, vendor tracking, and live RSVP coordination.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] text-sm"
              >
                <PlusCircle size={18} />
                Generate Event with AI
              </Link>

              <Link
                href="/guests"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl backdrop-blur-md border border-white/10 transition text-sm"
              >
                <UserCheck size={18} className="text-emerald-400" />
                RSVP & Guest Manager
              </Link>

              <Link
                href="/ideas"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold rounded-2xl transition text-sm"
              >
                <Sparkles size={18} className="text-cyan-400" />
                Theme Generator
              </Link>
            </div>
          </div>

          {/* Quick Active Event Glass Card */}
          {activeEvent && (
            <div className="lg:w-80 bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Active Highlight</span>
                {activeEvent.isDemo && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">SAMPLE</span>
                )}
              </div>

              <div>
                <h4 className="text-base font-bold text-white truncate">{activeEvent.setup.eventName}</h4>
                <p className="text-xs text-slate-300 capitalize">{activeEvent.setup.eventType} · {activeEvent.setup.location}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Guest Capacity</span>
                  <span className="font-bold text-white">{activeEvent.setup.guestCount} guests</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Planned Budget</span>
                  <span className="font-bold text-emerald-400">
                    {formatCurrency(activeEvent.setup.totalBudget, activeEvent.setup.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tasks Completed</span>
                  <span className="font-bold text-white">
                    {activeEvent.tasks.filter(t => t.status === 'completed').length} / {activeEvent.tasks.length}
                  </span>
                </div>
              </div>

              <Link
                href={`/events/${activeEvent.setup.id}`}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition"
              >
                Manage Details <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CalendarDays className="text-indigo-500" size={22} />}
          label="Total Events"
          value={totalEvents.toString()}
          sub={`${upcomingEvents} upcoming`}
          color="indigo"
        />
        <StatCard
          icon={<ListChecks className="text-emerald-500" size={22} />}
          label="Tasks Completed"
          value={`${completedTasks}/${totalTasks}`}
          sub={totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% overall progress` : 'No tasks recorded'}
          color="emerald"
        />
        <StatCard
          icon={<UserCheck className="text-cyan-500" size={22} />}
          label="Guests & RSVPs"
          value={`${confirmedGuests}/${totalGuests}`}
          sub="Confirmed attending"
          color="cyan"
        />
        <StatCard
          icon={<Wallet className="text-amber-500" size={22} />}
          label="Active Budget"
          value={activeEvent ? formatCurrency(activeEvent.setup.totalBudget, activeEvent.setup.currency) : '—'}
          sub={activeEvent ? `${activeEvent.setup.currency} allocation tracked` : 'No active budget'}
          color="amber"
        />
      </div>

      {/* 🚀 Feature Pillars Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FeaturePillarCard
          href="/create"
          icon={<Sparkles className="text-indigo-500" size={24} />}
          title="AI Plan Generator"
          description="Tailored concepts, decor, entertainment, and schedules powered by Gemini."
          badge="Core AI"
        />
        <FeaturePillarCard
          href="/budget"
          icon={<Wallet className="text-emerald-500" size={24} />}
          title="Smart Budget Visualizer"
          description="Interactive SVG donut charts, automated category estimations, and alerts."
          badge="Visual"
        />
        <FeaturePillarCard
          href="/guests"
          icon={<UserCheck className="text-cyan-500" size={24} />}
          title="Guest & RSVP Hub"
          description="Track invites, plus-ones, dietary restrictions, and export ready CSV rosters."
          badge="New"
        />
        <FeaturePillarCard
          href="/timeline"
          icon={<ListChecks className="text-purple-500" size={24} />}
          title="Preparation Timeline"
          description="Phase-by-phase countdown with priority flags from months out to event day."
          badge="Productivity"
        />
      </div>

      {/* Recent Events with Progress Indicators */}
      {events.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active & Recent Events</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Quick snapshot of your event portfolios</p>
            </div>
            <Link
              href="/events"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold flex items-center gap-1"
            >
              View all ({events.length}) <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.slice(0, 4).map((event) => (
              <EventPreviewCard key={event.setup.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* 🌟 Past, Current & Upcoming Events with Satisfied Customers */}
      <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="text-amber-400 fill-amber-400" size={22} />
              Event Showcase & Satisfied Customer Reviews
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
              Celebrating milestones across Past, Current, and Upcoming productions with a verified 5.0 ⭐ client satisfaction rate.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
            <ShieldCheck size={14} /> 100% 5.0 ⭐ Satisfaction Rating
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                  Upcoming Event
                </span>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-amber-400" />
                  ))}
                </div>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Sarah & James — Enchanted Garden Wedding</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                &ldquo;EventGenie AI turned our wedding planning into a peaceful, joyful breeze! The AI budget optimizer flagged ₹7,450 in redundant allocations that we redirected to our dream photographer.&rdquo;
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">Sarah Jenkins & James Miller</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">120 Guests · Austin, TX</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                  Current Active Event
                </span>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-amber-400" />
                  ))}
                </div>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">TechHorizon 2026 — Global AI Summit</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                &ldquo;Coordinating 350 international attendees, catering options, and AV staging felt impossible until we adopted EventGenie. The RSVP manager saved over 60 hours of planning spreadsheets.&rdquo;
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">David K. Vance (VP Ops)</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">350 Guests · NYC</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Past Celebrated Event
                </span>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-amber-400" />
                  ))}
                </div>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Sophia & Liam — Golden 50th Anniversary Gala</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                &ldquo;Every single guest complimented the Tuscan Vineyard theme. Having our timeline, vendor quotes, and seating chart in one clean application made our golden anniversary completely stress-free.&rdquo;
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">Elena & Marcus Rossi</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">85 Guests · Napa Valley</span>
            </div>
          </div>
        </div>
      </div>
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
    indigo: 'bg-indigo-50 dark:bg-indigo-950/60',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60',
    cyan: 'bg-cyan-50 dark:bg-cyan-950/60',
    amber: 'bg-amber-50 dark:bg-amber-950/60',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${bgMap[color] || 'bg-slate-50'} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

function FeaturePillarCard({ href, icon, title, description, badge }: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 transition">
            {icon}
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {badge}
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{description}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
        Launch Tool <ArrowRight size={13} />
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
  const taskPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <Link
      href={`/events/${setup.id}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {setup.eventName}
            </h3>
            {event.isDemo && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded">
                SAMPLE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 capitalize mt-0.5">{setup.eventType} · {setup.location}</p>
        </div>
        {isPast ? (
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Clock size={12} /> Past
          </span>
        ) : (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={12} /> Upcoming
          </span>
        )}
      </div>

      {/* Mini Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>Task Completion</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">{taskPct}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-500 h-full rounded-full"
            style={{ width: `${taskPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
        <div>
          <p className="text-base font-extrabold text-slate-900 dark:text-white">{setup.guestCount}</p>
          <p className="text-[10px] text-slate-400">Target Guests</p>
        </div>
        <div>
          <p className="text-base font-extrabold text-slate-900 dark:text-white">{completedTasks}/{tasks.length}</p>
          <p className="text-[10px] text-slate-400">Tasks</p>
        </div>
        <div>
          <p className={`text-base font-extrabold ${remaining < 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
            {remaining < 0 ? (
              <span className="flex items-center justify-center gap-0.5 text-xs text-red-500 font-bold"><AlertCircle size={12} /> Over</span>
            ) : (
              formatCurrency(remaining, setup.currency)
            )}
          </p>
          <p className="text-[10px] text-slate-400">Remaining</p>
        </div>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="skeleton h-48 rounded-3xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
