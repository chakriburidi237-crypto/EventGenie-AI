import { GoogleGenAI } from '@google/genai';
import { EventSetup, AIEventPlan, AIBudgetOptimization, AIThemeIdea } from './types';

function getClient(apiKeyOverride?: string): GoogleGenAI | null {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') return null;
  return new GoogleGenAI({ apiKey });
}

const MODEL = 'gemini-2.5-flash';

/**
 * Generate a structured event plan using Gemini (or smart sample fallback if AI key not configured).
 */
export async function generateEventPlan(setup: EventSetup, apiKeyOverride?: string): Promise<AIEventPlan> {
  const client = getClient(apiKeyOverride);

  if (client) {
    try {
      const prompt = `You are an expert event planner. Generate a detailed, structured event plan based on the following details:

Event Type: ${setup.eventType}
Event Name: ${setup.eventName}
Event Date: ${setup.eventDate}
Location: ${setup.location}
Guest Count: ${setup.guestCount}
Total Budget: ${setup.currency} ${setup.totalBudget.toLocaleString()}
Theme: ${setup.theme || 'No specific theme'}
Food Preferences: ${setup.foodPreferences || 'No specific preferences'}
Venue Preference: ${setup.venuePreference}
Special Requirements: ${setup.specialRequirements || 'None'}

IMPORTANT: All budget amounts are estimates only. Do not present them as actual vendor quotes or market prices.

Respond ONLY with valid JSON matching this exact schema (no markdown, no code fences):
{
  "eventConcept": "string — overall concept description",
  "themeDescription": "string — theme details",
  "decorationIdeas": ["string array — 5 ideas"],
  "foodSuggestions": ["string array — 5 suggestions"],
  "entertainmentIdeas": ["string array — 5 ideas"],
  "preparationTimeline": [{"timeframe": "string", "task": "string", "priority": "high|medium|low"}],
  "vendorChecklist": [{"category": "string", "description": "string", "estimatedBudgetPercent": number}],
  "taskChecklist": [{"title": "string", "description": "string", "category": "string", "priority": "high|medium|low", "daysBeforeEvent": number}],
  "budgetAllocation": [{"category": "string", "percentage": number, "estimatedAmount": number, "notes": "string — include 'AI estimate' disclaimer"}],
  "personalizedRecommendations": ["string array — 5 personalized tips"]
}

Budget allocations must sum to approximately 100% and estimatedAmount values must sum to approximately ${setup.totalBudget}.
Include categories: Venue, Food & Catering, Decoration, Photography, Entertainment, Invitations, Transportation, Miscellaneous.`;

      const response = await client.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text) as AIEventPlan;
        validateEventPlanStructure(parsed);
        parsed.source = 'gemini';
        parsed.isSample = false;
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini live call error, falling back to smart sample plan:', err);
    }
  }

  // Graceful offline fallback: Never block user, return clearly labelled sample plan
  return generateSamplePlan(setup);
}

/**
 * Generate budget optimization suggestions (Gemini or offline rule-based).
 */
export async function optimizeBudget(
  setup: EventSetup,
  currentBudget: { category: string; amount: number }[],
  priorities: string[],
  apiKeyOverride?: string
): Promise<AIBudgetOptimization> {
  const client = getClient(apiKeyOverride);
  const totalAllocated = currentBudget.reduce((s, c) => s + c.amount, 0);

  if (client) {
    try {
      const prompt = `You are a budget optimization expert for events. The user's event is over budget and needs practical adjustments.

Event Type: ${setup.eventType}
Total Budget: ${setup.currency} ${setup.totalBudget.toLocaleString()}
Currently Allocated: ${setup.currency} ${totalAllocated.toLocaleString()}
Over by: ${setup.currency} ${(totalAllocated - setup.totalBudget).toLocaleString()}

Current allocations:
${currentBudget.map(c => `- ${c.category}: ${setup.currency} ${c.amount.toLocaleString()}`).join('\n')}

User's top priorities to preserve: ${priorities.join(', ') || 'None specified'}

IMPORTANT: All amounts are estimates. Do not present savings as guaranteed.

Respond ONLY with valid JSON (no markdown):
{
  "summary": "string — brief optimization strategy",
  "adjustments": [{"category": "string", "originalAmount": number, "proposedAmount": number, "suggestion": "string"}],
  "totalSavings": number,
  "preservedPriorities": ["string array"]
}

Proposed amounts must sum to no more than ${setup.totalBudget}. Focus on realistic, practical adjustments.`;

      const response = await client.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.5,
        },
      });

      const text = response.text?.trim();
      if (text) {
        return JSON.parse(text) as AIBudgetOptimization;
      }
    } catch (err) {
      console.warn('Gemini budget optimization failed, falling back to rule-based optimizer:', err);
    }
  }

  return generateSampleOptimization(setup, currentBudget, priorities);
}

