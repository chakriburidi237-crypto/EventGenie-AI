import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateTotalEstimated,
  calculateTotalActual,
  calculateRemainingBudget,
  isOverBudget,
  calculatePercentage,
  applyAIBudgetAllocations,
  getDefaultBudgetCategories,
  formatCurrency,
} from '../budget';
import { BudgetCategory } from '../types';

describe('Smart Budget Planner Calculations', () => {
  const sampleCategories: BudgetCategory[] = [
    { id: '1', name: 'Venue', estimated: 5000, actual: 4800, notes: '' },
    { id: '2', name: 'Food & Catering', estimated: 3000, actual: 3200, notes: '' },
    { id: '3', name: 'Photography', estimated: 1500, actual: 1500, notes: '' },
    { id: '4', name: 'Decoration', estimated: 1000, actual: 950, notes: '' },
  ];

  it('calculates total estimated expenses correctly', () => {
    const total = calculateTotalEstimated(sampleCategories);
    assert.strictEqual(total, 10500);
  });

  it('calculates total actual expenses correctly', () => {
    const total = calculateTotalActual(sampleCategories);
    assert.strictEqual(total, 10450);
  });

  it('calculates remaining budget accurately when under budget', () => {
    const remaining = calculateRemainingBudget(12000, sampleCategories);
    assert.strictEqual(remaining, 1500);
  });

  it('calculates negative remaining budget when over budget', () => {
    const remaining = calculateRemainingBudget(10000, sampleCategories);
    assert.strictEqual(remaining, -500);
  });

  it('detects over-budget status accurately', () => {
    assert.strictEqual(isOverBudget(10000, sampleCategories), true);
    assert.strictEqual(isOverBudget(10500, sampleCategories), false);
    assert.strictEqual(isOverBudget(15000, sampleCategories), false);
  });

  it('calculates category percentage of total budget', () => {
    assert.strictEqual(calculatePercentage(5000, 20000), 25);
    assert.strictEqual(calculatePercentage(3333, 10000), 33.3);
    assert.strictEqual(calculatePercentage(100, 0), 0);
  });

  it('returns standard default budget categories', () => {
    const defaults = getDefaultBudgetCategories();
    assert.strictEqual(defaults.length, 8);
    const names = defaults.map(c => c.name);
    assert.ok(names.includes('Venue'));
    assert.ok(names.includes('Food & Catering'));
    assert.ok(names.includes('Decoration'));
    assert.ok(names.includes('Photography'));
  });

  it('correctly maps AI suggested allocations to categories', () => {
    const aiAllocations = [
      { category: 'Venue', percentage: 40, estimatedAmount: 8000 },
      { category: 'Food & Catering', percentage: 30, estimatedAmount: 6000 },
    ];
    const mapped = applyAIBudgetAllocations(20000, aiAllocations);
    const venue = mapped.find(c => c.name === 'Venue');
    const food = mapped.find(c => c.name === 'Food & Catering');
    assert.strictEqual(venue?.estimated, 8000);
    assert.strictEqual(food?.estimated, 6000);
  });

  it('formats currency cleanly', () => {
    const usd = formatCurrency(15000, 'USD');
    assert.ok(usd.includes('15,000'));
    const inr = formatCurrency(50000, 'INR');
    assert.ok(inr.includes('50,000') || inr.includes('50000'));
  });
});
