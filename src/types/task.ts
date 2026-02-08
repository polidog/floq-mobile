export type TaskStatus = 'inbox' | 'next' | 'waiting' | 'someday' | 'done';

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  project?: string;
  context?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Project {
  id: number;
  name: string;
  createdAt: string;
}

export interface Context {
  id: number;
  name: string;
  createdAt: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  inbox: 'INBOX',
  next: 'NEXT',
  waiting: 'WAITING',
  someday: 'SOMEDAY',
  done: 'DONE',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  inbox: '#d29922',
  next: '#58a6ff',
  waiting: '#a371f7',
  someday: '#8b949e',
  done: '#3fb950',
};