/**
 * Generate theme and idea suggestions.
 */
export async function exploreThemes(
  eventType: string,
  budget: number,
  currency: string,
  guestCount: number,
  preferences: string,
  apiKeyOverride?: string
): Promise<AIThemeIdea[]> {
  const client = getClient(apiKeyOverride);

  if (client) {
    try {
      const prompt = `You are a creative event planner. Suggest 4 unique, personalized theme ideas.

Event Type: ${eventType}
Budget: ${currency} ${budget.toLocaleString()}
Guest Count: ${guestCount}
Preferences: ${preferences || 'None specified'}

Respond ONLY with valid JSON array (no markdown):
[{
  "title": "string — theme name",
  "description": "string — 2-3 sentence description",
  "estimatedBudgetRange": "string — e.g. '$5,000 - $8,000 (estimated)'",
  "keyElements": ["string array — 4 key visual/experiential elements"],
  "suitableFor": ["string array — event types this works for"]
}]

Include 'estimated' in budget ranges. These are suggestions, not quotes.`;

      const response = await client.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      });

      const text = response.text?.trim();
      if (text) {
        return JSON.parse(text) as AIThemeIdea[];
      }
    } catch (err) {
      console.warn('Gemini theme exploration failed, using curated ideas:', err);
    }
  }

  return generateSampleThemes(eventType, budget, currency, guestCount, preferences);
}

/**
 * Validate the structure of an AI-generated event plan.
 */
function validateEventPlanStructure(plan: AIEventPlan): void {
  if (!plan.eventConcept || typeof plan.eventConcept !== 'string') {
    throw new Error('Invalid plan: missing eventConcept');
  }
  if (!Array.isArray(plan.decorationIdeas)) {
    throw new Error('Invalid plan: decorationIdeas must be an array');
  }
  if (!Array.isArray(plan.foodSuggestions)) {
    throw new Error('Invalid plan: foodSuggestions must be an array');
  }
  if (!Array.isArray(plan.budgetAllocation)) {
    throw new Error('Invalid plan: budgetAllocation must be an array');
  }
}

// ─── OFFLINE SAMPLE GENERATORS (Clearly labelled as Sample / Demo) ───

