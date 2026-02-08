import { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, TaskStatus } from '../types/task';
import * as db from '../db/database';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedTasks = await db.getTasks();
      setTasks(loadedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(async (title: string, status: TaskStatus = 'inbox') => {
    try {
      const newTask = await db.addTask(title, status);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
      throw err;
    }
  }, []);

  const updateStatus = useCallback(async (id: number, status: TaskStatus) => {
    try {
      await db.updateTaskStatus(id, status);
      setTasks(prev =>
        prev.map(task =>
          task.id === id
            ? {
                ...task,
                status,
                updatedAt: new Date().toISOString(),
                completedAt: status === 'done' ? new Date().toISOString() : undefined,
              }
            : task
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  }, []);

  const removeTask = useCallback(async (id: number) => {
    try {
      await db.deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    }
  }, []);

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
  };
}
