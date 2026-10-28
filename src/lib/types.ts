// ─── Core Types for EventGenie AI ───

export type EventType = 'wedding' | 'birthday' | 'community' | 'corporate' | 'other';
export type VenuePreference = 'indoor' | 'outdoor' | 'both';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type BookingStatus = 'contacted' | 'quoted' | 'booked' | 'confirmed' | 'cancelled';

export interface EventSetup {
  id: string;
  eventType: EventType;
  eventName: string;
  eventDate: string; // ISO date string
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  theme: string;
  foodPreferences: string;
  venuePreference: VenuePreference;
  specialRequirements: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  estimated: number;
  actual: number;
  notes: string;
}

export interface BudgetPlan {
  categories: BudgetCategory[];
  totalBudget: number;
  currency: string;
}

export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  eventId: string;
}

export interface Vendor {
  id: string;
  name: string;
  serviceCategory: string;
  bookingStatus: BookingStatus;
  contactNotes: string;
  estimatedCost: number;
  phone: string;
  email: string;
  eventId: string;
}

// ─── AI Response Types ───

export interface AIEventPlan {
  eventConcept: string;
  themeDescription: string;
  decorationIdeas: string[];
  foodSuggestions: string[];
  entertainmentIdeas: string[];
  preparationTimeline: AITimelineItem[];
  vendorChecklist: AIVendorItem[];
  taskChecklist: AITaskItem[];
  budgetAllocation: AIBudgetItem[];
  personalizedRecommendations: string[];
  isSample?: boolean;
  source?: 'gemini' | 'sample';
}

export interface AITimelineItem {
  timeframe: string;
  task: string;
  priority: TaskPriority;
}

export interface AIVendorItem {
  category: string;
  description: string;
  estimatedBudgetPercent: number;
}

export interface AITaskItem {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  daysBeforeEvent: number;
}

export interface AIBudgetItem {
  category: string;
  percentage: number;
  estimatedAmount: number;
  notes: string;
}

export interface AIBudgetOptimization {
  summary: string;
  adjustments: AIBudgetAdjustment[];
  totalSavings: number;
  preservedPriorities: string[];
}

export interface AIBudgetAdjustment {
  category: string;
  originalAmount: number;
  proposedAmount: number;
  suggestion: string;
}

export interface AIThemeIdea {
  title: string;
  description: string;
  estimatedBudgetRange: string;
  keyElements: string[];
  suitableFor: string[];
}

export type RSVPStatus = 'invited' | 'confirmed' | 'declined' | 'attending';

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  rsvpStatus: RSVPStatus;
  dietaryRestrictions: string;
  plusOnes: number;
  tableNumber?: string;
  notes: string;
  eventId: string;
}

// ─── Full Event with all data ───

export interface FullEvent {
  setup: EventSetup;
  plan: AIEventPlan | null;
  budget: BudgetPlan;
  tasks: TimelineTask[];
  vendors: Vendor[];
  guests?: Guest[];
  isDemo: boolean;
}

// ─── Validation ───

export interface ValidationError {
  field: string;
  message: string;
}

// ─── API ───

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isDemo?: boolean;
}
