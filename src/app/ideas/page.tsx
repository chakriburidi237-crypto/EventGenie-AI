'use client';

import { useState } from 'react';
import { Sparkles, Palette, Loader2, AlertCircle } from 'lucide-react';
import { AIThemeIdea } from '@/lib/types';

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
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="text-indigo-600" size={28} /> Theme & Idea Explorer
        </h1>
        <p className="text-slate-500 mt-1">
          Generate creative event concepts, visual styles, and catering setups tuned to your budget and guest count.
        </p>
      </div>

      {/* Explorer Controls */}
      <form onSubmit={handleExplore} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500 bg-white"
            >
              <option value="wedding">Wedding</option>
              <option value="birthday">Birthday Party</option>
              <option value="community">Community Festival</option>
              <option value="corporate">Corporate Gala</option>
              <option value="anniversary">Anniversary</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Target Budget</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500 bg-white"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Guest Count</label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 block mb-1">Style Preferences / Keywords</label>
          <input
            type="text"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="e.g. Minimalist, neon accents, Mediterranean food, retro 80s"
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Generate New Ideas
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.map((idea, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Concept {i + 1}</span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {idea.estimatedBudgetRange}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{idea.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{idea.description}</p>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Key Highlights</h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {idea.keyElements.map((elem, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>{elem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-6 flex flex-wrap gap-1.5">
              {idea.suitableFor.map((tag, idx) => (
                <span key={idx} className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
