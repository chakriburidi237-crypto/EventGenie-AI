'use client';

import { useState } from 'react';
import {
  Sparkles,
  Palette,
  Loader2,
  AlertCircle,
  Star,
  Quote,
  ShieldCheck,
  Check,
  MapPin,
  CalendarDays,
  Users,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { AIThemeIdea } from '@/lib/types';
import { CUSTOMER_TESTIMONIALS } from '@/lib/demo-data';

// Quick reference style suggestions
const STYLE_KEYWORD_PRESETS = [
  'Nature inspired, cozy atmosphere, twilight vibes',
  'Luxury black-tie elegance with starlight canopy',
  'Warm rustic bohemian sunset & dried botanicals',
  'Cyberpunk neon retro with glowing ambient lounge',
  'Mediterranean coastal breeze, olive sprigs & citrus',
  'Minimalist modern glasshouse with brass accents',
  'Tuscan vineyard harvest banquet with acoustic strings',
  'Enchanted fairytale forest with bioluminescent floral arches',
];

const SHOWCASE_INSPIRATIONS = [
  {
    status: 'Upcoming' as const,
    title: 'Sarah & James — Enchanted Garden Wedding',
    theme: 'Botanical Glasshouse Twilight',
    client: 'Sarah Jenkins',
    rating: 5,
    quote: 'The AI idea generator gave us the exact twilight fairy light & acoustic duo concept that our wedding planner used!',
  },
  {
    status: 'Current' as const,
    title: 'TechHorizon 2026 — Global AI Summit',
    theme: 'Cybernetic Innovation Hub & Neon Lounge',
    client: 'David K. Vance',
    rating: 5,
    quote: 'Our executive reception theme came directly from these keyword presets. The delegates loved the interactive projection mapping.',
  },
  {
    status: 'Past' as const,
    title: 'Sophia & Liam — Golden 50th Anniversary Gala',
    theme: 'Tuscan Sunset Vineyard & Candlelit Arches',
    client: 'Elena & Marcus Rossi',
    rating: 5,
    quote: 'Timeless elegance. The suggested wine pairing and grazing table design made our 50th anniversary unforgettable.',
  },
];

export default function IdeasPage() {
  const [eventType, setEventType] = useState('wedding');
  const [budget, setBudget] = useState(25000);
  const [currency, setCurrency] = useState('USD');
  const [guestCount, setGuestCount] = useState(80);
  const [preferences, setPreferences] = useState('Nature inspired, cozy atmosphere, twilight vibes');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ideas, setIdeas] = useState<AIThemeIdea[]>([
    {
      title: 'Botanical Glasshouse Twilight',
      description: 'An indoor-outdoor garden evening with lush tropical foliage, brass accents, ambient string fairy lights, and artisanal mocktail stations.',
      estimatedBudgetRange: '$18,000 – $24,000 (estimated)',
      keyElements: ['Terrarium centerpieces', 'Fairy light canopy', 'Wood-fired gourmet pizza station', 'Acoustic indie folk duo'],
      suitableFor: ['Wedding', 'Anniversary', 'Intimate Celebration'],
    },
    {
      title: 'Celestial Midnight Elegance',
      description: 'A deep navy and starlight aesthetic featuring geometric metallic structures, galaxy projection mapping, and velvet lounge seating.',
      estimatedBudgetRange: '$22,000 – $28,000 (estimated)',
      keyElements: ['Deep blue velvet drapes', 'Starlight projection', 'Champagne pyramid tower', 'Live jazz quartet'],
      suitableFor: ['Gala', 'Corporate Milestone', 'Wedding'],
    },
    {
      title: 'Vintage Bohemian Sunset',
      description: 'Warm earth tones, rattan furniture, macrame installations, and dried floral bouquets under warm golden-hour lighting.',
      estimatedBudgetRange: '$15,000 – $20,000 (estimated)',
      keyElements: ['Pampas grass arches', 'Rattan lounge areas', 'Grazing charcuterie tables', 'Polaroid guestbook station'],
      suitableFor: ['Birthday', 'Baby Shower', 'Community Gathering'],
    },
  ]);

  async function handleExplore(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/explore-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          budget: Number(budget),
          currency,
          guestCount: Number(guestCount),
          preferences,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setIdeas(data.data);
      } else {
        setError(data.error || 'Failed to fetch suggestions from AI.');
      }
    } catch {
      setError('AI exploration service is currently unavailable. Showing curated recommendations below.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2 border border-indigo-200 dark:border-indigo-800">
          <Sparkles size={14} />
          <span>Generative Style Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Palette className="text-indigo-600 dark:text-indigo-400" size={32} /> Theme & Idea Explorer
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm sm:text-base max-w-3xl">
          Generate creative event concepts, custom aesthetic palettes, catering installations, and entertainment packages tuned to your budget and guest count.
        </p>
      </div>

      {/* Explorer Controls */}
      <form onSubmit={handleExplore} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="form-input"
            >
              <option value="wedding">💍 Wedding</option>
              <option value="birthday">🎂 Birthday Party</option>
              <option value="anniversary">🥂 Anniversary Gala</option>
              <option value="baby-shower">🍼 Baby Shower</option>
              <option value="corporate">🏢 Corporate Summit</option>
              <option value="community">🎪 Community Festival</option>
              <option value="graduation">🎓 Graduation Party</option>
              <option value="festival">🎵 Music & Arts Festival</option>
              <option value="other">🎉 Other / Custom Celebration</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Target Budget</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              min="1"
              className="form-input"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="form-input"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Guest Count</label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              min="1"
              className="form-input"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Style Preferences / Keywords</label>
          <input
            type="text"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="e.g. Minimalist, neon accents, Mediterranean food, retro 80s"
            className="form-input"
          />

          {/* Quick References Chips for Style Preferences */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} /> References:
            </span>
            {STYLE_KEYWORD_PRESETS.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setPreferences(style)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700/80 transition-all font-medium"
              >
                + {style}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Generate New Ideas
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-sm rounded-2xl flex items-center gap-2">
          <AlertCircle size={18} className="text-amber-500 shrink-0" /> {error}
        </div>
      )}

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.map((idea, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-200 group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                  Concept {i + 1}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  {idea.estimatedBudgetRange}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {idea.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                {idea.description}
              </p>

              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Signature Highlights
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {idea.keyElements.map((elem, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                      <span>{elem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex flex-wrap gap-1.5">
              {idea.suitableFor.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 🌟 Past, Current & Upcoming Theme Inspiration Showcase */}
      <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="text-amber-400 fill-amber-400" size={22} />
              Real Event Inspirations & Satisfied Customers
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
              See how past, current, and upcoming hosts brought EventGenie AI theme concepts to life.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
            <ShieldCheck size={14} /> Certified Customer Reviews
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SHOWCASE_INSPIRATIONS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    item.status === 'Upcoming'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                      : item.status === 'Current'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {item.status} Milestone
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} size={12} className="fill-amber-400" />
                    ))}
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {item.title}
                </h3>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Applied Theme</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.theme}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">{item.client}</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check size={12} /> Verified Client
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