function generateSamplePlan(setup: EventSetup): AIEventPlan {
  const B = setup.totalBudget;
  const isOutdoor = setup.venuePreference === 'outdoor' || setup.venuePreference === 'both';
  const type = setup.eventType;

  const conceptMap: Record<string, { concept: string; theme: string }> = {
    wedding: {
      concept: `An elegant ${setup.theme || 'timeless romantic'} wedding celebration in ${setup.location} crafted for ${setup.guestCount} guests, prioritizing meaningful shared moments and natural beauty.`,
      theme: setup.theme || 'Modern Botanical & Warm Candlelight with Ivory Accents',
    },
    birthday: {
      concept: `A vibrant and engaging celebration celebrating ${setup.eventName} at ${setup.location} designed for ${setup.guestCount} guests with interactive entertainment and personalized culinary stations.`,
      theme: setup.theme || 'Festive Sunset Social with Warm Ambient Lighting',
    },
    community: {
      concept: `An inclusive, high-energy community gathering at ${setup.location} bringing together ${setup.guestCount} attendees with diverse local programming and shared tables.`,
      theme: setup.theme || 'Neighborhood Arts & Harvest Festival',
    },
    corporate: {
      concept: `A refined corporate milestone and networking event at ${setup.location} accommodating ${setup.guestCount} participants with seamless presentation staging and cocktail reception.`,
      theme: setup.theme || 'Contemporary Sleek Minimalist & Executive Lounge',
    },
    other: {
      concept: `A tailored ${setup.theme || 'celebration'} at ${setup.location} thoughtfully curated for ${setup.guestCount} guests with memorable hospitality.`,
      theme: setup.theme || 'Custom Signature Celebration',
    },
  };

  const selectedConcept = conceptMap[type] || conceptMap.other;

  return {
    eventConcept: selectedConcept.concept,
    themeDescription: selectedConcept.theme,
    decorationIdeas: [
      isOutdoor ? 'Weather-resistant ambient string canopy with warm LED lanterns' : 'Architectural uplighting highlighting key room focal points',
      'Locally sourced seasonal floral centerpieces with natural greenery',
      'Custom entrance welcome signage with personalized lettering',
      'Interactive guestbook photo corner with themed backdrop props',
      'Curated table place settings with sustainable linen runners',
    ],
    foodSuggestions: [
      setup.foodPreferences ? `Customized menu highlighting: ${setup.foodPreferences}` : 'Chef-curated seasonal buffet with farm-to-table entrees',
      'Artisanal grazing tables with cheeses, crackers, fruits, and dips during arrivals',
      'Plated or station-served warm entrees with vegetarian/vegan inclusive options',
      'Signature cocktail & mocktail bar tailored to the event aesthetic',
      'Bespoke dessert bar featuring mini pastries and celebration cake',
    ],
    entertainmentIdeas: [
      'Live acoustic or jazz ensemble for welcome arrivals and cocktail hour',
      'Curated musical playlist and professional sound system for key milestones',
      'Interactive photo booth with instant digital and printed guest takeaways',
      isOutdoor ? 'Outdoor lawn games (cornhole, giant jenga, boules)' : 'Engaging trivia or milestone storytelling segment',
      'Celebratory send-off or finale moment with sparklers or ambient illumination',
    ],
    preparationTimeline: [
      { timeframe: '3 months before', task: 'Finalize venue contract and lock event date', priority: 'high' },
      { timeframe: '2 months before', task: 'Select caterer and complete menu tasting', priority: 'high' },
      { timeframe: '6 weeks before', task: 'Send formal invitations with RSVP deadline', priority: 'high' },
      { timeframe: '1 month before', task: 'Book photographer and music/entertainment', priority: 'medium' },
      { timeframe: '2 weeks before', task: 'Confirm final headcount and dietary requirements', priority: 'high' },
      { timeframe: '1 week before', task: 'Conduct final site walkthrough and vendor logistics review', priority: 'medium' },
      { timeframe: 'Day before', task: 'Setup decorations, test audio/visual, and run rehearsal', priority: 'high' },
    ],
    vendorChecklist: [
      { category: 'Venue', description: 'Main event space with seating and utilities', estimatedBudgetPercent: 30 },
      { category: 'Catering', description: 'Full food service and beverages for headcount', estimatedBudgetPercent: 28 },
      { category: 'Photography', description: 'Event photographer capturing highlights', estimatedBudgetPercent: 12 },
      { category: 'Decoration', description: 'Florals, signage, centerpieces, and lighting', estimatedBudgetPercent: 10 },
      { category: 'Entertainment', description: 'Musicians, DJ, or AV sound equipment', estimatedBudgetPercent: 8 },
      { category: 'Invitations', description: 'Digital or printed invitation suite', estimatedBudgetPercent: 3 },
      { category: 'Transportation', description: 'Guest parking coordination or shuttle', estimatedBudgetPercent: 3 },
      { category: 'Miscellaneous', description: 'Contingency buffer for day-of additions', estimatedBudgetPercent: 6 },
    ],
    taskChecklist: [
      { title: 'Confirm venue booking and deposit', description: 'Review contract terms, capacity, and insurance requirements', category: 'Venue', priority: 'high', daysBeforeEvent: 90 },
      { title: 'Finalize catering contract', description: 'Select dietary options and confirm bar service', category: 'Food & Catering', priority: 'high', daysBeforeEvent: 60 },
      { title: 'Order invitations and dispatch', description: 'Send digital or physical invites with RSVP deadline', category: 'Invitations', priority: 'medium', daysBeforeEvent: 45 },
      { title: 'Book photographer and AV tech', description: 'Confirm hours of coverage and shot list requirements', category: 'Photography', priority: 'high', daysBeforeEvent: 40 },
      { title: 'Confirm final guest RSVP list', description: 'Provide final numbers to caterer and create seating plan', category: 'Planning', priority: 'high', daysBeforeEvent: 14 },
      { title: 'Final vendor walkthrough', description: 'Review load-in schedule and power requirements with venue', category: 'Coordination', priority: 'medium', daysBeforeEvent: 7 },
    ],
    budgetAllocation: [
      { category: 'Venue', percentage: 30, estimatedAmount: Math.round(B * 0.30), notes: 'Sample estimate (30%) — verify with local venue quotes' },
      { category: 'Food & Catering', percentage: 28, estimatedAmount: Math.round(B * 0.28), notes: 'Sample estimate (28%) — scaled for guest count' },
      { category: 'Photography', percentage: 12, estimatedAmount: Math.round(B * 0.12), notes: 'Sample estimate (12%) — coverage and edited gallery' },
      { category: 'Decoration', percentage: 10, estimatedAmount: Math.round(B * 0.10), notes: 'Sample estimate (10%) — florals and ambient lighting' },
      { category: 'Entertainment', percentage: 8, estimatedAmount: Math.round(B * 0.08), notes: 'Sample estimate (8%) — audio and performers' },
      { category: 'Invitations', percentage: 3, estimatedAmount: Math.round(B * 0.03), notes: 'Sample estimate (3%) — design and stationery' },
      { category: 'Transportation', percentage: 3, estimatedAmount: Math.round(B * 0.03), notes: 'Sample estimate (3%) — guest logistics' },
      { category: 'Miscellaneous', percentage: 6, estimatedAmount: Math.round(B * 0.06), notes: 'Sample estimate (6%) — recommended contingency buffer' },
    ],
    personalizedRecommendations: [
      `For ${setup.guestCount} guests, ensure the venue has adequate seating and clear circulation paths.`,
      isOutdoor ? 'Always secure a rain backup option or tent coverage with 48-hour cancellation policy.' : 'Check room acoustics and lighting dimmer controls before the reception begins.',
      'Digital RSVPs and QR code menus can save significant printing costs and expedite headcounts.',
      'Negotiate bundled vendor packages (e.g., photo + video or venue + tables) for savings.',
      'Configure GEMINI_API_KEY to unlock real-time generative AI fine-tuning for your event!',
    ],
    isSample: true,
    source: 'sample',
  };
}

