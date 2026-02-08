/**
 * src/db/database.ts のユニットテスト
 *
 * DB層は外部依存（expo-sqlite, Platform）を持つため、
 * モックを用いてロジックの正しさを検証する。
 *
 * t-wada さんの方針:
 * - テストは「動く仕様書」として読めるように
 * - AAA（Arrange-Act-Assert）パターンを使う
 * - 1テスト1アサーションを基本とする
 */

import { Platform } from 'react-native';

// モック DB オブジェクト
const mockExecAsync = jest.fn().mockResolvedValue(undefined);
const mockRunAsync = jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
const mockGetAllAsync = jest.fn().mockResolvedValue([]);
const mockGetFirstAsync = jest.fn().mockResolvedValue(null);
const mockSyncLibSQL = jest.fn().mockResolvedValue(undefined);

const mockDb = {
  execAsync: mockExecAsync,
  runAsync: mockRunAsync,
  getAllAsync: mockGetAllAsync,
  getFirstAsync: mockGetFirstAsync,
  syncLibSQL: mockSyncLibSQL,
};

// expo-sqlite のモックを上書き: openDatabaseAsync が mockDb を返すようにする
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: mockExecAsync,
    runAsync: mockRunAsync,
    getAllAsync: mockGetAllAsync,
    getFirstAsync: mockGetFirstAsync,
    syncLibSQL: mockSyncLibSQL,
  }),
}));

// settings モジュールのモック
jest.mock('../settings', () => ({
  getTursoConfig: jest.fn().mockResolvedValue(null),
}));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  // モックをリセット後に再設定
  mockExecAsync.mockResolvedValue(undefined);
  mockRunAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
  mockGetAllAsync.mockResolvedValue([]);
  mockGetFirstAsync.mockResolvedValue(null);
  mockSyncLibSQL.mockResolvedValue(undefined);
});

describe('initDatabase (Native環境)', () => {
  beforeEach(() => {
    (Platform as any).OS = 'android';
  });

  afterEach(() => {
    (Platform as any).OS = 'ios';
  });

  it('openDatabaseAsync を呼び出してデータベースを初期化する', async () => {
    // Arrange
    const SQLite = require('expo-sqlite');
    const database = require('../database');

    // Act
    await database.getTasks(); // ensureInitialized が内部で呼ばれる

    // Assert
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('floq.db', expect.any(Object));
  });

  it('テーブル作成の SQL を実行する', async () => {
    // Arrange
    const database = require('../database');

    // Act
    await database.getTasks();

    // Assert
    expect(mockExecAsync).toHaveBeenCalledTimes(1);
    const sql = mockExecAsync.mock.calls[0][0] as string;
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS tasks');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS comments');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS projects');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS contexts');
  });

  it('tasks テーブルが TEXT PRIMARY KEY (UUID) で作成される', async () => {
    // Arrange
    const database = require('../database');

    // Act
    await database.getTasks();

    // Assert
    const sql = mockExecAsync.mock.calls[0][0] as string;
    expect(sql).toContain('id TEXT PRIMARY KEY');
  });

  it('tasks テーブルに floq CLI 互換のカラムが含まれる', async () => {
    // Arrange
    const database = require('../database');

    // Act
    await database.getTasks();

    // Assert
    const sql = mockExecAsync.mock.calls[0][0] as string;
    expect(sql).toContain('description TEXT');
    expect(sql).toContain('is_project INTEGER');
    expect(sql).toContain('parent_id TEXT');
    expect(sql).toContain('waiting_for TEXT');
    expect(sql).toContain('due_date INTEGER');
    expect(sql).toContain('created_at INTEGER');
    expect(sql).toContain('updated_at INTEGER');
  });

  it('インデックス作成の SQL を実行する', async () => {
    // Arrange
    const database = require('../database');

    // Act
    await database.getTasks();

    // Assert
    const sql = mockExecAsync.mock.calls[0][0] as string;
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_tasks_status');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_tasks_project');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_tasks_context');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_tasks_parent_id');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_comments_task_id');
  });
});

