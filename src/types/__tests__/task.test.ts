import { STATUS_LABELS, STATUS_COLORS } from '../task';
import type { TaskStatus, Task } from '../task';

/**
 * src/types/task.ts の型定義と定数に対するテスト
 *
 * t-wada さんの教えに従い、テストは「動く仕様書」として機能させる。
 * まず最も基本的な部分 -- 型定義が正しいか、定数の値が期待通りか --
 * を確認することで、テスト基盤が正しく動作していることを検証する。
 */
describe('TaskStatus', () => {
  it('STATUS_LABELS は全てのステータスに対してラベルを持つ', () => {
    const allStatuses: TaskStatus[] = ['inbox', 'next', 'waiting', 'someday', 'done'];

    allStatuses.forEach((status) => {
      expect(STATUS_LABELS[status]).toBeDefined();
      expect(typeof STATUS_LABELS[status]).toBe('string');
      expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
    });
  });

  it('STATUS_LABELS の値は大文字表記である', () => {
    Object.values(STATUS_LABELS).forEach((label) => {
      expect(label).toBe(label.toUpperCase());
    });
  });

  it('STATUS_LABELS のキーと値が正しく対応している', () => {
    expect(STATUS_LABELS.inbox).toBe('INBOX');
    expect(STATUS_LABELS.next).toBe('NEXT');
    expect(STATUS_LABELS.waiting).toBe('WAITING');
    expect(STATUS_LABELS.someday).toBe('SOMEDAY');
    expect(STATUS_LABELS.done).toBe('DONE');
  });

  it('STATUS_COLORS は全てのステータスに対して色コードを持つ', () => {
    const allStatuses: TaskStatus[] = ['inbox', 'next', 'waiting', 'someday', 'done'];

    allStatuses.forEach((status) => {
      expect(STATUS_COLORS[status]).toBeDefined();
      expect(STATUS_COLORS[status]).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('STATUS_COLORS のキーと値が正しく対応している', () => {
    expect(STATUS_COLORS.inbox).toBe('#d29922');
    expect(STATUS_COLORS.next).toBe('#58a6ff');
    expect(STATUS_COLORS.waiting).toBe('#a371f7');
    expect(STATUS_COLORS.someday).toBe('#8b949e');
    expect(STATUS_COLORS.done).toBe('#3fb950');
  });

  it('STATUS_LABELS と STATUS_COLORS は同じキーセットを持つ', () => {
    const labelKeys = Object.keys(STATUS_LABELS).sort();
    const colorKeys = Object.keys(STATUS_COLORS).sort();

    expect(labelKeys).toEqual(colorKeys);
  });
});

describe('Task 型', () => {
  it('必須プロパティを持つオブジェクトが Task 型を満たす', () => {
    const task: Task = {
      id: 'abc-123',
      title: 'テストタスク',
      status: 'inbox',
      isProject: false,
      createdAt: 1704067200,
      updatedAt: 1704067200,
    };

    expect(task.id).toBe('abc-123');
    expect(task.title).toBe('テストタスク');
    expect(task.status).toBe('inbox');
    expect(task.isProject).toBe(false);
    expect(task.createdAt).toBeDefined();
    expect(task.updatedAt).toBeDefined();
    // optional fields should be undefined when not set
    expect(task.project).toBeUndefined();
    expect(task.context).toBeUndefined();
    expect(task.notes).toBeUndefined();
    expect(task.completedAt).toBeUndefined();
    expect(task.description).toBeUndefined();
    expect(task.parentId).toBeUndefined();
    expect(task.waitingFor).toBeUndefined();
    expect(task.dueDate).toBeUndefined();
  });

  it('オプショナルプロパティを含む Task オブジェクトを作成できる', () => {
    const task: Task = {
      id: 'def-456',
      title: '完了済みタスク',
      status: 'done',
      isProject: false,
      project: 'テストプロジェクト',
      context: '@office',
      notes: 'メモ内容',
      description: '詳細説明',
      parentId: 'parent-001',
      waitingFor: '誰か',
      dueDate: 1704153600,
      createdAt: 1704067200,
      updatedAt: 1704153600,
      completedAt: '2025-01-02T00:00:00.000Z',
    };

    expect(task.project).toBe('テストプロジェクト');
    expect(task.context).toBe('@office');
    expect(task.notes).toBe('メモ内容');
    expect(task.completedAt).toBe('2025-01-02T00:00:00.000Z');
    expect(task.description).toBe('詳細説明');
    expect(task.parentId).toBe('parent-001');
    expect(task.waitingFor).toBe('誰か');
    expect(task.dueDate).toBe(1704153600);
  });
});
