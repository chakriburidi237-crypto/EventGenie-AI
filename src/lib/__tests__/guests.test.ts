import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateGuestStats, filterGuests, formatGuestsCSV } from '../guests';
import { Guest } from '../types';

describe('Guest Management & Analytics Calculations', () => {
  const sampleGuests: Guest[] = [
    {
      id: 'g-1',
      name: 'Aarav Sharma',
      email: 'aarav@example.com',
      phone: '+91 98765 43210',
      rsvpStatus: 'confirmed',
      dietaryRestrictions: 'Vegetarian',
      plusOnes: 1,
      tableNumber: 'Table 1',
      notes: 'VIP Guest',
      eventId: 'evt-101',
    },
    {
      id: 'g-2',
      name: 'Priya Patel',
      email: 'priya@example.com',
      phone: '+91 98765 43211',
      rsvpStatus: 'attending',
      dietaryRestrictions: 'Vegan',
      plusOnes: 2,
      tableNumber: 'Table 1',
      notes: '',
      eventId: 'evt-101',
    },
    {
      id: 'g-3',
      name: 'Rahul Verma',
      email: 'rahul@example.com',
      phone: '+91 98765 43212',
      rsvpStatus: 'declined',
      dietaryRestrictions: 'None',
      plusOnes: 1,
      tableNumber: '',
      notes: 'Cannot attend due to travel',
      eventId: 'evt-101',
    },
    {
      id: 'g-4',
      name: 'Ananya Roy',
      email: 'ananya@example.com',
      phone: '+91 98765 43213',
      rsvpStatus: 'invited',
      dietaryRestrictions: 'Gluten-Free',
      plusOnes: 0,
      tableNumber: 'Table 2',
      notes: 'Awaiting confirmation',
      eventId: 'evt-101',
    },
    {
      id: 'g-5',
      name: 'Dev Mehra',
      email: 'dev@example.com',
      phone: '+91 98765 43214',
      rsvpStatus: 'confirmed',
      dietaryRestrictions: 'Vegetarian',
      plusOnes: 0,
      tableNumber: 'Table 2',
      notes: '',
      eventId: 'evt-101',
    },
  ];

  it('calculates total headcount correctly with plus-ones for confirmed/attending guests', () => {
    const stats = calculateGuestStats(sampleGuests, 10);
    // g-1: 1 + 1 = 2
    // g-2: 1 + 2 = 3
    // g-3: declined (0)
    // g-4: invited (0)
    // g-5: 1 + 0 = 1
    // Total headcount = 2 + 3 + 1 = 6
    assert.strictEqual(stats.totalHeadcount, 6);
    assert.strictEqual(stats.total, 5);
  });

  it('accurately breaks down RSVP statuses', () => {
    const stats = calculateGuestStats(sampleGuests, 20);
    assert.strictEqual(stats.confirmed, 3); // 2 confirmed + 1 attending
    assert.strictEqual(stats.declined, 1);
    assert.strictEqual(stats.pending, 1);
  });

  it('tallies unique dietary restrictions excluding None', () => {
    const stats = calculateGuestStats(sampleGuests, 20);
    assert.strictEqual(stats.dietaryMap['Vegetarian'], 2);
    assert.strictEqual(stats.dietaryMap['Vegan'], 1);
    assert.strictEqual(stats.dietaryMap['Gluten-Free'], 1);
    assert.strictEqual(stats.dietaryMap['None'], undefined);
  });

  it('computes capacity utilization and detects over-capacity correctly', () => {
    const underStats = calculateGuestStats(sampleGuests, 10);
    assert.strictEqual(underStats.capacityPercent, 60); // 6 / 10 = 60%
    assert.strictEqual(underStats.isOverCapacity, false);

    const overStats = calculateGuestStats(sampleGuests, 5);
    assert.strictEqual(overStats.isOverCapacity, true);
    assert.strictEqual(overStats.capacityPercent, 100); // capped at 100%
  });

  it('filters guests correctly by text query and RSVP status', () => {
    const searchResult = filterGuests(sampleGuests, 'priya', 'all');
    assert.strictEqual(searchResult.length, 1);
    assert.strictEqual(searchResult[0].name, 'Priya Patel');

    const confirmedOnly = filterGuests(sampleGuests, '', 'confirmed');
    assert.strictEqual(confirmedOnly.length, 2);

    const tableSearch = filterGuests(sampleGuests, 'Table 1', 'all');
    assert.strictEqual(tableSearch.length, 2);
  });

  it('formats guest list to RFC 4180 compliant CSV format', () => {
    const csv = formatGuestsCSV(sampleGuests);
    assert.ok(csv.startsWith('"Name","Email","Phone"'));
    assert.ok(csv.includes('"Aarav Sharma"'));
    assert.ok(csv.includes('"Table 1"'));
    assert.ok(csv.includes('"Cannot attend due to travel"'));
  });
});
