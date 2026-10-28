'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Utensils,
  Download,
  Trash2,
  Edit2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { FullEvent, Guest, RSVPStatus } from '@/lib/types';
import { getAllEvents, addGuest, updateGuest, deleteGuest, initializeStore } from '@/lib/store';
import { useToast } from '@/components/Toast';

export default function GuestListPage() {
  const { addToast } = useToast();
  const [events, setEvents] = useState<FullEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RSVPStatus>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // New guest form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rsvpStatus: 'invited' as RSVPStatus,
    dietaryRestrictions: '',
    plusOnes: 0,
    tableNumber: '',
    notes: '',
  });

  useEffect(() => {
    initializeStore();
    const all = getAllEvents();
    setEvents(all);
    if (all.length > 0) {
      setSelectedEventId(all[0].setup.id);
    }
    setLoaded(true);
  }, []);

  const selectedEvent = useMemo(() => {
    return events.find(e => e.setup.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  const guests = useMemo(() => {
    return selectedEvent?.guests || [];
  }, [selectedEvent]);

  // Derived stats
  const stats = useMemo(() => {
    const total = guests.length;
    const confirmed = guests.filter(g => g.rsvpStatus === 'confirmed' || g.rsvpStatus === 'attending').length;
    const declined = guests.filter(g => g.rsvpStatus === 'declined').length;
    const pending = guests.filter(g => g.rsvpStatus === 'invited').length;
    const totalHeadcount = guests.reduce((sum, g) => {
      if (g.rsvpStatus === 'confirmed' || g.rsvpStatus === 'attending') {
        return sum + 1 + (g.plusOnes || 0);
      }
      return sum;
    }, 0);

    // Dietary tally
    const dietaryMap: Record<string, number> = {};
    guests.forEach(g => {
      if (g.dietaryRestrictions && g.dietaryRestrictions.trim() && g.dietaryRestrictions.toLowerCase() !== 'none') {
        const key = g.dietaryRestrictions.trim();
        dietaryMap[key] = (dietaryMap[key] || 0) + 1;
      }
    });

    const targetCapacity = selectedEvent?.setup.guestCount || 100;
    const capacityPercent = Math.min(Math.round((totalHeadcount / targetCapacity) * 100), 100);

    return { total, confirmed, declined, pending, totalHeadcount, dietaryMap, targetCapacity, capacityPercent };
  }, [guests, selectedEvent]);

  // Filtered guests
  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const matchesSearch = guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (guest.tableNumber && guest.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || guest.rsvpStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [guests, searchQuery, statusFilter]);

  if (!loaded) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-48" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Users size={48} className="text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Events Found</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">Create an event first to start managing your guest list.</p>
        <Link href="/create" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
          Create Event
        </Link>
      </div>
    );
  }

  const handleSaveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Please provide a guest name', 'warning');
      return;
    }

    if (editingGuest) {
      updateGuest(selectedEvent.setup.id, editingGuest.id, formData);
      addToast(`Updated guest ${formData.name}`, 'success');
    } else {
      addGuest(selectedEvent.setup.id, formData);
      addToast(`Added ${formData.name} to guest list`, 'success');
    }

    // Refresh
    setEvents(getAllEvents());
    setShowAddModal(false);
    setEditingGuest(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      rsvpStatus: 'invited',
      dietaryRestrictions: '',
      plusOnes: 0,
      tableNumber: '',
      notes: '',
    });
  };

  const handleStatusChange = (guestId: string, newStatus: RSVPStatus) => {
    updateGuest(selectedEvent.setup.id, guestId, { rsvpStatus: newStatus });
    setEvents(getAllEvents());
    addToast(`RSVP status updated to ${newStatus}`, 'info');
  };

  const handleDelete = (guestId: string, guestName: string) => {
    deleteGuest(selectedEvent.setup.id, guestId);
    setEvents(getAllEvents());
    addToast(`Removed ${guestName} from guest list`, 'info');
  };

  const exportCSV = () => {
    if (guests.length === 0) {
      addToast('No guests to export', 'warning');
      return;
    }
    const headers = ['Name', 'Email', 'Phone', 'RSVP Status', 'Plus Ones', 'Table', 'Dietary Restrictions', 'Notes'];
    const rows = guests.map(g => [
      `"${g.name}"`,
      `"${g.email || ''}"`,
      `"${g.phone || ''}"`,
      `"${g.rsvpStatus}"`,
      g.plusOnes || 0,
      `"${g.tableNumber || ''}"`,
      `"${g.dietaryRestrictions || ''}"`,
      `"${g.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedEvent.setup.eventName}_Guests.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Guest list exported to CSV!', 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <UserCheck size={22} />
            </span>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Guest List & RSVP Manager</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track invitations, responses, dietary requirements, and seating arrangement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {events.length > 1 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none"
            >
              {events.map(ev => (
                <option key={ev.setup.id} value={ev.setup.id}>{ev.setup.eventName}</option>
              ))}
            </select>
          )}

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <Download size={16} /> Export CSV
          </button>

          <button
            onClick={() => {
              setEditingGuest(null);
              setFormData({
                name: '',
                email: '',
                phone: '',
                rsvpStatus: 'invited',
                dietaryRestrictions: '',
                plusOnes: 0,
                tableNumber: '',
                notes: '',
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <UserPlus size={16} /> Add Guest
          </button>
        </div>
      </div>

      {selectedEvent.isDemo && (
        <div className="demo-banner">
          <AlertCircle size={18} />
          <span>Viewing sample guest list. You can add, edit, or test RSVP updates in real time.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invited</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.total}</p>
          <span className="text-xs text-slate-400 mt-1 block">Guests on roster</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Attending / Confirmed</span>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{stats.confirmed}</p>
          <span className="text-xs text-slate-400 mt-1 block">{stats.totalHeadcount} total incl. +1s</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Awaiting Response</span>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
          <span className="text-xs text-slate-400 mt-1 block">Invited pending RSVP</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Declined</span>
          <p className="text-3xl font-extrabold text-red-500 mt-1">{stats.declined}</p>
          <span className="text-xs text-slate-400 mt-1 block">Unable to attend</span>
        </div>
      </div>

      {/* Capacity & Dietary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Capacity Progress ({stats.totalHeadcount} of {stats.targetCapacity} Expected Guests)
            </span>
            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
              {stats.capacityPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.capacityPercent > 90 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
              }`}
              style={{ width: `${stats.capacityPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            Based on confirmed RSVPs plus their registered companions against venue guest capacity.
          </p>
        </div>

        {/* Dietary breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Utensils size={16} className="text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Dietary Summary</h3>
          </div>
          {Object.keys(stats.dietaryMap).length === 0 ? (
            <p className="text-xs text-slate-400">No special dietary preferences reported yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(stats.dietaryMap).map(([pref, count]) => (
                <span
                  key={pref}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-100 dark:border-indigo-900/50"
                >
                  {pref}: {count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'confirmed', 'attending', 'invited', 'declined'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Guest Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Guest</th>
                <th className="py-3 px-4 font-semibold">Contact</th>
                <th className="py-3 px-4 font-semibold">RSVP Status</th>
                <th className="py-3 px-4 font-semibold">+1s</th>
                <th className="py-3 px-4 font-semibold">Table</th>
                <th className="py-3 px-4 font-semibold">Dietary</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No guests found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredGuests.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {g.name}
                      {g.notes && (
                        <p className="text-[11px] font-normal text-slate-400 mt-0.5">{g.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                      <div>{g.email || '—'}</div>
                      <div className="text-slate-400">{g.phone || ''}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={g.rsvpStatus}
                        onChange={(e) => handleStatusChange(g.id, e.target.value as RSVPStatus)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border outline-none cursor-pointer ${
                          g.rsvpStatus === 'confirmed' || g.rsvpStatus === 'attending'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : g.rsvpStatus === 'declined'
                            ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        <option value="invited">Invited</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="attending">Attending</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {g.plusOnes > 0 ? `+${g.plusOnes}` : '0'}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {g.tableNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {g.dietaryRestrictions ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {g.dietaryRestrictions}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingGuest(g);
                            setFormData({
                              name: g.name,
                              email: g.email || '',
                              phone: g.phone || '',
                              rsvpStatus: g.rsvpStatus,
                              dietaryRestrictions: g.dietaryRestrictions || '',
                              plusOnes: g.plusOnes || 0,
                              tableNumber: g.tableNumber || '',
                              notes: g.notes || '',
                            });
                            setShowAddModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Edit Guest"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id, g.name)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                          title="Delete Guest"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingGuest ? 'Edit Guest' : 'Add New Guest'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGuest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="guest@example.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={formData.rsvpStatus}
                    onChange={(e) => setFormData({ ...formData, rsvpStatus: e.target.value as RSVPStatus })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="invited">Invited</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="attending">Attending</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    +1 Companions
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={formData.plusOnes}
                    onChange={(e) => setFormData({ ...formData, plusOnes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Table #
                  </label>
                  <input
                    type="text"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    placeholder="Table 1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Dietary Restrictions
                </label>
                <input
                  type="text"
                  value={formData.dietaryRestrictions}
                  onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                  placeholder="e.g. Vegetarian, Nut Allergy, Vegan"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional guest details..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                >
                  {editingGuest ? 'Save Changes' : 'Add to List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
