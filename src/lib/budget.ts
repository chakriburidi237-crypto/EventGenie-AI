import { BudgetCategory, BudgetPlan } from './types';

/**
 * Calculate the total of all estimated amounts across budget categories.
 */
export function calculateTotalEstimated(categories: BudgetCategory[]): number {
  return categories.reduce((sum, cat) => sum + (cat.estimated || 0), 0);
}

/**
 * Calculate the total of all actual amounts across budget categories.
 */
export function calculateTotalActual(categories: BudgetCategory[]): number {
  return categories.reduce((sum, cat) => sum + (cat.actual || 0), 0);
}

/**
 * Calculate remaining budget based on estimated allocations.
 */
export function calculateRemainingBudget(totalBudget: number, categories: BudgetCategory[]): number {
  return totalBudget - calculateTotalEstimated(categories);
}

/**
 * Check if the budget is over the total allocation.
 */
export function isOverBudget(totalBudget: number, categories: BudgetCategory[]): boolean {
  return calculateTotalEstimated(categories) > totalBudget;
}

/**
 * Calculate what percentage of the total budget a specific amount represents.
 */
export function calculatePercentage(amount: number, totalBudget: number): number {
  if (totalBudget <= 0) return 0;
  return Math.round((amount / totalBudget) * 100 * 10) / 10;
}

/**
 * Get default budget categories for a new event.
 */
export function getDefaultBudgetCategories(): BudgetCategory[] {
  return [
    { id: 'venue', name: 'Venue', estimated: 0, actual: 0, notes: '' },
    { id: 'food', name: 'Food & Catering', estimated: 0, actual: 0, notes: '' },
    { id: 'decoration', name: 'Decoration', estimated: 0, actual: 0, notes: '' },
    { id: 'photography', name: 'Photography', estimated: 0, actual: 0, notes: '' },
    { id: 'entertainment', name: 'Entertainment', estimated: 0, actual: 0, notes: '' },
    { id: 'invitations', name: 'Invitations', estimated: 0, actual: 0, notes: '' },
    { id: 'transportation', name: 'Transportation', estimated: 0, actual: 0, notes: '' },
    { id: 'miscellaneous', name: 'Miscellaneous', estimated: 0, actual: 0, notes: '' },
  ];
}

/**
 * Apply AI-suggested budget allocations to categories.
 */
export function applyAIBudgetAllocations(
  totalBudget: number,
  allocations: { category: string; percentage: number; estimatedAmount: number }[]
): BudgetCategory[] {
  const defaultCategories = getDefaultBudgetCategories();

  return defaultCategories.map(cat => {
    const allocation = allocations.find(
      a => a.category.toLowerCase().includes(cat.name.toLowerCase()) ||
           cat.name.toLowerCase().includes(a.category.toLowerCase())
    );
    if (allocation) {
      return {
        ...cat,
        estimated: allocation.estimatedAmount || Math.round(totalBudget * (allocation.percentage / 100)),
        notes: `AI estimate: ~${allocation.percentage}% of budget`,
      };
    }
    return cat;
  });
}

/**
 * Create a BudgetPlan with default categories.
 */
export function createDefaultBudgetPlan(totalBudget: number, currency: string): BudgetPlan {
  return {
    categories: getDefaultBudgetCategories(),
    totalBudget,
    currency,
  };
}

/**
 * Format currency amount.
 */
export function formatCurrency(amount: number, currency: string): string {
  try {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency === 'INR' ? '₹' : currency} ${amount.toLocaleString()}`;
  }
}
