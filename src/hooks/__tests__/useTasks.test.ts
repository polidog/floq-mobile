/**
 * src/hooks/useTasks.ts のユニットテスト
 *
 * カスタムフック useTasks は DB 層をラップし、
 * React の状態管理（loading, error, tasks）を提供する。
 * renderHook を用いてフックの振る舞いを検証する。
 *
 * t-wada さんの方針:
 * - テストは「動く仕様書」として読めるように
 * - AAA（Arrange-Act-Assert）パターンを使う
 * - 1テスト1アサーションを基本とする
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import type { Task } from '../../types/task';

// DB モジュールをモック化
jest.mock('../../db/database', () => ({
  syncDatabase: jest.fn().mockResolvedValue(undefined),
  getTasks: jest.fn().mockResolvedValue([]),
  addTask: jest.fn(),
  updateTaskStatus: jest.fn().mockResolvedValue(undefined),
  deleteTask: jest.fn().mockResolvedValue(undefined),
}));

import { useTasks } from '../useTasks';
import * as db from '../../db/database';

const mockGetTasks = db.getTasks as jest.Mock;
const mockAddTask = db.addTask as jest.Mock;
const mockUpdateTaskStatus = db.updateTaskStatus as jest.Mock;
const mockDeleteTask = db.deleteTask as jest.Mock;
const mockSyncDatabase = db.syncDatabase as jest.Mock;

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-001',
  title: 'テストタスク',
  status: 'inbox',
  isProject: false,
  createdAt: 1704067200,
  updatedAt: 1704067200,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetTasks.mockResolvedValue([]);
  mockSyncDatabase.mockResolvedValue(undefined);
});

describe('useTasks - 初期化', () => {
  it('マウント時に loading が true から false に変わる', async () => {
    // Arrange & Act
    const { result } = renderHook(() => useTasks());

    // Assert - 初期状態
    // loading は非同期処理完了後に false になる
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('マウント時に syncDatabase と getTasks を呼び出す', async () => {
    // Arrange & Act
    renderHook(() => useTasks());

    // Assert
    await waitFor(() => {
      expect(mockSyncDatabase).toHaveBeenCalled();
      expect(mockGetTasks).toHaveBeenCalled();
    });
  });

  it('初期状態では error が null である', async () => {
    // Arrange & Act
    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Assert
    expect(result.current.error).toBeNull();
  });

  it('初期状態では tasks が空配列である', async () => {
    // Arrange & Act
    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Assert
    expect(result.current.tasks).toEqual([]);
  });
});

describe('useTasks - loadTasks', () => {
  it('タスク一覧をDBから読み込んで state に反映する', async () => {
    // Arrange
    const mockTasks = [
      createMockTask({ id: 'task-001', title: 'タスク1' }),
      createMockTask({ id: 'task-002', title: 'タスク2', status: 'next' }),
    ];
    mockGetTasks.mockResolvedValue(mockTasks);

    // Act
    const { result } = renderHook(() => useTasks());

    // Assert
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(2);
    });
    expect(result.current.tasks[0].title).toBe('タスク1');
    expect(result.current.tasks[1].title).toBe('タスク2');
  });

  it('読み込みに失敗した場合 error にメッセージが設定される', async () => {
    // Arrange
    mockSyncDatabase.mockRejectedValue(new Error('DB接続エラー'));

    // Act
    const { result } = renderHook(() => useTasks());

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBe('DB接続エラー');
    });
  });
});

describe('useTasks - addTask', () => {
  it('タスクを追加すると tasks の先頭に追加される', async () => {
    // Arrange
    const newTask = createMockTask({ id: 'task-010', title: '新規タスク' });
    mockAddTask.mockResolvedValue(newTask);
    const { result } = renderHook(() => useTasks());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    await act(async () => {
      await result.current.addTask('新規タスク');
    });

    // Assert
    expect(result.current.tasks[0].title).toBe('新規タスク');
    expect(mockAddTask).toHaveBeenCalledWith('新規タスク', 'inbox');
  });

  it('ステータスを指定してタスクを追加できる', async () => {
    // Arrange
    const newTask = createMockTask({ id: 'task-011', title: '次のタスク', status: 'next' });
    mockAddTask.mockResolvedValue(newTask);
    const { result } = renderHook(() => useTasks());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    await act(async () => {
      await result.current.addTask('次のタスク', 'next');
    });

    // Assert
    expect(mockAddTask).toHaveBeenCalledWith('次のタスク', 'next');
    expect(result.current.tasks[0].status).toBe('next');
  });

  it('追加に失敗した場合 error が設定される', async () => {
    // Arrange
    mockAddTask.mockRejectedValue(new Error('追加失敗'));
    const { result } = renderHook(() => useTasks());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    await act(async () => {
      await result.current.addTask('失敗するタスク');
    });

    // Assert
    expect(result.current.error).toBe('追加失敗');
  });
});

describe('useTasks - updateStatus', () => {
  it('タスクのステータスを楽観的に更新する', async () => {
    // Arrange
    const existingTask = createMockTask({ id: 'task-001', title: 'タスク1', status: 'inbox' });
    mockGetTasks.mockResolvedValue([existingTask]);
    const { result } = renderHook(() => useTasks());
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    // Act
    await act(async () => {
      await result.current.updateStatus('task-001', 'done');
    });

    // Assert
    expect(result.current.tasks[0].status).toBe('done');
    expect(result.current.tasks[0].completedAt).toBeDefined();
  });

  it('更新に失敗した場合ロールバックされる', async () => {
    // Arrange
    const existingTask = createMockTask({ id: 'task-001', title: 'タスク1', status: 'inbox' });
    mockGetTasks.mockResolvedValue([existingTask]);
    mockUpdateTaskStatus.mockRejectedValue(new Error('更新失敗'));
    const { result } = renderHook(() => useTasks());
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    // Act
    await act(async () => {
      await result.current.updateStatus('task-001', 'done');
    });

    // Assert
    expect(result.current.tasks[0].status).toBe('inbox');
    expect(result.current.error).toBe('更新失敗');
  });
});

describe('useTasks - removeTask', () => {
  it('タスクを楽観的に削除する', async () => {
    // Arrange
    const existingTask = createMockTask({ id: 'task-001', title: '削除対象' });
    mockGetTasks.mockResolvedValue([existingTask]);
    const { result } = renderHook(() => useTasks());
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    // Act
    await act(async () => {
      await result.current.removeTask('task-001');
    });

    // Assert
    expect(result.current.tasks).toHaveLength(0);
    expect(mockDeleteTask).toHaveBeenCalledWith('task-001');
  });

  it('削除に失敗した場合ロールバックされる', async () => {
    // Arrange
    const existingTask = createMockTask({ id: 'task-001', title: '削除対象' });
    mockGetTasks.mockResolvedValue([existingTask]);
    mockDeleteTask.mockRejectedValue(new Error('削除失敗'));
    const { result } = renderHook(() => useTasks());
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    // Act
    await act(async () => {
      await result.current.removeTask('task-001');
    });

    // Assert
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('削除対象');
    expect(result.current.error).toBe('削除失敗');
  });
});

describe('useTasks - counts', () => {
  it('ステータスごとのカウントを正しく計算する', async () => {
    // Arrange
    const mockTasks = [
      createMockTask({ id: 'task-001', status: 'inbox' }),
      createMockTask({ id: 'task-002', status: 'inbox' }),
      createMockTask({ id: 'task-003', status: 'next' }),
      createMockTask({ id: 'task-004', status: 'done' }),
    ];
    mockGetTasks.mockResolvedValue(mockTasks);

    // Act
    const { result } = renderHook(() => useTasks());

    // Assert
    await waitFor(() => {
      expect(result.current.counts.all).toBe(4);
    });
    expect(result.current.counts.inbox).toBe(2);
    expect(result.current.counts.next).toBe(1);
    expect(result.current.counts.done).toBe(1);
    expect(result.current.counts.waiting).toBe(0);
    expect(result.current.counts.someday).toBe(0);
  });
});