function generateSampleOptimization(
  setup: EventSetup,
  currentBudget: { category: string; amount: number }[],
  priorities: string[]
): AIBudgetOptimization {
  const adjustments = currentBudget.map(item => {
    const isPriority = priorities.some(p => item.category.toLowerCase().includes(p.toLowerCase()));
    let cutPercent = 0;

    if (item.category.includes('Miscellaneous')) cutPercent = 0.35;
    else if (item.category.includes('Invitations')) cutPercent = 0.40;
    else if (item.category.includes('Transportation')) cutPercent = 0.25;
    else if (item.category.includes('Decoration') && !isPriority) cutPercent = 0.20;
    else if (item.category.includes('Entertainment') && !isPriority) cutPercent = 0.15;
    else if (!isPriority) cutPercent = 0.10;

    const proposed = Math.max(0, Math.round(item.amount * (1 - cutPercent)));

    return {
      category: item.category,
      originalAmount: item.amount,
      proposedAmount: proposed,
      suggestion: cutPercent > 0
        ? `Adjusted by ${Math.round(cutPercent * 100)}% through streamlined options while preserving core priorities.`
        : 'Preserved as essential priority.',
    };
  });

  const totalSavings = adjustments.reduce((s, a) => s + (a.originalAmount - a.proposedAmount), 0);

  return {
    summary: `Sample Optimization Strategy: Reallocated discretionary expenses across decorations, invitations, and contingency buffers to bring total expenses within your target budget of ${setup.currency} ${setup.totalBudget.toLocaleString()}.`,
    adjustments,
    totalSavings,
    preservedPriorities: priorities.length > 0 ? priorities : ['Venue', 'Catering'],
  };
}

