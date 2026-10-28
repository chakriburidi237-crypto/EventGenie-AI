'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { FullEvent } from '@/lib/types';
import { getAllEvents, deleteEvent, initializeStore } from '@/lib/store';
import { formatCurrency } from '@/lib/budget';

export default function EventsPage() {
  const [events, setEvents] = useState<FullEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initializeStore();
    setEvents(getAllEvents());
    setLoaded(true);
  }, []);

  function handleDelete(id: string, name: string) {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteEvent(id);
      setEvents(getAllEvents());
    }
  }

  if (!loaded) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-48" />
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Events</h1>
          <p className="text-slate-500 mt-1">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:shadow-xl transition-all"
        >
          <PlusCircle size={16} />
          New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CalendarDays size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">No events yet</h2>
          <p className="text-slate-500 mt-1 mb-6">Create your first event and let AI help you plan it.</p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            <PlusCircle size={16} />
            Create Event
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => {
            const { setup } = event;
            const isPast = new Date(setup.eventDate) < new Date();
            const daysUntil = Math.ceil((new Date(setup.eventDate).getTime() - Date.now()) / 86400000);
            const completedTasks = event.tasks.filter(t => t.status === 'completed').length;

            return (
              <div
                key={setup.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-slate-900">{setup.eventName}</h3>
                      {event.isDemo && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">SAMPLE</span>
                      )}
                      {isPast && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded flex items-center gap-0.5">
                          <Clock size={10} /> PAST
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1 capitalize">
                        <CalendarDays size={14} /> {setup.eventType} · {new Date(setup.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {setup.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {setup.guestCount} guests
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet size={14} /> {formatCurrency(setup.totalBudget, setup.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      {!isPast && (
                        <span className="text-indigo-600 font-medium">{daysUntil} day{daysUntil !== 1 ? 's' : ''} away</span>
                      )}
                      <span>{completedTasks}/{event.tasks.length} tasks done</span>
                      <span>{event.vendors.length} vendor{event.vendors.length !== 1 ? 's' : ''}</span>
                      {event.plan ? (
                        <span className="text-emerald-600">AI plan generated</span>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-0.5"><AlertTriangle size={10} /> No AI plan</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(setup.id, setup.eventName)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete event"
                    >
                      <Trash2 size={16} />
                    </button>
                    <Link
                      href={`/events/${setup.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium text-sm hover:bg-indigo-100 transition-colors"
                    >
                      View <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
