import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, TaskStatus } from '../types/task';
import * as db from '../db/database';

const ERROR_AUTO_CLEAR_MS = 5000;

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setErrorWithAutoClear = useCallback((message: string) => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
    setError(message);
    errorTimerRef.current = setTimeout(() => {
      setError(null);
      errorTimerRef.current = null;
    }, ERROR_AUTO_CLEAR_MS);
  }, []);

  const clearError = useCallback(() => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    setError(null);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      await db.syncDatabase();
      const loadedTasks = await db.getTasks();
      setTasks(loadedTasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      setErrorWithAutoClear(message);
    } finally {
      setLoading(false);
    }
  }, [clearError, setErrorWithAutoClear]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(async (title: string, status: TaskStatus = 'inbox') => {
    try {
      clearError();
      const newTask = await db.addTask(title, status);
      setTasks(prev => [newTask, ...prev]);
      db.syncDatabase().catch(() => {});
      return newTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add task';
      setErrorWithAutoClear(message);
      return undefined;
    }
  }, [clearError, setErrorWithAutoClear]);

  const updateStatus = useCallback(async (id: string, status: TaskStatus) => {
    // Optimistic update with rollback
    const previousTasks = tasks;
    const now = Math.floor(Date.now() / 1000);
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? {
              ...task,
              status,
              updatedAt: now,
              completedAt: status === 'done' ? new Date().toISOString() : undefined,
            }
          : task
      )
    );

    try {
      clearError();
      await db.updateTaskStatus(id, status);
      db.syncDatabase().catch(() => {});
    } catch (err) {
      // Rollback on failure
      setTasks(previousTasks);
      const message = err instanceof Error ? err.message : 'Failed to update task';
      setErrorWithAutoClear(message);
    }
  }, [tasks, clearError, setErrorWithAutoClear]);

  const removeTask = useCallback(async (id: string) => {
    // Optimistic update with rollback
    const previousTasks = tasks;
    setTasks(prev => prev.filter(task => task.id !== id));

    try {
      clearError();
      await db.deleteTask(id);
      db.syncDatabase().catch(() => {});
    } catch (err) {
      // Rollback on failure
      setTasks(previousTasks);
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      setErrorWithAutoClear(message);
    }
  }, [tasks, clearError, setErrorWithAutoClear]);

  const counts = useMemo(() =>
    tasks.reduce(
      (acc, task) => {
        acc[task.status]++;
        acc.all++;
        return acc;
      },
      { inbox: 0, next: 0, waiting: 0, someday: 0, done: 0, all: 0 } as Record<TaskStatus | 'all', number>
    ),
    [tasks]
  );

  return {
    tasks,
    loading,
    error,
    counts,
    addTask,
    updateStatus,
    removeTask,
    refresh: loadTasks,
    clearError,
  };
}
