'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListChecks, Plus, Trash2, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { FullEvent, TaskPriority, TaskStatus } from '@/lib/types';
import { getAllEvents, addTask, updateTask, deleteTask, initializeStore } from '@/lib/store';

export default function TimelinePage() {
  const [events, setEvents] = useState<FullEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as TaskPriority,
    category: 'Planning',
  });

  useEffect(() => {
    initializeStore();
    const all = getAllEvents();
    setEvents(all);
    if (all.length > 0) setSelectedEventId(all[0].setup.id);
    setLoaded(true);
  }, []);

  function refresh() {
    setEvents(getAllEvents());
  }

  const selectedEvent = events.find(e => e.setup.id === selectedEventId) || events[0];

  function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent || !newTask.title.trim()) return;
    addTask(selectedEvent.setup.id, {
      title: newTask.title,
      description: newTask.description,
      dueDate: newTask.dueDate || selectedEvent.setup.eventDate,
      priority: newTask.priority,
      status: 'pending',
      category: newTask.category,
    });
    setShowModal(false);
    setNewTask({ title: '', description: '', dueDate: '', priority: 'medium', category: 'Planning' });
    refresh();
  }

  if (!loaded) {
    return <div className="space-y-4"><div className="skeleton h-10 w-48" /><div className="skeleton h-64 rounded-2xl" /></div>;
  }

  if (!selectedEvent) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <ListChecks size={48} className="text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">No Events Found</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">Create an event to start managing preparation timelines and tasks.</p>
        <Link href="/create" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          Create Event
        </Link>
      </div>
    );
  }

  const tasks = selectedEvent.tasks || [];
  const completed = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Timeline & Task Manager</h1>
          <p className="text-slate-500 mt-1">Stay organized with categorized milestones and deadlines.</p>
        </div>

        <div className="flex items-center gap-3">
          {events.length > 1 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500"
            >
              {events.map(ev => (
                <option key={ev.setup.id} value={ev.setup.id}>{ev.setup.eventName}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow transition"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* Progress banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</span>
          <h3 className="text-lg font-bold text-slate-900">
            {completed} of {tasks.length} tasks completed ({tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}%)
          </h3>
        </div>

        <div className="w-full sm:w-64 h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
            style={{ width: `${tasks.length > 0 ? (completed / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <ListChecks size={40} className="text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800">No Tasks Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Click "Add Task" or generate an AI plan for this event.</p>
          <Link
            href={`/events/${selectedEvent.setup.id}`}
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center justify-center gap-1"
          >
            Go to event details <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
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
                      updateTask(selectedEvent.setup.id, task.id, {
                        status: e.target.checked ? 'completed' : 'pending',
                      });
                      refresh();
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
                        <span className="text-red-500 font-bold ml-1">(Past Due)</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <select
                    value={task.status}
                    onChange={(e) => {
                      updateTask(selectedEvent.setup.id, task.id, { status: e.target.value as TaskStatus });
                      refresh();
                    }}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={() => {
                      deleteTask(selectedEvent.setup.id, task.id);
                      refresh();
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

      {/* Task Modal */}
      {showModal && (
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
                  placeholder="e.g. Confirm DJ audio rider"
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
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
                  onClick={() => setShowModal(false)}
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
    </div>
  );
}