describe('getTasks (Native環境)', () => {
  beforeEach(() => {
    (Platform as any).OS = 'android';
  });

  afterEach(() => {
    (Platform as any).OS = 'ios';
  });

  it('全タスクを取得する', async () => {
    // Arrange
    const mockRows = [
      {
        id: 'uuid-001',
        title: 'タスク1',
        description: null,
        status: 'inbox',
        is_project: 0,
        parent_id: null,
        waiting_for: null,
        context: null,
        due_date: null,
        project: null,
        notes: null,
        created_at: 1704067200,
        updated_at: 1704067200,
        completed_at: null,
      },
    ];
    mockGetAllAsync.mockResolvedValue(mockRows);
    const database = require('../database');

    // Act
    const tasks = await database.getTasks();

    // Assert
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('タスク1');
    expect(tasks[0].status).toBe('inbox');
    expect(tasks[0].id).toBe('uuid-001');
    expect(tasks[0].isProject).toBe(false);
  });

  it('ステータスでフィルタして取得する', async () => {
    // Arrange
    const mockRows = [
      {
        id: 'uuid-002',
        title: '次にやるタスク',
        description: null,
        status: 'next',
        is_project: 0,
        parent_id: null,
        waiting_for: null,
        context: '@office',
        due_date: null,
        project: 'MyProject',
        notes: null,
        created_at: 1704153600,
        updated_at: 1704153600,
        completed_at: null,
      },
    ];
    mockGetAllAsync.mockResolvedValue(mockRows);
    const database = require('../database');

    // Act
    await database.getTasks('next');

    // Assert
    const calls = mockGetAllAsync.mock.calls;
    const filterCall = calls.find(
      (call: any[]) => typeof call[0] === 'string' && call[0].includes('WHERE status = ?')
    );
    expect(filterCall).toBeDefined();
    expect(filterCall![1]).toEqual(['next']);
  });

  it('null のフィールドを undefined に変換する', async () => {
    // Arrange
    const mockRows = [
      {
        id: 'uuid-003',
        title: 'テスト',
        description: null,
        status: 'inbox',
        is_project: 0,
        parent_id: null,
        waiting_for: null,
        context: null,
        due_date: null,
        project: null,
        notes: null,
        created_at: 1704067200,
        updated_at: 1704067200,
        completed_at: null,
      },
    ];
    mockGetAllAsync.mockResolvedValue(mockRows);
    const database = require('../database');

    // Act
    const tasks = await database.getTasks();

    // Assert
    expect(tasks[0].project).toBeUndefined();
    expect(tasks[0].context).toBeUndefined();
    expect(tasks[0].notes).toBeUndefined();
    expect(tasks[0].completedAt).toBeUndefined();
    expect(tasks[0].description).toBeUndefined();
    expect(tasks[0].parentId).toBeUndefined();
    expect(tasks[0].waitingFor).toBeUndefined();
    expect(tasks[0].dueDate).toBeUndefined();
  });

  it('created_at を createdAt に変換する (INTEGER timestamp)', async () => {
    // Arrange
    const mockRows = [
      {
        id: 'uuid-004',
        title: 'テスト',
        description: null,
        status: 'inbox',
        is_project: 0,
        parent_id: null,
        waiting_for: null,
        context: null,
        due_date: null,
        project: null,
        notes: null,
        created_at: 1718445600,
        updated_at: 1718452800,
        completed_at: null,
      },
    ];
    mockGetAllAsync.mockResolvedValue(mockRows);
    const database = require('../database');

    // Act
    const tasks = await database.getTasks();

    // Assert
    expect(tasks[0].createdAt).toBe(1718445600);
    expect(tasks[0].updatedAt).toBe(1718452800);
  });
});

