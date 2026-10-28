'use client';

import { FullEvent, EventSetup, TimelineTask, Vendor, Guest, BudgetPlan, AIEventPlan } from './types';
import { createDefaultBudgetPlan } from './budget';
import { getInitialDemoEvents, generateId } from './demo-data';

const STORAGE_KEY = 'eventgenie_events';

// ─── Helpers ───

function getStoredEvents(): FullEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const events: FullEvent[] = JSON.parse(raw);
    let migrated = false;
    events.forEach(e => {
      if (e.setup && e.setup.currency === 'USD') {
        e.setup.currency = 'INR';
        migrated = true;
      }
      if (e.budget && e.budget.currency === 'USD') {
        e.budget.currency = 'INR';
        migrated = true;
      }
    });
    if (migrated) {
      saveEvents(events);
    }
    return events;
  } catch {
    return [];
  }
}

function saveEvents(events: FullEvent[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// ─── Initialize demo event portfolio if needed ───

export function initializeStore(): void {
  const events = getStoredEvents();
  if (
    events.length === 0 ||
    !events[0].guests ||
    events[0].guests.length === 0 ||
    events[0].setup?.currency === 'USD'
  ) {
    const portfolio = getInitialDemoEvents();
    saveEvents(portfolio);
  }
}

// ─── CRUD Operations ───

export function getAllEvents(): FullEvent[] {
  return getStoredEvents();
}

export function getEventById(id: string): FullEvent | undefined {
  return getStoredEvents().find(e => e.setup.id === id);
}

export function createEvent(setup: Omit<EventSetup, 'id' | 'createdAt' | 'updatedAt'>): FullEvent {
  const id = generateId();
  const now = new Date().toISOString();
  const fullEvent: FullEvent = {
    setup: { ...setup, id, createdAt: now, updatedAt: now },
    plan: null,
    budget: createDefaultBudgetPlan(setup.totalBudget, setup.currency),
    tasks: [],
    vendors: [],
    guests: [],
    isDemo: false,
  };
  const events = getStoredEvents();
  events.push(fullEvent);
  saveEvents(events);
  return fullEvent;
}

export function updateEvent(id: string, updates: Partial<FullEvent>): FullEvent | undefined {
  const events = getStoredEvents();
  const idx = events.findIndex(e => e.setup.id === id);
  if (idx === -1) return undefined;
  events[idx] = {
    ...events[idx],
    ...updates,
    setup: {
      ...events[idx].setup,
      ...(updates.setup || {}),
      updatedAt: new Date().toISOString(),
    },
  };
  saveEvents(events);
  return events[idx];
}

export function deleteEvent(id: string): boolean {
  const events = getStoredEvents();
  const filtered = events.filter(e => e.setup.id !== id);
  if (filtered.length === events.length) return false;
  saveEvents(filtered);
  return true;
}

// ─── Plan ───

export function saveEventPlan(eventId: string, plan: AIEventPlan): void {
  updateEvent(eventId, { plan });
}

// ─── Budget ───

export function saveEventBudget(eventId: string, budget: BudgetPlan): void {
  updateEvent(eventId, { budget });
}

// ─── Tasks ───

export function addTask(eventId: string, task: Omit<TimelineTask, 'id' | 'eventId'>): TimelineTask {
  const event = getEventById(eventId);
  if (!event) throw new Error('Event not found');
  const newTask: TimelineTask = { ...task, id: generateId(), eventId };
  event.tasks.push(newTask);
  updateEvent(eventId, { tasks: event.tasks });
  return newTask;
}

export function updateTask(eventId: string, taskId: string, updates: Partial<TimelineTask>): void {
  const event = getEventById(eventId);
  if (!event) return;
  event.tasks = event.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
  updateEvent(eventId, { tasks: event.tasks });
}

export function deleteTask(eventId: string, taskId: string): void {
  const event = getEventById(eventId);
  if (!event) return;
  event.tasks = event.tasks.filter(t => t.id !== taskId);
  updateEvent(eventId, { tasks: event.tasks });
}

// ─── Vendors ───

export function addVendor(eventId: string, vendor: Omit<Vendor, 'id' | 'eventId'>): Vendor {
  const event = getEventById(eventId);
  if (!event) throw new Error('Event not found');
  const newVendor: Vendor = { ...vendor, id: generateId(), eventId };
  event.vendors.push(newVendor);
  updateEvent(eventId, { vendors: event.vendors });
  return newVendor;
}

export function updateVendor(eventId: string, vendorId: string, updates: Partial<Vendor>): void {
  const event = getEventById(eventId);
  if (!event) return;
  event.vendors = event.vendors.map(v => v.id === vendorId ? { ...v, ...updates } : v);
  updateEvent(eventId, { vendors: event.vendors });
}

export function deleteVendor(eventId: string, vendorId: string): void {
  const event = getEventById(eventId);
  if (!event) return;
  event.vendors = event.vendors.filter(v => v.id !== vendorId);
  updateEvent(eventId, { vendors: event.vendors });
}

// ─── Guests ───

export function addGuest(eventId: string, guest: Omit<Guest, 'id' | 'eventId'>): Guest {
  const event = getEventById(eventId);
  if (!event) throw new Error('Event not found');
  const newGuest: Guest = { ...guest, id: generateId(), eventId };
  if (!event.guests) event.guests = [];
  event.guests.push(newGuest);
  updateEvent(eventId, { guests: event.guests });
  return newGuest;
}

export function updateGuest(eventId: string, guestId: string, updates: Partial<Guest>): void {
  const event = getEventById(eventId);
  if (!event) return;
  if (!event.guests) event.guests = [];
  event.guests = event.guests.map(g => g.id === guestId ? { ...g, ...updates } : g);
  updateEvent(eventId, { guests: event.guests });
}

export function deleteGuest(eventId: string, guestId: string): void {
  const event = getEventById(eventId);
  if (!event) return;
  if (!event.guests) return;
  event.guests = event.guests.filter(g => g.id !== guestId);
  updateEvent(eventId, { guests: event.guests });
}

// ─── Export ───

export function exportEventToText(event: FullEvent): string {
  const { setup, plan, budget, tasks, vendors, guests } = event;
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════');
  lines.push(`  EventGenie AI — Event Plan Export`);
  lines.push('═══════════════════════════════════════════');
  lines.push('');
  lines.push(`Event: ${setup.eventName}`);
  lines.push(`Type: ${setup.eventType}`);
  lines.push(`Date: ${setup.eventDate}`);
  lines.push(`Location: ${setup.location}`);
  lines.push(`Guests: ${setup.guestCount}`);
  lines.push(`Budget: ${setup.currency} ${setup.totalBudget.toLocaleString()}`);
  lines.push(`Theme: ${setup.theme || 'Not specified'}`);
  lines.push(`Food: ${setup.foodPreferences || 'Not specified'}`);
  lines.push(`Venue: ${setup.venuePreference}`);
  if (setup.specialRequirements) {
    lines.push(`Special: ${setup.specialRequirements}`);
  }
  lines.push('');

  if (event.isDemo) {
    lines.push('⚠ SAMPLE DATA — This is demo content, not a live AI response.');
    lines.push('');
  }

  if (plan) {
    lines.push('───────── EVENT CONCEPT ─────────');
    lines.push(plan.eventConcept);
    lines.push('');
    lines.push('───────── THEME ─────────');
    lines.push(plan.themeDescription);
    lines.push('');
    lines.push('───────── DECORATION IDEAS ─────────');
    plan.decorationIdeas.forEach((d, i) => lines.push(`  ${i + 1}. ${d}`));
    lines.push('');
    lines.push('───────── FOOD SUGGESTIONS ─────────');
    plan.foodSuggestions.forEach((f, i) => lines.push(`  ${i + 1}. ${f}`));
    lines.push('');
    lines.push('───────── ENTERTAINMENT ─────────');
    plan.entertainmentIdeas.forEach((e, i) => lines.push(`  ${i + 1}. ${e}`));
    lines.push('');
    lines.push('───────── RECOMMENDATIONS ─────────');
    plan.personalizedRecommendations.forEach((r, i) => lines.push(`  ${i + 1}. ${r}`));
    lines.push('');
  }

  lines.push('───────── BUDGET BREAKDOWN ─────────');
  lines.push(`Total Budget: ${budget.currency} ${budget.totalBudget.toLocaleString()}`);
  lines.push('');
  budget.categories.forEach(cat => {
    if (cat.estimated > 0 || cat.actual > 0) {
      lines.push(`  ${cat.name}: Estimated ${budget.currency} ${cat.estimated.toLocaleString()} | Actual ${budget.currency} ${cat.actual.toLocaleString()}`);
      if (cat.notes) lines.push(`    Notes: ${cat.notes}`);
    }
  });
  const totalEst = budget.categories.reduce((s, c) => s + c.estimated, 0);
  const remaining = budget.totalBudget - totalEst;
  lines.push('');
  lines.push(`  Total Estimated: ${budget.currency} ${totalEst.toLocaleString()}`);
  lines.push(`  Remaining: ${budget.currency} ${remaining.toLocaleString()}${remaining < 0 ? ' ⚠ OVER BUDGET' : ''}`);
  lines.push('');

  if (tasks.length > 0) {
    lines.push('───────── TASKS ─────────');
    tasks.forEach(task => {
      const status = task.status === 'completed' ? '✓' : task.status === 'in-progress' ? '◉' : '○';
      lines.push(`  ${status} [${task.priority.toUpperCase()}] ${task.title} — Due: ${task.dueDate}`);
      if (task.description) lines.push(`    ${task.description}`);
    });
    lines.push('');
  }

  if (vendors.length > 0) {
    lines.push('───────── VENDORS ─────────');
    vendors.forEach(v => {
      lines.push(`  ${v.serviceCategory}: ${v.name || '(not assigned)'} — Status: ${v.bookingStatus} — Est: ${budget.currency} ${v.estimatedCost.toLocaleString()}`);
      if (v.contactNotes) lines.push(`    Notes: ${v.contactNotes}`);
    });
    lines.push('');
  }

  if (guests && guests.length > 0) {
    lines.push('───────── GUEST LIST ─────────');
    lines.push(`Total Guests: ${guests.length}`);
    guests.forEach(g => {
      lines.push(`  • ${g.name} — [${g.rsvpStatus.toUpperCase()}] ${g.plusOnes > 0 ? `(+${g.plusOnes})` : ''} ${g.dietaryRestrictions ? `| Dietary: ${g.dietaryRestrictions}` : ''}`);
    });
    lines.push('');
  }

  lines.push('');
  lines.push('Generated by EventGenie AI');
  lines.push(`Export date: ${new Date().toLocaleDateString()}`);

  return lines.join('\n');
}
