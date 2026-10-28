import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateEventPlan, optimizeBudget, exploreThemes } from '../ai-client';
import { EventSetup } from '../types';

describe('AI Resilience & Offline Fallback Reliability', () => {
  const sampleSetup: EventSetup = {
    id: 'test-evt-99',
    eventType: 'wedding',
    eventName: 'Royal Heritage Celebration',
    eventDate: '2026-12-15',
    location: 'Palace Grounds, Jaipur',
    guestCount: 250,
    totalBudget: 1500000,
    currency: 'INR',
    theme: 'Royal Rajasthani Heritage',
    foodPreferences: 'Traditional North Indian, Jain & Vegan options',
    venuePreference: 'outdoor',
    specialRequirements: 'Grand fireworks and live folk troupe',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('gracefully falls back to structured plan when AI key is missing/offline', async () => {
    // Explicitly pass empty API key to trigger fallback
    const plan = await generateEventPlan(sampleSetup, '');

    assert.ok(plan);
    assert.strictEqual(plan.isSample, true);
    assert.strictEqual(plan.source, 'sample');
    assert.ok(plan.eventConcept.length > 0);
    assert.ok(plan.decorationIdeas.length >= 4);
    assert.ok(plan.foodSuggestions.length >= 4);
    assert.ok(plan.entertainmentIdeas.length >= 4);
    assert.ok(plan.preparationTimeline.length >= 5);
    assert.ok(plan.vendorChecklist.length >= 5);
    assert.ok(plan.budgetAllocation.length >= 6);
  });

  it('guarantees budget allocation percentages approximate 100% in fallback plan', async () => {
    const plan = await generateEventPlan(sampleSetup, '');
    const totalPercentage = plan.budgetAllocation.reduce((sum, item) => sum + item.percentage, 0);

    // Sum should be 100%
    assert.strictEqual(totalPercentage, 100);

    // Check estimated amounts scale to total budget
    const totalEstimated = plan.budgetAllocation.reduce((sum, item) => sum + item.estimatedAmount, 0);
    const diff = Math.abs(totalEstimated - sampleSetup.totalBudget);
    // Allow slight rounding tolerance (within 1%)
    assert.ok(diff / sampleSetup.totalBudget < 0.01);
  });

  it('preserves user priorities during budget optimization fallback', async () => {
    const currentAllocations = [
      { category: 'Venue', amount: 600000 },
      { category: 'Food & Catering', amount: 500000 },
      { category: 'Decoration', amount: 250000 },
      { category: 'Miscellaneous', amount: 250000 }, // Total = 1,600,000 (Over by 100,000)
    ];

    const optimization = await optimizeBudget(sampleSetup, currentAllocations, ['Venue', 'Food'], '');

    assert.ok(optimization);
    assert.ok(optimization.totalSavings > 0);
    assert.ok(optimization.summary.length > 0);
    assert.ok(optimization.preservedPriorities.includes('Venue'));

    // Check that miscellaneous is trimmed more than priorities
    const miscAdj = optimization.adjustments.find(a => a.category.includes('Miscellaneous'));
    const venueAdj = optimization.adjustments.find(a => a.category.includes('Venue'));
    assert.ok(miscAdj && miscAdj.proposedAmount < miscAdj.originalAmount);
    assert.ok(venueAdj && venueAdj.proposedAmount === venueAdj.originalAmount);
  });

  it('generates rich, curated theme suggestions offline with realistic budget spans', async () => {
    const themes = await exploreThemes('wedding', 1500000, 'INR', 250, 'Royal heritage aesthetic', '');

    assert.ok(Array.isArray(themes));
    assert.strictEqual(themes.length, 4);

    themes.forEach(theme => {
      assert.ok(theme.title.length > 0);
      assert.ok(theme.description.length > 0);
      assert.ok(theme.keyElements.length >= 3);
      assert.ok(theme.estimatedBudgetRange.includes('INR'));
    });
  });
});