describe('addTask (Native環境)', () => {
  beforeEach(() => {
    (Platform as any).OS = 'android';
  });

  afterEach(() => {
    (Platform as any).OS = 'ios';
  });

  it('タスクを追加して INSERT 文を実行する', async () => {
    // Arrange
    mockGetAllAsync.mockResolvedValue([
      {
        id: 'generated-uuid',
        title: '新しいタスク',
        description: null,
        status: 'inbox',
        is_project: 0,
        parent_id: null,
        waiting_for: null,
        context: null,
        due_date: null,
        project: null,
        notes: null,
        created_at: 1704067200,
        updated_at: 1704067200,
        completed_at: null,
      },
    ]);
    const database = require('../database');

    // Act
    const task = await database.addTask('新しいタスク');

    // Assert
    const insertCall = mockRunAsync.mock.calls.find(
      (call: any[]) => typeof call[0] === 'string' && call[0].includes('INSERT INTO tasks')
    );
    expect(insertCall).toBeDefined();
    // UUID, title, status, is_project(0), created_at, updated_at
    expect(insertCall![1][1]).toBe('新しいタスク');
    expect(insertCall![1][2]).toBe('inbox');
    expect(task.title).toBe('新しいタスク');
  });

  it('ステータスを指定してタスクを追加できる', async () => {
    // Arrange
    mockGetAllAsync.mockResolvedValue([
      {
        id: 'generated-uuid-2',
        title: '次にやること',
        description: null,
        status: 'next',
        is_project: 0,
        parent_id: null,
        waiting_for: null,
        context: null,
        due_date: null,
        project: null,
        notes: null,
        created_at: 1704067200,
        updated_at: 1704067200,
        completed_at: null,
      },
    ]);
    const database = require('../database');

    // Act
    const task = await database.addTask('次にやること', 'next');

    // Assert
    const insertCall = mockRunAsync.mock.calls.find(
      (call: any[]) => typeof call[0] === 'string' && call[0].includes('INSERT INTO tasks')
    );
    expect(insertCall![1][2]).toBe('next');
    expect(task.status).toBe('next');
  });
});

describe('updateTaskStatus (Native環境)', () => {
  beforeEach(() => {
    (Platform as any).OS = 'android';
  });

  afterEach(() => {
    (Platform as any).OS = 'ios';
  });

  it('タスクのステータスを更新する', async () => {
    // Arrange
    const database = require('../database');

    // Act
    await database.updateTaskStatus('uuid-001', 'next');

    // Assert
    const updateCall = mockRunAsync.mock.calls.find(
      (call: any[]) => typeof call[0] === 'string' && call[0].includes('UPDATE tasks SET status = ?')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![1][0]).toBe('next');
    expect(updateCall![1][3]).toBe('uuid-001');
  });

  it('done に更新すると completed_at が設定される', async () => {
    // Arrange
    const database = require('../database');

    // Act
    await database.updateTaskStatus('uuid-001', 'done');

    // Assert
    const updateCall = mockRunAsync.mock.calls.find(
      (call: any[]) => typeof call[0] === 'string' && call[0].includes('UPDATE tasks SET status = ?')
    );
    expect(updateCall).toBeDefined();
    // completed_at should be a non-null ISO string
    expect(updateCall![1][2]).not.toBeNull();
  });

  it('done 以外に更新すると completed_at が NULL になる', async () => {
    // Arrange
    const database = require('../database');

    // Act
    await database.updateTaskStatus('uuid-001', 'inbox');

    // Assert
    const updateCall = mockRunAsync.mock.calls.find(
      (call: any[]) => typeof call[0] === 'string' && call[0].includes('UPDATE tasks SET status = ?')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![1][2]).toBeNull();
  });
});

describe('updateTask (Native環境)', () => {
  beforeEach(() => {
    (Platform as any).OS = 'android';
  });

  afterEach(() => {
    (Platform as any).OS = 'ios';
  });

  it('タイトルを更新する', async () => {
    // Arrange
    const database = require('../database');

    // Act
    await database.updateTask('uuid-001', { title: '更新されたタイトル' });

    // Assert
    const updateCall = mockRunAsync.mock.calls.find(
      (call: any[]) => typeof call[0] === 'string' && call[0].includes('title = ?')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![1]).toContain('更新されたタイトル');
  });

  it('更新フィールドが空の場合は SQL を実行しない', async () => {
    // Arrange
    const database = require('../database');

    // Act
    await database.updateTask('uuid-001', {});

    // Assert
    expect(mockRunAsync).not.toHaveBeenCalled();
  });

  it('複数フィールドを同時に更新できる', async () => {
    // Arrange
    const database = require('../database');

    // Act
    await database.updateTask('uuid-001', {
      title: '新タイトル',
      project: 'ProjectA',
      context: '@home',
    });

    // Assert
    const updateCall = mockRunAsync.mock.calls.find(
      (call: any[]) => typeof call[0] === 'string' && call[0].includes('UPDATE tasks SET')
    );
    expect(updateCall).toBeDefined();
    const sql = updateCall![0] as string;
    expect(sql).toContain('title = ?');
    expect(sql).toContain('project = ?');
    expect(sql).toContain('context = ?');
  });
});

