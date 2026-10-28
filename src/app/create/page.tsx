'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  MapPin,
  Users,
  Wallet,
  Palette,
  UtensilsCrossed,
  Building,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
  Quote,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { EventSetup, EventType, VenuePreference, ValidationError } from '@/lib/types';
import { validateEventSetup } from '@/lib/validation';
import { createEvent, updateEvent, saveEventPlan } from '@/lib/store';
import { applyAIBudgetAllocations } from '@/lib/budget';

const eventTypes: { value: EventType; label: string; emoji: string }[] = [
  { value: 'wedding', label: 'Wedding', emoji: '💍' },
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'anniversary', label: 'Anniversary', emoji: '🥂' },
  { value: 'baby-shower', label: 'Baby Shower', emoji: '🍼' },
  { value: 'corporate', label: 'Corporate', emoji: '🏢' },
  { value: 'community', label: 'Community', emoji: '🎪' },
  { value: 'graduation', label: 'Graduation', emoji: '🎓' },
  { value: 'festival', label: 'Festival / Music', emoji: '🎵' },
  { value: 'other', label: 'Other / Custom', emoji: '🎉' },
];

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CNY'];

// Quick Reference suggestion presets
const LOCATION_PRESETS = [
  'Grand Ballroom, Downtown NYC',
  'Riverside Botanical Gardens, Austin',
  'Oceanfront Sunset Pavilion, Miami',
  'Historic Napa Valley Vineyard Estate',
  'Metropolitan Innovation Glasshouse',
];

const THEME_PRESETS = [
  'Enchanted Garden & Fairy Lights',
  'Modern Minimalist Black-Tie',
  'Warm Vintage Bohemian Sunset',
  'Celestial Midnight Starlight & Velvet',
  'Tropical Neon Oasis & Sunset Lounge',
];

const FOOD_PRESETS = [
  'Farm-to-Table Seasonal & Vegan Options',
  'Gourmet 5-Course Plated Dinner',
  'Authentic Asian Fusion & Dim Sum Bar',
  'Mediterranean Tapas & Wine Pairing',
  'Live Artisan Wood-Fired Pizza & Dessert Stations',
];

const REQUIREMENT_PRESETS = [
  'Wheelchair accessible & step-free throughout',
  'All-weather rain backup canopy guaranteed',
  'Silent disco headphones after 10 PM curfew',
  'Eco-friendly zero plastic waste policy',
  '4K multi-camera live stream for remote guests',
];

