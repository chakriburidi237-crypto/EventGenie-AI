'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users2, Plus, Trash2 } from 'lucide-react';
import { FullEvent, BookingStatus } from '@/lib/types';
import { getAllEvents, addVendor, updateVendor, deleteVendor, initializeStore } from '@/lib/store';
import { formatCurrency } from '@/lib/budget';

export default function VendorsPage() {
  const [events, setEvents] = useState<FullEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    serviceCategory: 'Venue',
    bookingStatus: 'contacted' as BookingStatus,
    contactNotes: '',
    estimatedCost: 0,
    phone: '',
    email: '',
  });

  useEffect(() => {
    initializeStore();
    const all = getAllEvents();
    setEvents(all);
    if (all.length > 0) setSelectedEventId(all[0].setup.id);
    setLoaded(true);
  }, []);

  function refresh() {
    setEvents(getAllEvents());
  }

  const selectedEvent = events.find(e => e.setup.id === selectedEventId) || events[0];

  function handleCreateVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent || !newVendor.serviceCategory) return;
    addVendor(selectedEvent.setup.id, {
      name: newVendor.name,
      serviceCategory: newVendor.serviceCategory,
      bookingStatus: newVendor.bookingStatus,
      contactNotes: newVendor.contactNotes,
      estimatedCost: Number(newVendor.estimatedCost) || 0,
      phone: newVendor.phone,
      email: newVendor.email,
    });
    setShowModal(false);
    setNewVendor({
      name: '',
      serviceCategory: 'Venue',
      bookingStatus: 'contacted',
      contactNotes: '',
      estimatedCost: 0,
      phone: '',
      email: '',
    });
    refresh();
  }

  if (!loaded) {
    return <div className="space-y-4"><div className="skeleton h-10 w-48" /><div className="skeleton h-64 rounded-2xl" /></div>;
  }

  if (!selectedEvent) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Users2 size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Events Found</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-6">Create an event to start tracking vendors and contacts.</p>
        <Link href="/create" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          Create Event
        </Link>
      </div>
    );
  }

  const vendors = selectedEvent.vendors || [];
  const bookedCount = vendors.filter(v => v.bookingStatus === 'booked' || v.bookingStatus === 'confirmed').length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Vendor Checklist</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Organize service providers, status, and quotes. No fictional businesses are fabricated.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {events.length > 1 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            >
              {events.map(ev => (
                <option key={ev.setup.id} value={ev.setup.id}>{ev.setup.eventName}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow transition"
          >
            <Plus size={16} /> Add Vendor
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Summary</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {bookedCount} of {vendors.length} vendors booked / confirmed
          </h3>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Total Vendor Quotes: <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(vendors.reduce((s, v) => s + v.estimatedCost, 0), selectedEvent.setup.currency)}</span>
        </div>
      </div>

      {/* Vendor Cards */}
      {vendors.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Users2 size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 dark:text-white">No Vendors Listed</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Add your caterer, florist, venue coordinator, or sound engineer.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow"
          >
            Add First Vendor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map(vendor => (
            <div key={vendor.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      {vendor.serviceCategory}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {vendor.name || '(Vendor name not set)'}
                    </h4>
                  </div>
                  <span className={`badge badge-${vendor.bookingStatus}`}>
                    {vendor.bookingStatus}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 mt-3">
                  <p><span className="font-semibold text-slate-700 dark:text-slate-200">Est. Cost:</span> {formatCurrency(vendor.estimatedCost, selectedEvent.setup.currency)}</p>
                  {vendor.phone && <p><span className="font-semibold text-slate-700 dark:text-slate-200">Phone:</span> {vendor.phone}</p>}
                  {vendor.email && <p><span className="font-semibold text-slate-700 dark:text-slate-200">Email:</span> {vendor.email}</p>}
                  {vendor.contactNotes && (
                    <p className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg text-slate-600 dark:text-slate-300 italic mt-2">
                      &quot;{vendor.contactNotes}&quot;
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                <select
                  value={vendor.bookingStatus}
                  onChange={(e) => {
                    updateVendor(selectedEvent.setup.id, vendor.id, { bookingStatus: e.target.value as BookingStatus });
                    refresh();
                  }}
                  className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                >
                  <option value="contacted">Contacted</option>
                  <option value="quoted">Quoted</option>
                  <option value="booked">Booked</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button
                  onClick={() => {
                    deleteVendor(selectedEvent.setup.id, vendor.id);
                    refresh();
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Vendor</h3>
            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Vendor/Business Name</label>
                <input
                  type="text"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  placeholder="e.g. Acme Sound & Lighting"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Category *</label>
                  <select
                    value={newVendor.serviceCategory}
                    onChange={(e) => setNewVendor({ ...newVendor, serviceCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Venue">Venue</option>
                    <option value="Catering">Catering</option>
                    <option value="Photography">Photography</option>
                    <option value="Decoration">Decoration</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Invitations">Invitations</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Status</label>
                  <select
                    value={newVendor.bookingStatus}
                    onChange={(e) => setNewVendor({ ...newVendor, bookingStatus: e.target.value as BookingStatus })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="booked">Booked</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Estimated Cost ({selectedEvent.setup.currency})</label>
                <input
                  type="number"
                  value={newVendor.estimatedCost}
                  onChange={(e) => setNewVendor({ ...newVendor, estimatedCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Notes</label>
                <textarea
                  value={newVendor.contactNotes}
                  onChange={(e) => setNewVendor({ ...newVendor, contactNotes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
