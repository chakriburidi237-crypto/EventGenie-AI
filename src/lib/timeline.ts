import { TimelineTask, TaskPriority, TaskStatus } from './types';

export interface TimelineProgress {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  progressPercent: number;
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Calculates milestone completion statistics.
 */
export function calculateTimelineProgress(tasks: TimelineTask[]): TimelineProgress {
  const total = tasks.length;
  if (total === 0) {
    return { total: 0, completed: 0, inProgress: 0, pending: 0, progressPercent: 0 };
  }

  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const progressPercent = Math.round((completed / total) * 100);

  return { total, completed, inProgress, pending, progressPercent };
}

/**
 * Sorts tasks deterministically: High priority first, then medium, then low.
 * Within identical priorities, earlier due dates sort first.
 */
export function sortTasksByPriority(tasks: TimelineTask[]): TimelineTask[] {
  return [...tasks].sort((a, b) => {
    const pDiff = (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
    if (pDiff !== 0) return pDiff;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

/**
 * Identifies incomplete tasks whose due date has passed.
 */
export function getOverdueTasks(tasks: TimelineTask[], referenceDate: Date = new Date()): TimelineTask[] {
  const refTime = referenceDate.getTime();
  return tasks.filter(t => {
    if (t.status === 'completed') return false;
    const dueTime = new Date(t.dueDate).getTime();
    return !isNaN(dueTime) && dueTime < refTime;
  });
}

/**
 * Groups tasks by category into a dictionary.
 */
export function groupTasksByCategory(tasks: TimelineTask[]): Record<string, TimelineTask[]> {
  const groups: Record<string, TimelineTask[]> = {};
  tasks.forEach(task => {
    const cat = task.category?.trim() || 'General';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(task);
  });
  return groups;
}

/**
 * Computes deterministic day offset between a target date and a reference date.
 */
export function calculateDaysRemaining(targetDate: string, referenceDate: Date = new Date()): number {
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) return 0;
  const diffMs = target.getTime() - referenceDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Transitions task status following legal progression.
 */
export function getNextTaskStatus(current: TaskStatus): TaskStatus {
  switch (current) {
    case 'pending':
      return 'in-progress';
    case 'in-progress':
      return 'completed';
    case 'completed':
      return 'pending';
    default:
      return 'pending';
  }
}
