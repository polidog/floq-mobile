import React, { useState, useCallback } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { terminalTheme } from '../theme/terminal';

interface Props {
  onSubmit: (text: string) => void;
  placeholder?: string;
}

export const CommandInput = React.memo(function CommandInput({ onSubmit, placeholder = 'Type a command or task...' }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(() => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  }, [text, onSubmit]);

  return (
    <View style={styles.container} accessibilityRole="search">
      <Text style={styles.prompt} accessibilityElementsHidden>{'>'}</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={terminalTheme.colors.textDim}
        onSubmitEditing={handleSubmit}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        accessibilityLabel="Command input. Enter a task name or slash command"
        accessibilityHint="Type a task to add or use /help for commands"
      />
      <TouchableOpacity
        onPress={handleSubmit}
        style={styles.submitButton}
        accessibilityRole="button"
        accessibilityLabel="Submit command"
      >
        <Text style={styles.submitText}>RET</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: terminalTheme.spacing.lg,
    paddingVertical: terminalTheme.spacing.md,
    backgroundColor: terminalTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: terminalTheme.colors.border,
  },
  prompt: {
    fontFamily: terminalTheme.fonts.monoBold,
    fontSize: terminalTheme.fontSize.lg,
    color: terminalTheme.colors.success,
    marginRight: terminalTheme.spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.text,
    paddingVertical: terminalTheme.spacing.sm,
  },
  submitButton: {
    paddingHorizontal: terminalTheme.spacing.md,
    paddingVertical: terminalTheme.spacing.sm,
    backgroundColor: terminalTheme.colors.border,
    borderRadius: terminalTheme.borderRadius.sm,
    marginLeft: terminalTheme.spacing.sm,
  },
  submitText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.textMuted,
  },
});
