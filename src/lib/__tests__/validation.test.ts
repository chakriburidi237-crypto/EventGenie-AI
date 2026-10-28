import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateEventSetup, validateServerInput } from '../validation';

describe('Event Setup Input Validation', () => {
  it('detects missing required fields', () => {
    const errors = validateEventSetup({});
    const fields = errors.map(e => e.field);
    assert.ok(fields.includes('eventType'));
    assert.ok(fields.includes('eventName'));
    assert.ok(fields.includes('eventDate'));
    assert.ok(fields.includes('location'));
    assert.ok(fields.includes('guestCount'));
    assert.ok(fields.includes('totalBudget'));
  });

  it('validates guest counts must be positive and realistic', () => {
    const negative = validateEventSetup({
      eventType: 'wedding',
      eventName: 'My Event',
      eventDate: '2027-01-01',
      location: 'City Center',
      guestCount: -5,
      totalBudget: 1000,
      currency: 'USD',
      venuePreference: 'indoor',
    });
    assert.ok(negative.some(e => e.field === 'guestCount'));

    const tooHigh = validateEventSetup({
      eventType: 'wedding',
      eventName: 'My Event',
      eventDate: '2027-01-01',
      location: 'City Center',
      guestCount: 500000,
      totalBudget: 1000,
      currency: 'USD',
      venuePreference: 'indoor',
    });
    assert.ok(tooHigh.some(e => e.field === 'guestCount'));
  });

  it('validates budget must be greater than zero', () => {
    const zeroBudget = validateEventSetup({
      eventType: 'birthday',
      eventName: 'Party',
      eventDate: '2027-01-01',
      location: 'Lounge',
      guestCount: 20,
      totalBudget: 0,
      currency: 'USD',
      venuePreference: 'indoor',
    });
    assert.ok(zeroBudget.some(e => e.field === 'totalBudget'));
  });

  it('passes valid event setups with zero errors', () => {
    const valid = validateEventSetup({
      eventType: 'wedding',
      eventName: 'Sarah & Alex Wedding',
      eventDate: '2027-06-15',
      location: 'Botanical Garden',
      guestCount: 120,
      totalBudget: 35000,
      currency: 'USD',
      venuePreference: 'both',
    });
    assert.strictEqual(valid.length, 0);
  });

  it('validates server input payload correctly', () => {
    const invalidServer = validateServerInput({
      eventType: '',
      guestCount: -1,
      totalBudget: -500,
    });
    assert.ok(invalidServer.length >= 3);

    const validServer = validateServerInput({
      eventType: 'wedding',
      guestCount: 100,
      totalBudget: 25000,
    });
    assert.strictEqual(validServer.length, 0);
  });

  it('rejects invalid date strings in event setup', () => {
    const invalidDate = validateEventSetup({
      eventType: 'wedding',
      eventName: 'Grand Gala',
      eventDate: 'not-a-valid-date',
      location: 'Banquet Hall',
      guestCount: 50,
      totalBudget: 10000,
      currency: 'INR',
      venuePreference: 'indoor',
    });
    assert.ok(invalidDate.some(e => e.field === 'eventDate'));
  });

  it('rejects empty or whitespace-only strings for eventName and location', () => {
    const whitespaceFields = validateEventSetup({
      eventType: 'anniversary',
      eventName: '   ',
      eventDate: '2027-04-10',
      location: '  \t  ',
      guestCount: 40,
      totalBudget: 15000,
      currency: 'INR',
      venuePreference: 'indoor',
    });
    assert.ok(whitespaceFields.some(e => e.field === 'eventName'));
    assert.ok(whitespaceFields.some(e => e.field === 'location'));
  });

  it('validates supported currency codes', () => {
    const invalidCurrency = validateEventSetup({
      eventType: 'corporate',
      eventName: 'Tech Meetup',
      eventDate: '2027-09-01',
      location: 'Auditorium',
      guestCount: 80,
      totalBudget: 50000,
      currency: 'XYZ',
      venuePreference: 'indoor',
    });
    assert.ok(invalidCurrency.some(e => e.field === 'currency'));
  });

  it('permits valid INR, USD, EUR, GBP currencies', () => {
    ['INR', 'USD', 'EUR', 'GBP'].forEach(curr => {
      const res = validateEventSetup({
        eventType: 'birthday',
        eventName: 'Celebration',
        eventDate: '2027-05-20',
        location: 'Rooftop',
        guestCount: 30,
        totalBudget: 20000,
        currency: curr,
        venuePreference: 'outdoor',
      });
      assert.strictEqual(res.length, 0);
    });
  });

  it('detects boundary maximum limits for budgets', () => {
    const tooHighBudget = validateEventSetup({
      eventType: 'wedding',
      eventName: 'Grand Wedding',
      eventDate: '2027-08-15',
      location: 'Resort',
      guestCount: 200,
      totalBudget: 2000000000, // 2 billion exceeds reasonable limit
      currency: 'INR',
      venuePreference: 'both',
    });
    assert.ok(tooHighBudget.some(e => e.field === 'totalBudget'));
  });
});
