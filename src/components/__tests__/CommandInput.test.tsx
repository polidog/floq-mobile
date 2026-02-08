/**
 * src/components/CommandInput.tsx のコンポーネントテスト
 *
 * CommandInput はターミナル風のコマンド入力欄。
 * テキスト入力、送信、そしてコマンドショートカットの処理を検証する。
 *
 * t-wada さんの方針:
 * - テストは「動く仕様書」として読めるように
 * - AAA（Arrange-Act-Assert）パターンを使う
 * - 1テスト1アサーションを基本とする
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CommandInput } from '../CommandInput';

describe('CommandInput - 表示', () => {
  it('プロンプト記号 > が表示される', () => {
    // Arrange
    const onSubmit = jest.fn();

    // Act
    const { UNSAFE_getByProps } = render(<CommandInput onSubmit={onSubmit} />);

    // Assert
    // accessibilityElementsHidden が設定されたプロンプト記号テキストが存在する
    const promptElement = UNSAFE_getByProps({ accessibilityElementsHidden: true });
    expect(promptElement).toBeTruthy();
  });

  it('RET ボタンが表示される', () => {
    // Arrange
    const onSubmit = jest.fn();

    // Act
    const { getByText } = render(<CommandInput onSubmit={onSubmit} />);

    // Assert
    expect(getByText('RET')).toBeTruthy();
  });

  it('デフォルトのプレースホルダーが設定される', () => {
    // Arrange
    const onSubmit = jest.fn();

    // Act
    const { getByPlaceholderText } = render(<CommandInput onSubmit={onSubmit} />);

    // Assert
    expect(getByPlaceholderText('Type a command or task...')).toBeTruthy();
  });

  it('カスタムプレースホルダーを指定できる', () => {
    // Arrange
    const onSubmit = jest.fn();

    // Act
    const { getByPlaceholderText } = render(
      <CommandInput onSubmit={onSubmit} placeholder="タスクを入力..." />
    );

    // Assert
    expect(getByPlaceholderText('タスクを入力...')).toBeTruthy();
  });
});

describe('CommandInput - テキスト入力', () => {
  it('テキストを入力できる', () => {
    // Arrange
    const onSubmit = jest.fn();
    const { getByLabelText } = render(<CommandInput onSubmit={onSubmit} />);
    const input = getByLabelText('Command input. Enter a task name or slash command');

    // Act
    fireEvent.changeText(input, '新しいタスク');

    // Assert
    expect(input.props.value).toBe('新しいタスク');
  });
});

describe('CommandInput - コマンド送信', () => {
  it('RET ボタンを押すと onSubmit が呼ばれる', () => {
    // Arrange
    const onSubmit = jest.fn();
    const { getByLabelText, getByText } = render(
      <CommandInput onSubmit={onSubmit} />
    );
    const input = getByLabelText('Command input. Enter a task name or slash command');
    fireEvent.changeText(input, 'タスクを追加');

    // Act
    fireEvent.press(getByText('RET'));

    // Assert
    expect(onSubmit).toHaveBeenCalledWith('タスクを追加');
  });

  it('Enter キー（submitEditing）で onSubmit が呼ばれる', () => {
    // Arrange
    const onSubmit = jest.fn();
    const { getByLabelText } = render(<CommandInput onSubmit={onSubmit} />);
    const input = getByLabelText('Command input. Enter a task name or slash command');
    fireEvent.changeText(input, 'Enterで送信');

    // Act
    fireEvent(input, 'submitEditing');

    // Assert
    expect(onSubmit).toHaveBeenCalledWith('Enterで送信');
  });

  it('送信後に入力欄がクリアされる', () => {
    // Arrange
    const onSubmit = jest.fn();
    const { getByLabelText, getByText } = render(
      <CommandInput onSubmit={onSubmit} />
    );
    const input = getByLabelText('Command input. Enter a task name or slash command');
    fireEvent.changeText(input, 'クリアされるテキスト');

    // Act
    fireEvent.press(getByText('RET'));

    // Assert
    expect(input.props.value).toBe('');
  });

  it('空文字の場合は onSubmit が呼ばれない', () => {
    // Arrange
    const onSubmit = jest.fn();
    const { getByText } = render(<CommandInput onSubmit={onSubmit} />);

    // Act
    fireEvent.press(getByText('RET'));

    // Assert
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('スペースのみの場合は onSubmit が呼ばれない', () => {
    // Arrange
    const onSubmit = jest.fn();
    const { getByLabelText, getByText } = render(
      <CommandInput onSubmit={onSubmit} />
    );
    const input = getByLabelText('Command input. Enter a task name or slash command');
    fireEvent.changeText(input, '   ');

    // Act
    fireEvent.press(getByText('RET'));

    // Assert
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('前後のスペースがトリムされて送信される', () => {
    // Arrange
    const onSubmit = jest.fn();
    const { getByLabelText, getByText } = render(
      <CommandInput onSubmit={onSubmit} />
    );
    const input = getByLabelText('Command input. Enter a task name or slash command');
    fireEvent.changeText(input, '  トリムされるタスク  ');

    // Act
    fireEvent.press(getByText('RET'));

    // Assert
    expect(onSubmit).toHaveBeenCalledWith('トリムされるタスク');
  });
});

describe('CommandInput - コマンドショートカット', () => {
  it('/add コマンドを送信できる', () => {
    // Arrange
    const onSubmit = jest.fn();
    const { getByLabelText, getByText } = render(
      <CommandInput onSubmit={onSubmit} />
    );
    const input = getByLabelText('Command input. Enter a task name or slash command');
    fireEvent.changeText(input, '/add 新しいタスク');

    // Act
    fireEvent.press(getByText('RET'));

    // Assert
    expect(onSubmit).toHaveBeenCalledWith('/add 新しいタスク');
  });

  it('/done コマンドを送信できる', () => {
    // Arrange
    const onSubmit = jest.fn();
    const { getByLabelText, getByText } = render(
      <CommandInput onSubmit={onSubmit} />
    );
    const input = getByLabelText('Command input. Enter a task name or slash command');
    fireEvent.changeText(input, '/done 1');

    // Act
    fireEvent.press(getByText('RET'));

    // Assert
    expect(onSubmit).toHaveBeenCalledWith('/done 1');
  });

  it('/help コマンドを送信できる', () => {
    // Arrange
    const onSubmit = jest.fn();
    const { getByLabelText, getByText } = render(
      <CommandInput onSubmit={onSubmit} />
    );
    const input = getByLabelText('Command input. Enter a task name or slash command');
    fireEvent.changeText(input, '/help');

    // Act
    fireEvent.press(getByText('RET'));

    // Assert
    expect(onSubmit).toHaveBeenCalledWith('/help');
  });

  it('スラッシュで始まらない通常テキストも送信できる', () => {
    // Arrange
    const onSubmit = jest.fn();
    const { getByLabelText, getByText } = render(
      <CommandInput onSubmit={onSubmit} />
    );
    const input = getByLabelText('Command input. Enter a task name or slash command');
    fireEvent.changeText(input, '牛乳を買う');

    // Act
    fireEvent.press(getByText('RET'));

    // Assert
    expect(onSubmit).toHaveBeenCalledWith('牛乳を買う');
  });
});

describe('CommandInput - アクセシビリティ', () => {
  it('入力欄に適切な accessibilityLabel が設定される', () => {
    // Arrange
    const onSubmit = jest.fn();

    // Act
    const { getByLabelText } = render(<CommandInput onSubmit={onSubmit} />);

    // Assert
    expect(
      getByLabelText('Command input. Enter a task name or slash command')
    ).toBeTruthy();
  });

  it('送信ボタンに適切な accessibilityLabel が設定される', () => {
    // Arrange
    const onSubmit = jest.fn();

    // Act
    const { getByLabelText } = render(<CommandInput onSubmit={onSubmit} />);

    // Assert
    expect(getByLabelText('Submit command')).toBeTruthy();
  });

  it('コンテナに search ロールが設定される', () => {
    // Arrange
    const onSubmit = jest.fn();

    // Act
    const { UNSAFE_getByProps } = render(<CommandInput onSubmit={onSubmit} />);

    // Assert
    // View に accessibilityRole="search" が設定されていることを確認
    const container = UNSAFE_getByProps({ accessibilityRole: 'search' });
    expect(container).toBeTruthy();
  });
});
