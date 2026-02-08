export type TaskStatus = 'inbox' | 'next' | 'waiting' | 'someday' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  description?: string;
  isProject: boolean;
  parentId?: string;
  waitingFor?: string;
  context?: string;
  dueDate?: number;
  project?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  content: string;
  createdAt: number;
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