function generateSampleThemes(
  eventType: string,
  budget: number,
  currency: string,
  guestCount: number,
  preferences?: string
): AIThemeIdea[] {
  const customNote = preferences && preferences.trim() ? ` featuring ${preferences.trim()}` : '';
  return [
    {
      title: `${eventType === 'wedding' ? 'Enchanted Garden Glasshouse' : 'Botanical Twilight Oasis'}`,
      description: `An organic aesthetic combining lush foliage, warm hanging lanterns, and wooden accents${customNote}, thoughtfully tailored for ${guestCount} attendees.`,
      estimatedBudgetRange: `${currency} ${Math.round(budget * 0.85).toLocaleString()} – ${currency} ${Math.round(budget).toLocaleString()} (estimated)`,
      keyElements: ['Terrarium & eucalyptus centerpieces', 'Fairy light canopy', 'Locally sourced farm-to-table cuisine', 'Acoustic live duo'],
      suitableFor: [eventType, 'Celebration', 'Evening Gathering'],
    },
    {
      title: 'Celestial Midnight Elegance',
      description: 'Sophisticated deep navy and champagne gold accents with geometric metallic structures and ambient starlight projection.',
      estimatedBudgetRange: `${currency} ${Math.round(budget * 0.90).toLocaleString()} – ${currency} ${Math.round(budget * 1.05).toLocaleString()} (estimated)`,
      keyElements: ['Deep blue velvet drapery', 'Starlight projection mapping', 'Champagne welcome tower', 'Live jazz ensemble'],
      suitableFor: [eventType, 'Gala', 'Milestone Anniversary'],
    },
    {
      title: 'Bohemian Sunset Social',
      description: 'Warm earth tones, rattan lounge seating, textured macrame, and dried wildflower installations under golden-hour lighting.',
      estimatedBudgetRange: `${currency} ${Math.round(budget * 0.75).toLocaleString()} – ${currency} ${Math.round(budget * 0.90).toLocaleString()} (estimated)`,
      keyElements: ['Pampas grass floral arches', 'Rattan & vintage rug lounge', 'Gourmet artisanal grazing tables', 'Polaroid guestbook nook'],
      suitableFor: [eventType, 'Intimate Gathering', 'Outdoor Celebration'],
    },
    {
      title: 'Modern Minimalist Luminary',
      description: 'Clean architectural lines, monochromatic floral sculptures, and high-impact custom neon or LED signature signage.',
      estimatedBudgetRange: `${currency} ${Math.round(budget * 0.80).toLocaleString()} – ${currency} ${Math.round(budget * 0.95).toLocaleString()} (estimated)`,
      keyElements: ['Monochrome calla lily arrangements', 'Custom acrylic signage', 'Interactive craft mocktail station', 'Ambient DJ soundscape'],
      suitableFor: [eventType, 'Contemporary Event', 'Urban Rooftop'],
    },
  ];
}
