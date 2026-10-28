'use client';

import { Suspense, use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  MapPin,
  Users,
  Wallet,
  Sparkles,
  ListChecks,
  Users2,
  Download,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  TrendingDown,
  Edit3,
  Printer,
  UserCheck,
} from 'lucide-react';
import { FullEvent, AIEventPlan, TimelineTask, Vendor, TaskPriority, TaskStatus, BookingStatus } from '@/lib/types';
import { getEventById, updateEvent, saveEventPlan, addTask, updateTask, deleteTask, addVendor, updateVendor, deleteVendor, exportEventToText, initializeStore } from '@/lib/store';
import { calculateTotalEstimated, calculateTotalActual, calculateRemainingBudget, isOverBudget, formatCurrency, applyAIBudgetAllocations } from '@/lib/budget';
import { useToast } from '@/components/Toast';

export default function EventDetailPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="space-y-4"><div className="skeleton h-12 w-64" /><div className="skeleton h-96 w-full rounded-2xl" /></div>}>
      <EventDetailContent {...props} />
    </Suspense>
  );
}

function EventDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  const [event, setEvent] = useState<FullEvent | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'budget' | 'timeline' | 'vendors' | 'optimize'>('plan');
  
  function handlePrint() {
    window.print();
  }
  
  // AI Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  // New task form state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as TaskPriority,
    category: 'General'
  });

  // New vendor form state
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    serviceCategory: 'Venue',
    bookingStatus: 'contacted' as BookingStatus,
    contactNotes: '',
    estimatedCost: 0,
    phone: '',
    email: ''
  });

  // AI Optimizer state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{
    summary: string;
    adjustments: { category: string; originalAmount: number; proposedAmount: number; suggestion: string }[];
    totalSavings: number;
    preservedPriorities: string[];
  } | null>(null);

  useEffect(() => {
    initializeStore();
    const found = getEventById(resolvedParams.id);
    if (found) {
      setEvent(found);
    }
    setLoaded(true);
  }, [resolvedParams.id]);

  function refreshEvent() {
    const updated = getEventById(resolvedParams.id);
    if (updated) setEvent({ ...updated });
  }

  async function handleGeneratePlan() {
    if (!event) return;
    setIsGenerating(true);
    setGenError('');

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.setup)
      });
      const data = await res.json();
      if (data.success && data.data) {
        saveEventPlan(event.setup.id, data.data);
        if (data.data.budgetAllocation) {
          const updatedCategories = applyAIBudgetAllocations(event.setup.totalBudget, data.data.budgetAllocation);
          updateEvent(event.setup.id, {
            budget: {
              ...event.budget,
              categories: updatedCategories
            }
          });
        }
        refreshEvent();
      } else {
        setGenError(data.error || 'Failed to generate plan.');
      }
    } catch {
      setGenError('Unable to connect to AI plan service. Check your connection or API key.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleOptimizeBudget() {
    if (!event) return;
    setIsOptimizing(true);
    try {
      const budgetItems = event.budget.categories.map(c => ({
        category: c.name,
        amount: c.estimated
      }));
      const res = await fetch('/api/optimize-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setup: event.setup,
          currentBudget: budgetItems,
          priorities: [event.setup.theme, event.setup.foodPreferences].filter(Boolean)
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOptimizationResult(data.data);
        addToast('Budget optimization suggestions ready!', 'success');
      } else {
        addToast(data.error || 'Optimization unavailable.', 'error');
      }
    } catch {
      addToast('AI optimizer service error.', 'error');
    } finally {
      setIsOptimizing(false);
    }
  }

  function applyOptimizedAllocations() {
    if (!event || !optimizationResult) return;
    const updated = event.budget.categories.map(cat => {
      const match = optimizationResult.adjustments.find(a => 
        a.category.toLowerCase().includes(cat.name.toLowerCase()) || 
        cat.name.toLowerCase().includes(a.category.toLowerCase())
      );
      if (match) {
        return { ...cat, estimated: match.proposedAmount, notes: match.suggestion };
      }
      return cat;
    });
    updateEvent(event.setup.id, {
      budget: { ...event.budget, categories: updated }
    });
    refreshEvent();
    addToast('Optimized budget allocations applied!', 'success');
    setActiveTab('budget');
  }

  function handleExport() {
    if (!event) return;
    const text = exportEventToText(event);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.setup.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_plan.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Event plan exported as text file!', 'success');
  }

  function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !newTask.title.trim()) return;
    addTask(event.setup.id, {
      title: newTask.title,
      description: newTask.description,
      dueDate: newTask.dueDate || event.setup.eventDate,
      priority: newTask.priority,
      status: 'pending',
      category: newTask.category
    });
    setShowTaskModal(false);
    setNewTask({ title: '', description: '', dueDate: '', priority: 'medium', category: 'General' });
    refreshEvent();
  }

  function handleCreateVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !newVendor.serviceCategory) return;
    addVendor(event.setup.id, {
      name: newVendor.name,
      serviceCategory: newVendor.serviceCategory,
      bookingStatus: newVendor.bookingStatus,
      contactNotes: newVendor.contactNotes,
      estimatedCost: Number(newVendor.estimatedCost) || 0,
      phone: newVendor.phone,
      email: newVendor.email
    });
    setShowVendorModal(false);
    setNewVendor({ name: '', serviceCategory: 'Venue', bookingStatus: 'contacted', contactNotes: '', estimatedCost: 0, phone: '', email: '' });
    refreshEvent();
  }

  if (!loaded) {
    return <div className="space-y-4"><div className="skeleton h-12 w-64" /><div className="skeleton h-96 w-full rounded-2xl" /></div>;
  }

  if (!event) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <AlertCircle size={48} className="text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Event Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 mb-6">The requested event does not exist or was deleted.</p>
        <Link href="/events" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          Back to Events
        </Link>
      </div>
    );
  }

  const { setup, plan, budget, tasks, vendors } = event;
  const isPast = new Date(setup.eventDate) < new Date();
  const totalEstimated = calculateTotalEstimated(budget.categories);
  const totalActual = calculateTotalActual(budget.categories);
  const remainingBudget = calculateRemainingBudget(budget.totalBudget, budget.categories);
  const overBudget = isOverBudget(budget.totalBudget, budget.categories);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/events" className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{setup.eventName}</h1>
              {event.isDemo && (
                <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-800">
                  DEMO SAMPLE
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 capitalize">
              <span>{setup.eventType}</span> · 
              <span className="flex items-center gap-1"><MapPin size={14} />{setup.location}</span> · 
              <span className="flex items-center gap-1"><CalendarDays size={14} />{setup.eventDate}</span>
              {isPast && <span className="text-amber-600 font-semibold">(Past Event)</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/guests"
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <UserCheck size={16} className="text-emerald-500" /> Guests ({event.guests?.length || 0})
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition shadow-sm"
            title="Print-friendly view"
          >
            <Printer size={16} /> Print
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <Download size={16} /> Export
          </button>
          {!plan && (
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Generate AI Plan
            </button>
          )}
        </div>
      </div>

      {/* Demo Warning Banner */}
      {event.isDemo && (
        <div className="demo-banner">
          <AlertCircle size={18} />
          <span>This is sample demonstration data. It is preloaded for evaluation and does not represent live AI output.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 gap-2 pb-px text-sm font-semibold">
        {[
          { key: 'plan', label: 'AI Event Plan', icon: Sparkles },
          { key: 'budget', label: 'Budget Planner', icon: Wallet },
          { key: 'timeline', label: `Tasks & Timeline (${tasks.length})`, icon: ListChecks },
          { key: 'vendors', label: `Vendors (${vendors.length})`, icon: Users2 },
          { key: 'optimize', label: 'Budget Optimizer', icon: TrendingDown },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap ${
                active
                  ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              <Icon size={16} className={active ? 'text-indigo-600' : 'text-slate-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: AI EVENT PLAN */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {genError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle size={18} /> {genError}
            </div>
          )}

          {!plan ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-2xl p-8">
              <Sparkles size={40} className="text-indigo-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No AI Event Plan Yet</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
                Click below to generate a comprehensive concept, themed decorations, catering suggestions, and preparation timeline.
              </p>
              <button
                onClick={handleGeneratePlan}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Generate Plan Now
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Concept & Theme Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-2">Event Concept</h3>
                  <p className="text-slate-700 leading-relaxed text-sm sm:text-base">{plan.eventConcept}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-2">Theme & Atmosphere</h3>
                  <p className="text-slate-700 leading-relaxed text-sm sm:text-base">{plan.themeDescription}</p>
                </div>
              </div>

              {/* Ideas Sections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    🎨 Decoration Ideas
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {plan.decorationIdeas.map((idea, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{idea}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    🍽 Food & Catering
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {plan.foodSuggestions.map((food, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{food}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    🎵 Entertainment
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {plan.entertainmentIdeas.map((ent, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{ent}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-950/40 dark:to-cyan-950/30 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/60">
                <h4 className="font-bold text-indigo-950 dark:text-indigo-200 mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" /> Personalized Recommendations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plan.personalizedRecommendations.map((rec, i) => (
                    <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur p-3.5 rounded-xl border border-indigo-100/50 dark:border-indigo-800/50 text-sm text-slate-700 dark:text-slate-200">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SMART BUDGET PLANNER */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Budget</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(budget.totalBudget, budget.currency)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Estimated Total</span>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{formatCurrency(totalEstimated, budget.currency)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Actual Spent</span>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(totalActual, budget.currency)}</p>
            </div>
            <div className={`p-4 rounded-xl border shadow-sm ${overBudget ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <span className="text-xs font-semibold uppercase text-slate-500">Remaining</span>
              <p className={`text-xl font-bold mt-1 ${overBudget ? 'text-red-600' : 'text-emerald-700'}`}>
                {formatCurrency(remainingBudget, budget.currency)}
              </p>
              {overBudget && (
                <span className="text-[11px] font-semibold text-red-600 block mt-0.5">Over Budget!</span>
              )}
            </div>
          </div>

          {/* Budget Categories Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Budget Categories</h3>
                <p className="text-xs text-slate-500">All prices are user-managed estimates. No real market vendor quotes are fabricated.</p>
              </div>
              {overBudget && (
                <button
                  onClick={() => setActiveTab('optimize')}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition"
                >
                  Optimize with AI
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Estimated ({budget.currency})</th>
                    <th className="py-3 px-4 font-semibold">Actual ({budget.currency})</th>
                    <th className="py-3 px-4 font-semibold">Notes / Disclaimer</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budget.categories.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-medium text-slate-800">{cat.name}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={cat.estimated}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...budget.categories];
                            updated[idx] = { ...cat, estimated: val };
                            updateEvent(event.setup.id, { budget: { ...budget, categories: updated } });
                            refreshEvent();
                          }}
                          className="w-28 px-2 py-1 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={cat.actual}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...budget.categories];
                            updated[idx] = { ...cat, actual: val };
                            updateEvent(event.setup.id, { budget: { ...budget, categories: updated } });
                            refreshEvent();
                          }}
                          className="w-28 px-2 py-1 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={cat.notes}
                          onChange={(e) => {
                            const updated = [...budget.categories];
                            updated[idx] = { ...cat, notes: e.target.value };
                            updateEvent(event.setup.id, { budget: { ...budget, categories: updated } });
                            refreshEvent();
                          }}
                          placeholder="e.g. Estimate based on guest count"
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-xs text-slate-400">
                          {budget.totalBudget > 0 ? `${Math.round((cat.estimated / budget.totalBudget) * 100)}%` : '0%'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TIMELINE AND TASKS */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Preparation Tasks</h3>
              <p className="text-xs text-slate-500">Track deadlines, assign priorities, and keep event preparation on schedule.</p>
            </div>
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus size={16} /> Add Task
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <ListChecks size={36} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-semibold text-sm">No tasks added yet.</p>
              <p className="text-slate-400 text-xs mt-1">Add tasks manually or generate an AI plan to import a full checklist.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const isTaskPast = new Date(task.dueDate) < new Date();
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      task.status === 'completed'
                        ? 'bg-slate-50 border-slate-200 opacity-75'
                        : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={(e) => {
                          updateTask(event.setup.id, task.id, {
                            status: e.target.checked ? 'completed' : 'pending'
                          });
                          refreshEvent();
                        }}
                        className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {task.title}
                          </h4>
                          <span className={`badge badge-${task.priority}`}>
                            {task.priority}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 px-2 py-0.5 bg-slate-100 rounded">
                            {task.category}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock size={12} /> Due: {task.dueDate}
                          {isTaskPast && task.status !== 'completed' && (
                            <span className="text-red-500 font-bold ml-1">(Overdue)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <select
                        value={task.status}
                        onChange={(e) => {
                          updateTask(event.setup.id, task.id, { status: e.target.value as TaskStatus });
                          refreshEvent();
                        }}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => {
                          deleteTask(event.setup.id, task.id);
                          refreshEvent();
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VENDORS */}
      {activeTab === 'vendors' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vendor Checklist</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage vendors, quotes, and booking status. Fictional businesses are never auto-assigned.</p>
            </div>
            <button
              onClick={() => setShowVendorModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus size={16} /> Add Vendor
            </button>
          </div>

          {vendors.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Users2 size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-600 dark:text-slate-300 font-semibold text-sm">No vendors tracked yet.</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Add your venue, caterer, photographer or decorator contacts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vendors.map((vendor) => (
                <div key={vendor.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                        {vendor.serviceCategory}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {vendor.name || '(Vendor name not assigned)'}
                      </h4>
                    </div>
                    <span className={`badge badge-${vendor.bookingStatus}`}>
                      {vendor.bookingStatus}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p><span className="font-semibold text-slate-700 dark:text-slate-200">Est. Cost:</span> {formatCurrency(vendor.estimatedCost, setup.currency)}</p>
                    {vendor.phone && <p><span className="font-semibold text-slate-700 dark:text-slate-200">Phone:</span> {vendor.phone}</p>}
                    {vendor.email && <p><span className="font-semibold text-slate-700 dark:text-slate-200">Email:</span> {vendor.email}</p>}
                    {vendor.contactNotes && (
                      <p className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg text-slate-600 dark:text-slate-300 italic mt-2">
                        "{vendor.contactNotes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <select
                      value={vendor.bookingStatus}
                      onChange={(e) => {
                        updateVendor(event.setup.id, vendor.id, { bookingStatus: e.target.value as BookingStatus });
                        refreshEvent();
                      }}
                      className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                    >
                      <option value="contacted">Contacted</option>
                      <option value="quoted">Quoted</option>
                      <option value="booked">Booked</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={() => {
                        deleteVendor(event.setup.id, vendor.id);
                        refreshEvent();
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AI BUDGET OPTIMIZER */}
      {activeTab === 'optimize' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingDown size={20} className="text-indigo-600" /> AI Budget Optimizer
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Analyze current allocations against total budget. The AI suggests practical savings while preserving your highest priority items.
                </p>
              </div>

              <button
                onClick={handleOptimizeBudget}
                disabled={isOptimizing}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                {isOptimizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Run Optimization
              </button>
            </div>

            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl text-sm border border-slate-200/80 mb-6">
              <div>
                <span className="text-xs text-slate-400 block">Total Budget:</span>
                <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(budget.totalBudget, budget.currency)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Current Estimated:</span>
                <span className={`font-bold ${overBudget ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                  {formatCurrency(totalEstimated, budget.currency)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Status:</span>
                <span className={`font-semibold ${overBudget ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {overBudget ? `Over by ${formatCurrency(totalEstimated - budget.totalBudget, budget.currency)}` : 'Within Budget'}
                </span>
              </div>
            </div>

            {optimizationResult && (
              <div className="space-y-6 border-t border-slate-100 dark:border-slate-800 pt-6 animate-fade-in">
                <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
                  <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 mb-1">AI Recommendation Summary</h4>
                  <p className="text-sm text-indigo-800 dark:text-indigo-300">{optimizationResult.summary}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Category</th>
                        <th className="py-2.5 px-3 font-semibold">Current Est.</th>
                        <th className="py-2.5 px-3 font-semibold">Proposed Est.</th>
                        <th className="py-2.5 px-3 font-semibold">Savings</th>
                        <th className="py-2.5 px-3 font-semibold">Strategy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {optimizationResult.adjustments.map((adj, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{adj.category}</td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{formatCurrency(adj.originalAmount, budget.currency)}</td>
                          <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(adj.proposedAmount, budget.currency)}</td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(adj.originalAmount - adj.proposedAmount, budget.currency)}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-300">{adj.suggestion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                    Total Potential Savings: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{formatCurrency(optimizationResult.totalSavings, budget.currency)}</span>
                  </p>
                  <button
                    onClick={applyOptimizedAllocations}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition"
                  >
                    Apply Recommendations
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Preparation Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g. Schedule venue tasting"
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Additional notes or specifics..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Vendor</h3>
            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Vendor/Business Name</label>
                <input
                  type="text"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  placeholder="e.g. Blue Ridge Floral Co."
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Category *</label>
                  <select
                    value={newVendor.serviceCategory}
                    onChange={(e) => setNewVendor({ ...newVendor, serviceCategory: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="Venue">Venue</option>
                    <option value="Catering">Catering</option>
                    <option value="Photography">Photography</option>
                    <option value="Decoration">Decoration</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Invitations">Invitations</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Status</label>
                  <select
                    value={newVendor.bookingStatus}
                    onChange={(e) => setNewVendor({ ...newVendor, bookingStatus: e.target.value as BookingStatus })}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="booked">Booked</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Estimated Cost ({setup.currency})</label>
                <input
                  type="number"
                  value={newVendor.estimatedCost}
                  onChange={(e) => setNewVendor({ ...newVendor, estimatedCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Notes</label>
                <textarea
                  value={newVendor.contactNotes}
                  onChange={(e) => setNewVendor({ ...newVendor, contactNotes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