// Showcase of Past, Current, and Upcoming Events
const SHOWCASE_EVENTS = [
  {
    status: 'Upcoming' as const,
    statusColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    title: 'Sarah & James — Enchanted Garden Wedding',
    date: 'June 20, 2026',
    location: 'Botanical Gardens, Austin TX',
    guests: 120,
    budget: '₹50,000 INR',
    client: 'Sarah Jenkins',
    rating: 5,
    testimonial: 'The AI budget allocation and timeline milestones saved us months of anxiety. Our guests are already raving about the interactive RSVP form!',
  },
  {
    status: 'Current' as const,
    statusColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    title: 'TechHorizon 2026 — Global AI Summit',
    date: 'Nov 14, 2026 (Active)',
    location: 'Metropolitan Convention Center, NYC',
    guests: 350,
    budget: '₹1,20,000 INR',
    client: 'David K. Vance',
    rating: 5,
    testimonial: 'Coordinating 350 tech executives with custom dietary needs and breakout schedules was automated effortlessly with EventGenie AI.',
  },
  {
    status: 'Past' as const,
    statusColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    title: 'Sophia & Liam — Golden 50th Anniversary Gala',
    date: 'Celebrated Sep 15, 2025',
    location: 'Villa Bellavista, Napa Valley CA',
    guests: 85,
    budget: '₹38,000 INR',
    client: 'Elena & Marcus Rossi',
    rating: 5,
    testimonial: 'Executed to absolute perfection. 100% on schedule and under budget. The AI-suggested Italian wine pairing was an absolute sensation.',
  },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    eventType: '' as EventType | '',
    eventName: '',
    eventDate: '',
    location: '',
    guestCount: '',
    totalBudget: '',
    currency: 'INR',
    theme: '',
    foodPreferences: '',
    venuePreference: '' as VenuePreference | '',
    specialRequirements: '',
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState('');
  const [step, setStep] = useState<'form' | 'generating' | 'success'>('form');

  function getError(field: string): string | undefined {
    return errors.find(e => e.field === field)?.message;
  }

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => prev.filter(e => e.field !== field));
    setApiError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validateEventSetup({
      ...formData,
      guestCount: parseInt(formData.guestCount) || 0,
      totalBudget: parseFloat(formData.totalBudget) || 0,
    } as Partial<EventSetup>);

    if (validation.length > 0) {
      setErrors(validation);
      return;
    }

    const setup = {
      eventType: formData.eventType as EventType,
      eventName: formData.eventName,
      eventDate: formData.eventDate,
      location: formData.location,
      guestCount: parseInt(formData.guestCount),
      totalBudget: parseFloat(formData.totalBudget),
      currency: formData.currency,
      theme: formData.theme,
      foodPreferences: formData.foodPreferences,
      venuePreference: formData.venuePreference as VenuePreference,
      specialRequirements: formData.specialRequirements,
    };

    const event = createEvent(setup);
    setIsGenerating(true);
    setStep('generating');
    setApiError('');

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.setup),
        signal: AbortSignal.timeout(60000),
      });

      const data = await res.json();

      if (data.success && data.data) {
        saveEventPlan(event.setup.id, data.data);

        // Apply AI budget allocations
        if (data.data.budgetAllocation) {
          const updatedCategories = applyAIBudgetAllocations(
            event.setup.totalBudget,
            data.data.budgetAllocation
          );
          updateEvent(event.setup.id, {
            budget: {
              categories: updatedCategories,
              totalBudget: event.setup.totalBudget,
              currency: event.setup.currency,
            },
          });
        }

        // Create tasks from AI checklist
        if (data.data.taskChecklist) {
          const eventDate = new Date(event.setup.eventDate);
          const tasks = data.data.taskChecklist.map((task: { title: string; description: string; category: string; priority: 'high' | 'medium' | 'low'; daysBeforeEvent: number }, i: number) => ({
            id: `task-${Date.now()}-${i}`,
            title: task.title,
            description: task.description,
            dueDate: new Date(eventDate.getTime() - task.daysBeforeEvent * 86400000).toISOString().split('T')[0],
            priority: task.priority,
            status: 'pending' as const,
            category: task.category,
            eventId: event.setup.id,
          }));
          updateEvent(event.setup.id, { tasks });
        }

        setStep('success');
        setTimeout(() => router.push(`/events/${event.setup.id}`), 1500);
      } else {
        setApiError(data.error || 'Failed to generate plan. Your event has been saved — you can generate a plan later.');
        setStep('form');
        setIsGenerating(false);
      }
    } catch {
      setApiError('AI service is temporarily busy. Your event has been saved — redirecting to event command center.');
      setStep('form');
      setIsGenerating(false);
      setTimeout(() => router.push(`/events/${event.setup.id}`), 2500);
    }
  }

  if (step === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-indigo-500/20 animate-pulse-soft">
            <Sparkles size={32} className="text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">Generating Your AI Event Plan...</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-center max-w-md text-sm">
          Crafting personalized decoration ideas, custom menu items, milestone timeline, and smart budget distribution.
        </p>
        <div className="flex items-center gap-2 mt-4 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
          <Loader2 size={16} className="animate-spin" />
          Powered by Gemini AI · Usually ready in 10-20s
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
          <CheckCircle2 size={32} className="text-white" />
        </div>
        <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">Event Plan Created Successfully!</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Opening your event command center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-16 space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2 border border-indigo-200 dark:border-indigo-800">
          <Sparkles size={14} />
          <span>AI-Powered Event Creation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create New Event</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm sm:text-base">
          Fill in your event vision below. EventGenie AI generates comprehensive budget breakdowns, timelines, decor styles, and checklists in seconds.
        </p>
      </div>

      {apiError && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-amber-900 dark:text-amber-200">{apiError}</p>
        </div>
      )}

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-7">
        {/* Event Type - 9 Options */}
        <fieldset>
          <div className="flex items-center justify-between mb-3">
            <legend className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Select Event Type <span className="text-red-500">*</span>
            </legend>
            <span className="text-xs text-slate-400">9 Event Categories Available</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {eventTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleChange('eventType', type.value)}
                className={`p-3 rounded-2xl border-2 text-center transition-all duration-150 flex flex-col items-center justify-center ${
                  formData.eventType === type.value
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 shadow-md shadow-indigo-500/10 scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <span className="text-2xl mb-1">{type.emoji}</span>
                <p className={`text-[11px] font-semibold ${
                  formData.eventType === type.value
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {type.label}
                </p>
              </button>
            ))}
          </div>
          {getError('eventType') && <p className="text-xs text-red-500 font-medium mt-1.5">{getError('eventType')}</p>}
        </fieldset>

        {/* Event Name */}
        <FormField
          label="Event Name"
          icon={<CalendarDays size={16} />}
          required
          error={getError('eventName')}
        >
          <input
            type="text"
            value={formData.eventName}
            onChange={e => handleChange('eventName', e.target.value)}
            placeholder="e.g., Sarah's 30th Birthday Bash or TechHorizon 2026 Summit"
            className="form-input"
          />
        </FormField>

        {/* Date & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            label="Event Date"
            icon={<CalendarDays size={16} />}
            required
            error={getError('eventDate')}
          >
            <input
              type="date"
              value={formData.eventDate}
              onChange={e => handleChange('eventDate', e.target.value)}
              className="form-input"
            />
          </FormField>

          <FormField
            label="Location"
            icon={<MapPin size={16} />}
            required
            error={getError('location')}
          >
            <input
              type="text"
              value={formData.location}
              onChange={e => handleChange('location', e.target.value)}
              placeholder="e.g., Downtown Ballroom, NYC"
              className="form-input"
            />
            {/* Quick Reference Chips for Location */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} /> References:
              </span>
              {LOCATION_PRESETS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleChange('location', loc)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700/80 transition-all font-medium"
                >
                  + {loc}
                </button>
              ))}
            </div>
          </FormField>
        </div>

        {/* Guests, Budget, Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <FormField
            label="Expected Guest Count"
            icon={<Users size={16} />}
            required
            error={getError('guestCount')}
          >
            <input
              type="number"
              value={formData.guestCount}
              onChange={e => handleChange('guestCount', e.target.value)}
              placeholder="e.g., 100"
              min="1"
              className="form-input"
            />
          </FormField>

          <FormField
            label="Total Budget"
            icon={<Wallet size={16} />}
            required
            error={getError('totalBudget')}
          >
            <input
              type="number"
              value={formData.totalBudget}
              onChange={e => handleChange('totalBudget', e.target.value)}
              placeholder="e.g., 50000"
              min="1"
              className="form-input"
            />
          </FormField>

          <FormField
            label="Currency"
            required
            error={getError('currency')}
          >
            <select
              value={formData.currency}
              onChange={e => handleChange('currency', e.target.value)}
              className="form-input"
            >
              {currencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Preferred Theme & Food Preferences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Preferred Theme" icon={<Palette size={16} />}>
            <input
              type="text"
              value={formData.theme}
              onChange={e => handleChange('theme', e.target.value)}
              placeholder="e.g., Rustic Garden, Celestial Midnight, Neon Retro"
              className="form-input"
            />
            {/* Quick Reference Chips for Theme */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} /> References:
              </span>
              {THEME_PRESETS.map((th) => (
                <button
                  key={th}
                  type="button"
                  onClick={() => handleChange('theme', th)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700/80 transition-all font-medium"
                >
                  + {th}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Food Preferences" icon={<UtensilsCrossed size={16} />}>
            <input
              type="text"
              value={formData.foodPreferences}
              onChange={e => handleChange('foodPreferences', e.target.value)}
              placeholder="e.g., Vegetarian, Asian fusion, Mediterranean tapas"
              className="form-input"
            />
            {/* Quick Reference Chips for Food */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} /> References:
              </span>
              {FOOD_PRESETS.map((food) => (
                <button
                  key={food}
                  type="button"
                  onClick={() => handleChange('foodPreferences', food)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700/80 transition-all font-medium"
                >
                  + {food}
                </button>
              ))}
            </div>
          </FormField>
        </div>

        {/* Venue Preference */}
        <fieldset>
          <legend className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
            <Building size={16} className="text-indigo-500" /> Venue Preference <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-3 gap-3">
            {(['indoor', 'outdoor', 'both'] as VenuePreference[]).map(pref => (
              <button
                key={pref}
                type="button"
                onClick={() => handleChange('venuePreference', pref)}
                className={`py-3 px-4 rounded-2xl border-2 text-sm font-semibold capitalize transition-all ${
                  formData.venuePreference === pref
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
          {getError('venuePreference') && <p className="text-xs text-red-500 font-medium mt-1.5">{getError('venuePreference')}</p>}
        </fieldset>

        {/* Special Requirements */}
        <FormField label="Special Requirements">
          <textarea
            value={formData.specialRequirements}
            onChange={e => handleChange('specialRequirements', e.target.value)}
            placeholder="e.g., Step-free wheelchair accessibility, silent disco after 10 PM, live streaming equipment"
            rows={3}
            className="form-input resize-none"
          />
          {/* Quick Reference Chips for Requirements */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} /> References:
            </span>
            {REQUIREMENT_PRESETS.map((req) => (
              <button
                key={req}
                type="button"
                onClick={() => handleChange('specialRequirements', req)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700/80 transition-all font-medium"
              >
                + {req}
              </button>
            ))}
          </div>
        </FormField>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
          >
            {isGenerating ? (
              <><Loader2 size={20} className="animate-spin" /> Generating AI Event Plan...</>
            ) : (
              <><Sparkles size={20} /> Create Event & Generate Full AI Plan</>
            )}
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            Instant budget allocation, vendor milestones, guest list templates, and tailored decor concepts.
          </p>
        </div>
      </form>

      {/* 🌟 Past, Current & Upcoming Events with Satisfied Customers */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="text-amber-400 fill-amber-400" size={22} />
              Featured Events Portfolio & Verified Client Reviews
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
              Explore past successes, current active productions, and upcoming milestones planned with EventGenie AI.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
            <ShieldCheck size={14} /> 100% 5.0 ⭐ Satisfaction Rating
          </div>
        </div>

        {/* Events Showcase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SHOWCASE_EVENTS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${item.statusColor}`}>
                    {item.status} Event
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} size={12} className="fill-amber-400" />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    {item.location}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Guests</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.guests} Expected</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Budget</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.budget}</span>
                  </div>
                </div>

                <div className="relative pt-2">
                  <Quote size={16} className="text-indigo-300 dark:text-indigo-600 mb-1" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                    &ldquo;{item.testimonial}&rdquo;
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">{item.client}</span>
                  <span className="text-slate-400 text-[11px]">Verified Organizer</span>
                </div>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check size={12} /> Satisfied
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Testimonial Quotes Carousel/Grid */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="fill-amber-400" />
              ))}
              <span className="text-xs font-bold text-white ml-1">5.0 / 5.0 Average Rating across 1,200+ Events</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              &ldquo;The AI budget optimizer flagged $7,450 in redundant allocations that we redirected to our dream photographer.&rdquo;
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              — Sarah Jenkins & James Miller, Enchanted Garden Wedding Hosts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon,
  required,
  error,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
        {icon && <span className="text-indigo-500">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
    </div>
  );
}
