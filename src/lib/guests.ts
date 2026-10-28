import { Guest, RSVPStatus } from './types';

export interface GuestStats {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  totalHeadcount: number;
  dietaryMap: Record<string, number>;
  targetCapacity: number;
  capacityPercent: number;
  isOverCapacity: boolean;
}

/**
 * Computes headcount, RSVP breakdowns, dietary distribution, and capacity metrics.
 */
export function calculateGuestStats(guests: Guest[], targetCapacity: number = 100): GuestStats {
  const total = guests.length;
  const confirmed = guests.filter(g => g.rsvpStatus === 'confirmed' || g.rsvpStatus === 'attending').length;
  const declined = guests.filter(g => g.rsvpStatus === 'declined').length;
  const pending = guests.filter(g => g.rsvpStatus === 'invited').length;

  const totalHeadcount = guests.reduce((sum, g) => {
    if (g.rsvpStatus === 'confirmed' || g.rsvpStatus === 'attending') {
      return sum + 1 + Math.max(0, g.plusOnes || 0);
    }
    return sum;
  }, 0);

  const dietaryMap: Record<string, number> = {};
  guests.forEach(g => {
    if (g.dietaryRestrictions && g.dietaryRestrictions.trim() && g.dietaryRestrictions.toLowerCase() !== 'none') {
      const key = g.dietaryRestrictions.trim();
      dietaryMap[key] = (dietaryMap[key] || 0) + 1;
    }
  });

  const capacity = Math.max(1, targetCapacity);
  const capacityPercent = Math.min(Math.round((totalHeadcount / capacity) * 100), 100);
  const isOverCapacity = totalHeadcount > targetCapacity;

  return {
    total,
    confirmed,
    declined,
    pending,
    totalHeadcount,
    dietaryMap,
    targetCapacity,
    capacityPercent,
    isOverCapacity,
  };
}

/**
 * Filter guests based on text query and RSVP status.
 */
export function filterGuests(
  guests: Guest[],
  searchQuery: string = '',
  statusFilter: RSVPStatus | 'all' = 'all'
): Guest[] {
  const q = searchQuery.toLowerCase().trim();
  return guests.filter(guest => {
    const matchesSearch =
      !q ||
      guest.name.toLowerCase().includes(q) ||
      guest.email.toLowerCase().includes(q) ||
      Boolean(guest.tableNumber && guest.tableNumber.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || guest.rsvpStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

/**
 * Escape a string for RFC 4180 CSV compliance.
 */
function escapeCSVField(field: string | number | undefined): string {
  if (field === undefined || field === null) return '""';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Exports guests list to an RFC 4180 compliant CSV string.
 */
export function formatGuestsCSV(guests: Guest[]): string {
  const headers = ['Name', 'Email', 'Phone', 'RSVP Status', 'Dietary Restrictions', 'Plus Ones', 'Table Number', 'Notes'];
  const rows = guests.map(g => [
    escapeCSVField(g.name),
    escapeCSVField(g.email),
    escapeCSVField(g.phone),
    escapeCSVField(g.rsvpStatus),
    escapeCSVField(g.dietaryRestrictions),
    escapeCSVField(g.plusOnes ?? 0),
    escapeCSVField(g.tableNumber ?? ''),
    escapeCSVField(g.notes),
  ].join(','));

  return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
}