describe('deleteTask (Native環境)', () => {
  beforeEach(() => {
    (Platform as any).OS = 'android';
  });

  afterEach(() => {
    (Platform as any).OS = 'ios';
  });

  it('指定した ID のタスクを削除する', async () => {
    // Arrange
    const database = require('../database');

    // Act
    await database.deleteTask('uuid-042');

    // Assert
    const deleteCall = mockRunAsync.mock.calls.find(
      (call: any[]) => typeof call[0] === 'string' && call[0].includes('DELETE FROM tasks')
    );
    expect(deleteCall).toBeDefined();
    expect(deleteCall![1]).toEqual(['uuid-042']);
  });
});

describe('syncDatabase', () => {
  beforeEach(() => {
    (Platform as any).OS = 'android';
  });

  afterEach(() => {
    (Platform as any).OS = 'ios';
  });

  it('Turso が未設定の場合は同期をスキップする', async () => {
    // Arrange
    const database = require('../database');

    // Act
    await database.syncDatabase();

    // Assert
    expect(mockSyncLibSQL).not.toHaveBeenCalled();
  });
});

describe('Web版インメモリフォールバック', () => {
  beforeEach(() => {
    (Platform as any).OS = 'web';
  });

  afterEach(() => {
    (Platform as any).OS = 'ios';
  });

  it('Web環境ではインメモリでタスクを追加・取得できる', async () => {
    // Arrange
    const database = require('../database');

    // Act
    const newTask = await database.addTask('Webタスク');
    const tasks = await database.getTasks();

    // Assert
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Webタスク');
    expect(newTask.title).toBe('Webタスク');
    expect(typeof newTask.id).toBe('string');
  });

  it('Web環境でステータスフィルタが動作する', async () => {
    // Arrange
    const database = require('../database');
    await database.addTask('タスクA', 'inbox');
    await database.addTask('タスクB', 'next');

    // Act
    const inboxTasks = await database.getTasks('inbox');

    // Assert
    expect(inboxTasks).toHaveLength(1);
    expect(inboxTasks[0].title).toBe('タスクA');
  });

  it('Web環境でタスクのステータスを更新できる', async () => {
    // Arrange
    const database = require('../database');
    const task = await database.addTask('更新対象タスク');

    // Act
    await database.updateTaskStatus(task.id, 'done');
    const tasks = await database.getTasks();

    // Assert
    expect(tasks[0].status).toBe('done');
    expect(tasks[0].completedAt).toBeDefined();
  });

  it('Web環境でタスクを削除できる', async () => {
    // Arrange
    const database = require('../database');
    const task = await database.addTask('削除対象タスク');

    // Act
    await database.deleteTask(task.id);
    const tasks = await database.getTasks();

    // Assert
    expect(tasks).toHaveLength(0);
  });

  it('Web環境でタスクのフィールドを更新できる', async () => {
    // Arrange
    const database = require('../database');
    const task = await database.addTask('元のタイトル');

    // Act
    await database.updateTask(task.id, {
      title: '新しいタイトル',
      project: 'TestProject',
      context: '@home',
      notes: 'メモ',
    });
    const tasks = await database.getTasks();

    // Assert
    expect(tasks[0].title).toBe('新しいタイトル');
    expect(tasks[0].project).toBe('TestProject');
    expect(tasks[0].context).toBe('@home');
    expect(tasks[0].notes).toBe('メモ');
  });

  it('Web環境では SQLite を使用しない', async () => {
    // Arrange
    const SQLite = require('expo-sqlite');
    const database = require('../database');

    // Act
    await database.addTask('テスト');

    // Assert
    expect(SQLite.openDatabaseAsync).not.toHaveBeenCalled();
  });
});
