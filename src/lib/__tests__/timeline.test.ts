import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateTimelineProgress,
  sortTasksByPriority,
  getOverdueTasks,
  groupTasksByCategory,
  calculateDaysRemaining,
  getNextTaskStatus,
} from '../timeline';
import { TimelineTask } from '../types';

describe('Event Timeline & Milestone Management', () => {
  const sampleTasks: TimelineTask[] = [
    {
      id: 't-1',
      title: 'Book Venue',
      description: 'Sign contract and pay deposit',
      dueDate: '2026-11-01',
      priority: 'high',
      status: 'completed',
      category: 'Venue',
      eventId: 'evt-1',
    },
    {
      id: 't-2',
      title: 'Order Catering',
      description: 'Confirm menu tastings',
      dueDate: '2026-11-10',
      priority: 'high',
      status: 'in-progress',
      category: 'Food',
      eventId: 'evt-1',
    },
    {
      id: 't-3',
      title: 'Design Invitations',
      description: 'Prepare digital assets',
      dueDate: '2026-10-20',
      priority: 'medium',
      status: 'pending',
      category: 'Invitations',
      eventId: 'evt-1',
    },
    {
      id: 't-4',
      title: 'Arrange Guest Favors',
      description: 'Order bespoke gift boxes',
      dueDate: '2026-11-25',
      priority: 'low',
      status: 'pending',
      category: 'Decor',
      eventId: 'evt-1',
    },
  ];

  it('calculates task completion progress accurately', () => {
    const progress = calculateTimelineProgress(sampleTasks);
    assert.strictEqual(progress.total, 4);
    assert.strictEqual(progress.completed, 1);
    assert.strictEqual(progress.inProgress, 1);
    assert.strictEqual(progress.pending, 2);
    assert.strictEqual(progress.progressPercent, 25); // 1 / 4 = 25%
  });

  it('handles empty task list gracefully in progress calculation', () => {
    const progress = calculateTimelineProgress([]);
    assert.strictEqual(progress.total, 0);
    assert.strictEqual(progress.progressPercent, 0);
  });

  it('sorts tasks deterministically by priority tier (high > medium > low)', () => {
    const sorted = sortTasksByPriority(sampleTasks);
    assert.strictEqual(sorted[0].priority, 'high');
    assert.strictEqual(sorted[1].priority, 'high');
    assert.strictEqual(sorted[2].priority, 'medium');
    assert.strictEqual(sorted[3].priority, 'low');
  });

  it('identifies overdue tasks accurately relative to reference date', () => {
    // Reference date: 2026-10-25
    // t-3 due date is 2026-10-20 and status is pending -> OVERDUE
    // t-1 due date is 2026-11-01 and status is completed -> NOT overdue
    const ref = new Date('2026-10-25T12:00:00Z');
    const overdue = getOverdueTasks(sampleTasks, ref);
    assert.strictEqual(overdue.length, 1);
    assert.strictEqual(overdue[0].id, 't-3');
  });

  it('groups tasks properly by category', () => {
    const groups = groupTasksByCategory(sampleTasks);
    assert.strictEqual(groups['Venue'].length, 1);
    assert.strictEqual(groups['Food'].length, 1);
    assert.strictEqual(groups['Invitations'].length, 1);
    assert.strictEqual(groups['Decor'].length, 1);
  });

  it('computes days remaining between dates deterministically', () => {
    const ref = new Date('2026-10-20T00:00:00Z');
    const days = calculateDaysRemaining('2026-10-25', ref);
    assert.strictEqual(days, 5);
  });

  it('cycles task status in order (pending -> in-progress -> completed -> pending)', () => {
    assert.strictEqual(getNextTaskStatus('pending'), 'in-progress');
    assert.strictEqual(getNextTaskStatus('in-progress'), 'completed');
    assert.strictEqual(getNextTaskStatus('completed'), 'pending');
  });
});
