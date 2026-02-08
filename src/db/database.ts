import { Platform } from 'react-native';
import { Task, TaskStatus } from '../types/task';
import { getTursoConfig } from './settings';

function generateUUID(): string {
  // Simple UUID v4 generator (no crypto.randomUUID on RN)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

// Web用のインメモリストレージ
let memoryTasks: Task[] = [];

// Native用のSQLiteインポート
let SQLite: typeof import('expo-sqlite') | null = null;
let db: import('expo-sqlite').SQLiteDatabase | null = null;

// Turso設定キャッシュ
let tursoEnabled = false;

const CREATE_TASKS_TABLE = `
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'inbox'
      CHECK(status IN ('inbox', 'next', 'waiting', 'someday', 'done')),
    is_project INTEGER NOT NULL DEFAULT 0,
    parent_id TEXT,
    waiting_for TEXT,
    context TEXT,
    due_date INTEGER,
    project TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    completed_at TEXT
  );
`;

const CREATE_COMMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );
`;

const CREATE_PROJECTS_TABLE = `
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

const CREATE_CONTEXTS_TABLE = `
  CREATE TABLE IF NOT EXISTS contexts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project);
  CREATE INDEX IF NOT EXISTS idx_tasks_context ON tasks(context);
  CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
  CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
`;

async function initNativeDatabase(): Promise<void> {
  if (Platform.OS === 'web') return;

  SQLite = await import('expo-sqlite');

  const options: any = {};

  // 設定テーブルからTurso設定を読み込み
  const tursoConfig = await getTursoConfig();
  if (tursoConfig && tursoConfig.enabled) {
    options.libSQLOptions = {
      url: tursoConfig.url,
      authToken: tursoConfig.authToken,
    };
    tursoEnabled = true;
  } else {
    tursoEnabled = false;
  }

  db = await SQLite.openDatabaseAsync('floq.db', options);

  await db.execAsync(`
    ${CREATE_TASKS_TABLE}
    ${CREATE_COMMENTS_TABLE}
    ${CREATE_PROJECTS_TABLE}
    ${CREATE_CONTEXTS_TABLE}
    ${CREATE_INDEXES}
  `);
}

let initialized = false;
async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  await initNativeDatabase();
  initialized = true;
}

// Re-initialize DB (used when Turso config changes)
export async function reinitializeDatabase(): Promise<void> {
  initialized = false;
  db = null;
  await ensureInitialized();
}

export async function syncDatabase(): Promise<void> {
  await ensureInitialized();
  if (Platform.OS === 'web') return;
  if (!db) throw new Error('Database not initialized');
  if (!tursoEnabled) return;
  try {
    await (db as any).syncLibSQL();
  } catch (error) {
    console.warn('Failed to sync with Turso:', error);
  }
}

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  is_project: number;
  parent_id: string | null;
  waiting_for: string | null;
  context: string | null;
  due_date: number | null;
  project: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
  completed_at: string | null;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as TaskStatus,
    isProject: row.is_project === 1,
    parentId: row.parent_id ?? undefined,
    waitingFor: row.waiting_for ?? undefined,
    context: row.context ?? undefined,
    dueDate: row.due_date ?? undefined,
    project: row.project ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
  };
}

export async function getTasks(status?: TaskStatus): Promise<Task[]> {
  await ensureInitialized();

  if (Platform.OS === 'web') {
    if (status) {
      return memoryTasks.filter(t => t.status === status);
    }
    return [...memoryTasks].sort((a, b) => b.createdAt - a.createdAt);
  }

  if (!db) throw new Error('Database not initialized');

  let query = 'SELECT * FROM tasks';
  const params: string[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const rows = await db.getAllAsync<TaskRow>(query, params);
  return rows.map(rowToTask);
}

export async function addTask(title: string, status: TaskStatus = 'inbox'): Promise<Task> {
  await ensureInitialized();

  const now = nowUnix();
  const id = generateUUID();

  if (Platform.OS === 'web') {
    const newTask: Task = {
      id,
      title,
      status,
      isProject: false,
      createdAt: now,
      updatedAt: now,
    };
    memoryTasks.unshift(newTask);
    return newTask;
  }

  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    'INSERT INTO tasks (id, title, status, is_project, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
    [id, title, status, now, now]
  );

  const rows = await db.getAllAsync<TaskRow>(
    'SELECT * FROM tasks WHERE id = ?',
    [id]
  );

  return rowToTask(rows[0]);
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  await ensureInitialized();

  const now = nowUnix();

  if (Platform.OS === 'web') {
    const task = memoryTasks.find(t => t.id === id);
    if (task) {
      task.status = status;
      task.updatedAt = now;
      task.completedAt = status === 'done' ? new Date().toISOString() : undefined;
    }
    return;
  }

  if (!db) throw new Error('Database not initialized');

  const completedAt = status === 'done' ? new Date().toISOString() : null;

  await db.runAsync(
    'UPDATE tasks SET status = ?, updated_at = ?, completed_at = ? WHERE id = ?',
    [status, now, completedAt, id]
  );
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<Task, 'title' | 'description' | 'project' | 'context' | 'notes' | 'waitingFor' | 'dueDate' | 'isProject' | 'parentId'>>
): Promise<void> {
  await ensureInitialized();

  if (Platform.OS === 'web') {
    const task = memoryTasks.find(t => t.id === id);
    if (task) {
      if (updates.title !== undefined) task.title = updates.title;
      if (updates.description !== undefined) task.description = updates.description;
      if (updates.project !== undefined) task.project = updates.project;
      if (updates.context !== undefined) task.context = updates.context;
      if (updates.notes !== undefined) task.notes = updates.notes;
      if (updates.waitingFor !== undefined) task.waitingFor = updates.waitingFor;
      if (updates.dueDate !== undefined) task.dueDate = updates.dueDate;
      if (updates.isProject !== undefined) task.isProject = updates.isProject;
      if (updates.parentId !== undefined) task.parentId = updates.parentId;
      task.updatedAt = nowUnix();
    }
    return;
  }

  if (!db) throw new Error('Database not initialized');

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description ?? null);
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
  if (updates.waitingFor !== undefined) {
    fields.push('waiting_for = ?');
    values.push(updates.waitingFor ?? null);
  }
  if (updates.dueDate !== undefined) {
    fields.push('due_date = ?');
    values.push(updates.dueDate ?? null);
  }
  if (updates.isProject !== undefined) {
    fields.push('is_project = ?');
    values.push(updates.isProject ? 1 : 0);
  }
  if (updates.parentId !== undefined) {
    fields.push('parent_id = ?');
    values.push(updates.parentId ?? null);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(nowUnix());
  values.push(id);

  await db.runAsync(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteTask(id: string): Promise<void> {
  await ensureInitialized();

  if (Platform.OS === 'web') {
    memoryTasks = memoryTasks.filter(t => t.id !== id);
    return;
  }

  if (!db) throw new Error('Database not initialized');
  await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
}
