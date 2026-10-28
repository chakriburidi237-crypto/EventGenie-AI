'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  MapPin,
  Users,
  Wallet,
  ArrowRight,
  PlusCircle,
  Trash2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { FullEvent, EventType } from '@/lib/types';
import { getAllEvents, deleteEvent, initializeStore } from '@/lib/store';
import { formatCurrency } from '@/lib/budget';
import { useToast } from '@/components/Toast';

export default function EventsPage() {
  const { addToast } = useToast();
  const [events, setEvents] = useState<FullEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  // Delete modal state
  const [eventToDelete, setEventToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    initializeStore();
    setEvents(getAllEvents());
    setLoaded(true);
  }, []);

  const confirmDelete = () => {
    if (!eventToDelete) return;
    deleteEvent(eventToDelete.id);
    setEvents(getAllEvents());
    addToast(`Deleted event "${eventToDelete.name}"`, 'info');
    setEventToDelete(null);
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const isPast = new Date(e.setup.eventDate) < new Date();
      const matchesSearch =
        e.setup.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.setup.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.setup.theme && e.setup.theme.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = typeFilter === 'all' || e.setup.eventType === typeFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'upcoming' && !isPast) ||
        (statusFilter === 'past' && isPast);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [events, searchQuery, typeFilter, statusFilter]);

  if (!loaded) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-48" />
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Events</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {events.length} event{events.length !== 1 ? 's' : ''} organized in EventGenie AI
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:from-indigo-700 hover:to-indigo-600 transition-all text-sm"
        >
          <PlusCircle size={17} />
          Create New Event
        </Link>
      </div>

      {/* Filter and Search Bar */}
      {events.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, location, or theme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Status pills */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['all', 'upcoming', 'past'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                    statusFilter === status
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="all">All Event Types</option>
              <option value="wedding">Weddings</option>
              <option value="birthday">Birthdays</option>
              <option value="community">Community</option>
              <option value="corporate">Corporate</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <CalendarDays size={48} className="text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">No events yet</h2>
          <p className="text-slate-500 text-sm mt-1 mb-6">Create your first event and let AI help you plan every detail.</p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            <PlusCircle size={16} />
            Create Event
          </Link>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400">
          No events match your search or filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map(event => {
            const { setup } = event;
            const isPast = new Date(setup.eventDate) < new Date();
            const daysUntil = Math.ceil((new Date(setup.eventDate).getTime() - Date.now()) / 86400000);
            const totalTasks = event.tasks.length;
            const completedTasks = event.tasks.filter(t => t.status === 'completed').length;
            const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const guestCount = event.guests?.length || 0;

            return (
              <div
                key={setup.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{setup.eventName}</h3>
                      {event.isDemo && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-full">
                          SAMPLE DEMO
                        </span>
                      )}
                      {isPast ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full flex items-center gap-1">
                          <Clock size={11} /> PAST
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full">
                          {daysUntil === 0 ? 'Today!' : `${daysUntil} days away`}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <span className="flex items-center gap-1 capitalize">
                        <CalendarDays size={13} className="text-indigo-500" />
                        {setup.eventType} · {new Date(setup.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" /> {setup.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={13} className="text-slate-400" /> {setup.guestCount} capacity ({guestCount} in list)
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet size={13} className="text-emerald-500" /> {formatCurrency(setup.totalBudget, setup.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEventToDelete({ id: setup.id, name: setup.eventName })}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition"
                      title="Delete event"
                    >
                      <Trash2 size={16} />
                    </button>
                    <Link
                      href={`/events/${setup.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 rounded-xl font-semibold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
                    >
                      View & Manage <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${taskProgress}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {taskProgress}% tasks done ({completedTasks}/{totalTasks})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span>{event.vendors.length} vendor{event.vendors.length !== 1 ? 's' : ''}</span>
                    {event.plan ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Sparkles size={12} /> AI Plan Active
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1">
                        <AlertTriangle size={12} /> No AI Plan
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <span className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60">
                <AlertTriangle size={24} />
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{eventToDelete.name}"</span>?
              All associated budget plans, tasks, vendors, and guest records will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
              >
                Yes, Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
