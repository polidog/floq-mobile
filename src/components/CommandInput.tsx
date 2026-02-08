import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { terminalTheme } from '../theme/terminal';

interface Props {
  onSubmit: (text: string) => void;
  placeholder?: string;
}

export function CommandInput({ onSubmit, placeholder = 'Type a command or task...' }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>{'>'}</Text>
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
      />
      <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
        <Text style={styles.submitText}>RET</Text>
      </TouchableOpacity>
    </View>
  );
}

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
