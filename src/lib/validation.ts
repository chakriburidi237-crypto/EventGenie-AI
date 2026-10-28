import { EventSetup, ValidationError } from './types';

export function validateEventSetup(data: Partial<EventSetup>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.eventType || !['wedding', 'birthday', 'community', 'corporate', 'other'].includes(data.eventType)) {
    errors.push({ field: 'eventType', message: 'Please select an event type.' });
  }

  if (!data.eventName || data.eventName.trim().length < 2) {
    errors.push({ field: 'eventName', message: 'Event name must be at least 2 characters.' });
  }

  if (!data.eventDate) {
    errors.push({ field: 'eventDate', message: 'Please select an event date.' });
  }

  if (!data.location || data.location.trim().length < 2) {
    errors.push({ field: 'location', message: 'Please enter a location.' });
  }

  if (!data.guestCount || data.guestCount < 1) {
    errors.push({ field: 'guestCount', message: 'Guest count must be at least 1.' });
  }

  if (data.guestCount && data.guestCount > 100000) {
    errors.push({ field: 'guestCount', message: 'Guest count seems unrealistically high.' });
  }

  if (!data.totalBudget || data.totalBudget <= 0) {
    errors.push({ field: 'totalBudget', message: 'Budget must be greater than 0.' });
  }

  if (!data.currency || data.currency.trim().length === 0) {
    errors.push({ field: 'currency', message: 'Please select a currency.' });
  }

  if (!data.venuePreference || !['indoor', 'outdoor', 'both'].includes(data.venuePreference)) {
    errors.push({ field: 'venuePreference', message: 'Please select a venue preference.' });
  }

  return errors;
}

export function validateServerInput(body: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof body.eventType !== 'string' || body.eventType.trim().length === 0) {
    errors.push({ field: 'eventType', message: 'Event type is required.' });
  }

  if (typeof body.guestCount === 'number' && (body.guestCount < 1 || body.guestCount > 100000)) {
    errors.push({ field: 'guestCount', message: 'Guest count must be between 1 and 100,000.' });
  }

  if (typeof body.totalBudget === 'number' && body.totalBudget <= 0) {
    errors.push({ field: 'totalBudget', message: 'Budget must be positive.' });
  }

  return errors;
}
