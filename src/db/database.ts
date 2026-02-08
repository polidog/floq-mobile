import { Platform } from 'react-native';
import { Task, TaskStatus } from '../types/task';

// Web用のインメモリストレージ
let memoryTasks: Task[] = [];
let nextId = 1;

// Native用のSQLiteインポート
let SQLite: typeof import('expo-sqlite') | null = null;
let db: import('expo-sqlite').SQLiteDatabase | null = null;

async function initNativeDatabase(): Promise<void> {
  if (Platform.OS === 'web') return;

  SQLite = await import('expo-sqlite');
  db = await SQLite.openDatabaseAsync('floq.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'inbox',
      project TEXT,
      context TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contexts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project);
    CREATE INDEX IF NOT EXISTS idx_tasks_context ON tasks(context);
  `);
}

let initialized = false;
async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  await initNativeDatabase();
  initialized = true;
}

export async function getTasks(status?: TaskStatus): Promise<Task[]> {
  await ensureInitialized();

  if (Platform.OS === 'web') {
    if (status) {
      return memoryTasks.filter(t => t.status === status);
    }
    return [...memoryTasks].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  if (!db) throw new Error('Database not initialized');

  let query = 'SELECT * FROM tasks';
  const params: string[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const rows = await db.getAllAsync<{
    id: number;
    title: string;
    status: string;
    project: string | null;
    context: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
  }>(query, params);

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    status: row.status as TaskStatus,
    project: row.project ?? undefined,
    context: row.context ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
  }));
}

export async function addTask(title: string, status: TaskStatus = 'inbox'): Promise<Task> {
  await ensureInitialized();

  const now = new Date().toISOString();

  if (Platform.OS === 'web') {
    const newTask: Task = {
      id: nextId++,
      title,
      status,
      createdAt: now,
      updatedAt: now,
    };
    memoryTasks.unshift(newTask);
    return newTask;
  }

  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO tasks (title, status) VALUES (?, ?)',
    [title, status]
  );

  const tasks = await db.getAllAsync<{
    id: number;
    title: string;
    status: string;
    project: string | null;
    context: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
  }>('SELECT * FROM tasks WHERE id = ?', [result.lastInsertRowId]);

  const row = tasks[0];
  return {
    id: row.id,
    title: row.title,
    status: row.status as TaskStatus,
    project: row.project ?? undefined,
    context: row.context ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
  };
}

export async function updateTaskStatus(id: number, status: TaskStatus): Promise<void> {
  await ensureInitialized();

  const now = new Date().toISOString();

  if (Platform.OS === 'web') {
    const task = memoryTasks.find(t => t.id === id);
    if (task) {
      task.status = status;
      task.updatedAt = now;
      task.completedAt = status === 'done' ? now : undefined;
    }
    return;
  }

  if (!db) throw new Error('Database not initialized');

  const completedAt = status === 'done' ? "datetime('now')" : 'NULL';

  await db.runAsync(
    `UPDATE tasks SET status = ?, updated_at = datetime('now'), completed_at = ${completedAt} WHERE id = ?`,
    [status, id]
  );
}

export async function updateTask(
  id: number,
  updates: Partial<Pick<Task, 'title' | 'project' | 'context' | 'notes'>>
): Promise<void> {
  await ensureInitialized();

  if (Platform.OS === 'web') {
    const task = memoryTasks.find(t => t.id === id);
    if (task) {
      if (updates.title !== undefined) task.title = updates.title;
      if (updates.project !== undefined) task.project = updates.project;
      if (updates.context !== undefined) task.context = updates.context;
      if (updates.notes !== undefined) task.notes = updates.notes;
      task.updatedAt = new Date().toISOString();
    }
    return;
  }

  if (!db) throw new Error('Database not initialized');

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.project !== undefined) {
    fields.push('project = ?');
    values.push(updates.project ?? null);
  }
  if (updates.context !== undefined) {
    fields.push('context = ?');
    values.push(updates.context ?? null);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes ?? null);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id.toString());

  await db.runAsync(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteTask(id: number): Promise<void> {
  await ensureInitialized();

  if (Platform.OS === 'web') {
    memoryTasks = memoryTasks.filter(t => t.id !== id);
    return;
  }

  if (!db) throw new Error('Database not initialized');
  await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
}
