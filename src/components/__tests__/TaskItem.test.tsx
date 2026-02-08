/**
 * src/components/TaskItem.tsx のコンポーネントテスト
 *
 * TaskItem はタスク1件分の表示を担うコンポーネント。
 * 表示内容、タップ・長押しのインタラクション、
 * 完了タスクのスタイル変更を検証する。
 *
 * t-wada さんの方針:
 * - テストは「動く仕様書」として読めるように
 * - AAA（Arrange-Act-Assert）パターンを使う
 * - 1テスト1アサーションを基本とする
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TaskItem } from '../TaskItem';
import type { Task } from '../../types/task';

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-001',
  title: 'テストタスク',
  status: 'inbox',
  isProject: false,
  createdAt: 1704067200,
  updatedAt: 1704067200,
  ...overrides,
});

describe('TaskItem - 表示', () => {
  it('タスクのタイトルが表示される', () => {
    // Arrange
    const task = createMockTask({ title: '買い物に行く' });

    // Act
    const { getByText } = render(<TaskItem task={task} index={0} />);

    // Assert
    expect(getByText(/買い物に行く/)).toBeTruthy();
  });

  it('未完了タスクは [ ] プレフィックスで表示される', () => {
    // Arrange
    const task = createMockTask({ status: 'inbox' });

    // Act
    const { getByText } = render(<TaskItem task={task} index={0} />);

    // Assert
    expect(getByText(/\[ \]/)).toBeTruthy();
  });

  it('完了タスクは [x] プレフィックスで表示される', () => {
    // Arrange
    const task = createMockTask({ status: 'done' });

    // Act
    const { getByText } = render(<TaskItem task={task} index={0} />);

    // Assert
    expect(getByText(/\[x\]/)).toBeTruthy();
  });

  it('インデックス番号が01始まりで表示される', () => {
    // Arrange
    const task = createMockTask();

    // Act
    const { getByText } = render(<TaskItem task={task} index={0} />);

    // Assert
    expect(getByText('01')).toBeTruthy();
  });

  it('インデックスが10以上でも正しくパディングされる', () => {
    // Arrange
    const task = createMockTask();

    // Act
    const { getByText } = render(<TaskItem task={task} index={9} />);

    // Assert
    expect(getByText('10')).toBeTruthy();
  });

  it('ステータスラベルが表示される', () => {
    // Arrange
    const task = createMockTask({ status: 'next' });

    // Act
    const { getByText } = render(<TaskItem task={task} index={0} />);

    // Assert
    expect(getByText('NEXT')).toBeTruthy();
  });

  it('プロジェクト名が + プレフィックスで表示される', () => {
    // Arrange
    const task = createMockTask({ project: 'MyProject' });

    // Act
    const { getByText } = render(<TaskItem task={task} index={0} />);

    // Assert
    expect(getByText('+MyProject')).toBeTruthy();
  });

  it('コンテキストが @ プレフィックスで表示される', () => {
    // Arrange
    const task = createMockTask({ context: '@office' });

    // Act
    const { getByText } = render(<TaskItem task={task} index={0} />);

    // Assert
    expect(getByText('@@office')).toBeTruthy();
  });

  it('プロジェクトが未設定の場合は表示されない', () => {
    // Arrange
    const task = createMockTask({ project: undefined });

    // Act
    const { queryByText } = render(<TaskItem task={task} index={0} />);

    // Assert
    expect(queryByText(/^\+/)).toBeNull();
  });

  it('コンテキストが未設定の場合は表示されない', () => {
    // Arrange
    const task = createMockTask({ context: undefined });

    // Act
    const { queryByText } = render(<TaskItem task={task} index={0} />);

    // Assert
    // @@で始まるテキストがないことを確認（ステータスラベルの @ は含まない）
    expect(queryByText(/^@@/)).toBeNull();
  });
});

describe('TaskItem - インタラクション', () => {
  it('タップすると onPress が task.id と共に呼ばれる', () => {
    // Arrange
    const onPress = jest.fn();
    const task = createMockTask({ id: 'task-042' });

    // Act
    const { getByRole } = render(
      <TaskItem task={task} index={0} onPress={onPress} />
    );
    fireEvent.press(getByRole('button'));

    // Assert
    expect(onPress).toHaveBeenCalledWith('task-042');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('長押しすると onLongPress が task.id と status と共に呼ばれる', () => {
    // Arrange
    const onLongPress = jest.fn();
    const task = createMockTask({ id: 'task-007', status: 'next' });

    // Act
    const { getByRole } = render(
      <TaskItem task={task} index={0} onLongPress={onLongPress} />
    );
    fireEvent(getByRole('button'), 'longPress');

    // Assert
    expect(onLongPress).toHaveBeenCalledWith('task-007', 'next');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('onPress が未指定でもタップ時にエラーにならない', () => {
    // Arrange
    const task = createMockTask();

    // Act & Assert
    const { getByRole } = render(<TaskItem task={task} index={0} />);
    expect(() => fireEvent.press(getByRole('button'))).not.toThrow();
  });

  it('onLongPress が未指定でも長押し時にエラーにならない', () => {
    // Arrange
    const task = createMockTask();

    // Act & Assert
    const { getByRole } = render(<TaskItem task={task} index={0} />);
    expect(() => fireEvent(getByRole('button'), 'longPress')).not.toThrow();
  });
});

describe('TaskItem - 完了タスクのスタイル', () => {
  it('完了タスクのタイトルに取り消し線スタイルが適用される', () => {
    // Arrange
    const task = createMockTask({ status: 'done', title: '完了タスク' });

    // Act
    const { getByText } = render(<TaskItem task={task} index={0} />);
    const titleElement = getByText(/\[x\] 完了タスク/);

    // Assert
    const style = titleElement.props.style;
    // flattenした場合は配列、styleは配列で適用される
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
    expect(flatStyle.textDecorationLine).toBe('line-through');
  });

  it('未完了タスクには取り消し線スタイルが適用されない', () => {
    // Arrange
    const task = createMockTask({ status: 'inbox', title: '未完了タスク' });

    // Act
    const { getByText } = render(<TaskItem task={task} index={0} />);
    const titleElement = getByText(/\[ \] 未完了タスク/);

    // Assert
    const style = titleElement.props.style;
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
    expect(flatStyle.textDecorationLine).toBeUndefined();
  });
});

describe('TaskItem - アクセシビリティ', () => {
  it('適切な accessibilityLabel が設定される', () => {
    // Arrange
    const task = createMockTask({
      id: 'task-001',
      title: 'テストタスク',
      status: 'inbox',
      project: 'ProjectA',
      context: '@home',
    });

    // Act
    const { getByRole } = render(<TaskItem task={task} index={0} />);
    const button = getByRole('button');

    // Assert
    expect(button.props.accessibilityLabel).toContain('テストタスク');
    expect(button.props.accessibilityLabel).toContain('INBOX');
    expect(button.props.accessibilityLabel).toContain('ProjectA');
    expect(button.props.accessibilityLabel).toContain('@home');
  });

  it('完了タスクは accessibilityState.checked が true になる', () => {
    // Arrange
    const task = createMockTask({ status: 'done' });

    // Act
    const { getByRole } = render(<TaskItem task={task} index={0} />);

    // Assert
    expect(getByRole('button').props.accessibilityState).toEqual({ checked: true });
  });

  it('未完了タスクは accessibilityState.checked が false になる', () => {
    // Arrange
    const task = createMockTask({ status: 'inbox' });

    // Act
    const { getByRole } = render(<TaskItem task={task} index={0} />);

    // Assert
    expect(getByRole('button').props.accessibilityState).toEqual({ checked: false });
  });
});
