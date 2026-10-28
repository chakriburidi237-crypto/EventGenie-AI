import { FullEvent, AIEventPlan, BudgetCategory } from './types';
import { getDefaultBudgetCategories } from './budget';

/**
 * Generate a unique ID.
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Sample event data for demo mode.
 * All values are clearly fictional and labelled as sample data.
 */
export function getDemoEvent(): FullEvent {
  const eventId = 'demo-event-001';
  const now = new Date();
  const eventDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

  const demoPlan: AIEventPlan = {
    eventConcept: 'An enchanted garden wedding blending natural beauty with elegant touches. The celebration emphasizes sustainability, local flavors, and intimate moments.',
    themeDescription: 'Enchanted Garden — soft greens, ivory, and gold accents with abundant greenery, fairy lights, and natural wood elements.',
    decorationIdeas: [
      'Arch of fresh eucalyptus and white roses at the ceremony entrance',
      'Wooden farm tables with linen runners and scattered wildflowers',
      'Fairy light canopy overhead with hanging glass terrariums',
      'Vintage lanterns along the aisle pathway',
      'Hand-lettered wooden signage for table numbers and welcome board',
    ],
    foodSuggestions: [
      'Farm-to-table seasonal menu with locally sourced ingredients',
      'Live pasta station with house-made sauces',
      'Artisan cheese and charcuterie grazing boards during cocktail hour',
      'Three-tier naked cake with edible flowers and berry filling',
      'Signature craft cocktails and a fresh lemonade bar',
    ],
    entertainmentIdeas: [
      'Acoustic duo for ceremony and cocktail hour',
      'DJ with curated playlist for reception dancing',
      'Photo booth with vintage props and instant prints',
      'Lawn games (croquet, cornhole) for guests during golden hour',
      'Sparkler send-off at the end of the evening',
    ],
    preparationTimeline: [
      { timeframe: '3 months before', task: 'Book venue and confirm date', priority: 'high' },
      { timeframe: '3 months before', task: 'Send save-the-dates to guests', priority: 'high' },
      { timeframe: '2 months before', task: 'Finalize catering menu and vendors', priority: 'high' },
      { timeframe: '2 months before', task: 'Order decorations and floral arrangements', priority: 'medium' },
      { timeframe: '1 month before', task: 'Send formal invitations with RSVP deadline', priority: 'high' },
      { timeframe: '2 weeks before', task: 'Confirm guest count and seating plan', priority: 'medium' },
      { timeframe: '1 week before', task: 'Final walkthrough with venue coordinator', priority: 'high' },
      { timeframe: 'Day before', task: 'Set up decorations and run rehearsal', priority: 'high' },
    ],
    vendorChecklist: [
      { category: 'Venue', description: 'Garden venue with indoor backup option', estimatedBudgetPercent: 30 },
      { category: 'Catering', description: 'Full-service catering with bar', estimatedBudgetPercent: 25 },
      { category: 'Photography', description: 'Photographer and videographer', estimatedBudgetPercent: 12 },
      { category: 'Florist', description: 'Ceremony and reception floral design', estimatedBudgetPercent: 8 },
      { category: 'Entertainment', description: 'Acoustic duo and DJ', estimatedBudgetPercent: 8 },
      { category: 'Cake', description: 'Custom wedding cake', estimatedBudgetPercent: 5 },
    ],
    taskChecklist: [
      { title: 'Research and visit venues', description: 'Visit top 3 venues and compare pricing', category: 'Venue', priority: 'high', daysBeforeEvent: 90 },
      { title: 'Book photographer', description: 'Review portfolios and book preferred photographer', category: 'Photography', priority: 'high', daysBeforeEvent: 75 },
      { title: 'Choose catering menu', description: 'Schedule tasting and select final menu', category: 'Food', priority: 'high', daysBeforeEvent: 60 },
      { title: 'Order wedding invitations', description: 'Design and order printed invitations', category: 'Invitations', priority: 'medium', daysBeforeEvent: 60 },
      { title: 'Plan seating arrangement', description: 'Create seating chart based on RSVPs', category: 'Planning', priority: 'medium', daysBeforeEvent: 14 },
      { title: 'Arrange transportation', description: 'Book shuttle or transportation for guests', category: 'Transportation', priority: 'low', daysBeforeEvent: 30 },
    ],
    budgetAllocation: [
      { category: 'Venue', percentage: 30, estimatedAmount: 15000, notes: 'AI estimate — verify with actual venue quotes' },
      { category: 'Food & Catering', percentage: 25, estimatedAmount: 12500, notes: 'AI estimate based on guest count' },
      { category: 'Photography', percentage: 12, estimatedAmount: 6000, notes: 'AI estimate — get actual quotes' },
      { category: 'Decoration', percentage: 10, estimatedAmount: 5000, notes: 'AI estimate — includes florals' },
      { category: 'Entertainment', percentage: 8, estimatedAmount: 4000, notes: 'AI estimate — ceremony and reception' },
      { category: 'Invitations', percentage: 3, estimatedAmount: 1500, notes: 'AI estimate — printed invitations' },
      { category: 'Transportation', percentage: 4, estimatedAmount: 2000, notes: 'AI estimate — guest shuttle' },
      { category: 'Miscellaneous', percentage: 8, estimatedAmount: 4000, notes: 'AI estimate — contingency fund' },
    ],
    personalizedRecommendations: [
      'Consider a venue with both indoor and outdoor spaces for weather flexibility.',
      'Wildflower arrangements are cost-effective and align with the garden theme.',
      'A food truck dessert bar can be a fun, budget-friendly alternative to a traditional cake.',
      'Digital invitations can save 60–80% of printing costs if budget is tight.',
      'Book vendors early — popular garden venues and photographers book 6–12 months out.',
    ],
  };

  const budgetCategories: BudgetCategory[] = [
    { id: 'venue', name: 'Venue', estimated: 15000, actual: 0, notes: 'AI estimate — verify with actual venue quotes' },
    { id: 'food', name: 'Food & Catering', estimated: 12500, actual: 0, notes: 'AI estimate based on guest count' },
    { id: 'decoration', name: 'Decoration', estimated: 5000, actual: 0, notes: 'AI estimate — includes florals' },
    { id: 'photography', name: 'Photography', estimated: 6000, actual: 0, notes: 'AI estimate — get actual quotes' },
    { id: 'entertainment', name: 'Entertainment', estimated: 4000, actual: 0, notes: 'AI estimate' },
    { id: 'invitations', name: 'Invitations', estimated: 1500, actual: 0, notes: 'AI estimate' },
    { id: 'transportation', name: 'Transportation', estimated: 2000, actual: 0, notes: 'AI estimate' },
    { id: 'miscellaneous', name: 'Miscellaneous', estimated: 4000, actual: 0, notes: 'AI estimate — contingency' },
  ];

  return {
    setup: {
      id: eventId,
      eventType: 'wedding',
      eventName: 'Sarah & James — Enchanted Garden Wedding',
      eventDate: eventDate.toISOString().split('T')[0],
      location: 'Riverside Garden Estate, Sample City',
      guestCount: 120,
      totalBudget: 50000,
      currency: 'USD',
      theme: 'Enchanted Garden',
      foodPreferences: 'Mixed — vegetarian options required',
      venuePreference: 'both',
      specialRequirements: 'Wheelchair-accessible pathways, rain backup plan',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    plan: demoPlan,
    budget: {
      categories: budgetCategories,
      totalBudget: 50000,
      currency: 'USD',
    },
    tasks: demoPlan.taskChecklist.map((task, i) => ({
      id: `demo-task-${i + 1}`,
      title: task.title,
      description: task.description,
      dueDate: new Date(eventDate.getTime() - task.daysBeforeEvent * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: task.priority,
      status: i < 2 ? 'completed' as const : 'pending' as const,
      category: task.category,
      eventId,
    })),
    vendors: [
      { id: 'demo-vendor-1', name: '', serviceCategory: 'Venue', bookingStatus: 'contacted' as const, contactNotes: 'Awaiting availability confirmation', estimatedCost: 15000, phone: '', email: '', eventId },
      { id: 'demo-vendor-2', name: '', serviceCategory: 'Catering', bookingStatus: 'quoted' as const, contactNotes: 'Tasting scheduled', estimatedCost: 12500, phone: '', email: '', eventId },
      { id: 'demo-vendor-3', name: '', serviceCategory: 'Photography', bookingStatus: 'contacted' as const, contactNotes: 'Reviewing portfolio', estimatedCost: 6000, phone: '', email: '', eventId },
    ],
    isDemo: true,
  };
}

export { generateId };
