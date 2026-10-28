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
} from 'lucide-react';
import { EventSetup, EventType, VenuePreference, ValidationError } from '@/lib/types';
import { validateEventSetup } from '@/lib/validation';
import { createEvent, updateEvent, saveEventPlan } from '@/lib/store';
import { applyAIBudgetAllocations } from '@/lib/budget';

const eventTypes: { value: EventType; label: string; emoji: string }[] = [
  { value: 'wedding', label: 'Wedding', emoji: '💍' },
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'community', label: 'Community', emoji: '🎪' },
  { value: 'corporate', label: 'Corporate', emoji: '🏢' },
  { value: 'other', label: 'Other', emoji: '🎉' },
];

const currencies = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY'];

export default function CreateEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    eventType: '' as EventType | '',
    eventName: '',
    eventDate: '',
    location: '',
    guestCount: '',
    totalBudget: '',
    currency: 'USD',
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
    } catch (err) {
      setApiError('AI service is unavailable. Your event has been saved — you can explore it without AI features.');
      setStep('form');
      setIsGenerating(false);
      // Event is still saved, user can still use it
      setTimeout(() => router.push(`/events/${event.setup.id}`), 3000);
    }
  }

  if (step === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-indigo-200 animate-pulse-soft">
            <Sparkles size={32} className="text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">Generating Your Event Plan...</h2>
        <p className="text-slate-500 mt-2 text-center max-w-md">
          Our AI is crafting personalized decoration ideas, menu suggestions, timeline, and budget allocation for your event.
        </p>
        <div className="flex items-center gap-2 mt-4 text-sm text-indigo-600">
          <Loader2 size={16} className="animate-spin" />
          This may take up to 30 seconds
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-2xl shadow-emerald-200">
          <CheckCircle2 size={32} className="text-white" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">Event Plan Created!</h2>
        <p className="text-slate-500 mt-2">Redirecting to your event details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Create New Event</h1>
        <p className="text-slate-500 mt-1">Fill in your event details and let AI generate a personalized plan.</p>
      </div>

      {apiError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-amber-800">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Type */}
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700 mb-3">Event Type *</legend>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {eventTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleChange('eventType', type.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  formData.eventType === type.value
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-2xl">{type.emoji}</span>
                <p className="text-xs font-medium mt-1">{type.label}</p>
              </button>
            ))}
          </div>
          {getError('eventType') && <p className="text-sm text-red-500 mt-1">{getError('eventType')}</p>}
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
            placeholder="e.g., Sarah's 30th Birthday Bash"
            className="form-input"
          />
        </FormField>

        {/* Date & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </FormField>
        </div>

        {/* Guests, Budget, Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            label="Guest Count"
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

        {/* Theme & Food */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Preferred Theme" icon={<Palette size={16} />}>
            <input
              type="text"
              value={formData.theme}
              onChange={e => handleChange('theme', e.target.value)}
              placeholder="e.g., Rustic Garden, Black Tie"
              className="form-input"
            />
          </FormField>
          <FormField label="Food Preferences" icon={<UtensilsCrossed size={16} />}>
            <input
              type="text"
              value={formData.foodPreferences}
              onChange={e => handleChange('foodPreferences', e.target.value)}
              placeholder="e.g., Vegetarian, Indian cuisine"
              className="form-input"
            />
          </FormField>
        </div>

        {/* Venue Preference */}
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Building size={16} /> Venue Preference *
          </legend>
          <div className="flex gap-3">
            {(['indoor', 'outdoor', 'both'] as VenuePreference[]).map(pref => (
              <button
                key={pref}
                type="button"
                onClick={() => handleChange('venuePreference', pref)}
                className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                  formData.venuePreference === pref
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
          {getError('venuePreference') && <p className="text-sm text-red-500 mt-1">{getError('venuePreference')}</p>}
        </fieldset>

        {/* Special Requirements */}
        <FormField label="Special Requirements">
          <textarea
            value={formData.specialRequirements}
            onChange={e => handleChange('specialRequirements', e.target.value)}
            placeholder="e.g., Wheelchair accessibility, dietary restrictions, live music"
            rows={3}
            className="form-input resize-none"
          />
        </FormField>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isGenerating}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <><Loader2 size={18} className="animate-spin" /> Generating...</>
            ) : (
              <><Sparkles size={18} /> Create Event & Generate AI Plan</>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .form-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          color: #0f172a;
          background: #fff;
          transition: all 0.2s;
          outline: none;
        }
        .form-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .form-input::placeholder {
          color: #94a3b8;
        }
      `}</style>
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
      <label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
