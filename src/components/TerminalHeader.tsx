import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { terminalTheme } from '../theme/terminal';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function TerminalHeader({ title, subtitle, showBack, onBack }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>
          <Text style={styles.prompt}>floq</Text>
          <Text style={styles.separator}> {'>'} </Text>
          <Text style={styles.command}>{title}</Text>
          <Text style={styles.cursor}>_</Text>
        </Text>
      </View>
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: terminalTheme.spacing.lg,
    paddingTop: terminalTheme.spacing.md,
    paddingBottom: terminalTheme.spacing.sm,
    backgroundColor: terminalTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: terminalTheme.colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: terminalTheme.spacing.sm,
    padding: terminalTheme.spacing.xs,
  },
  backText: {
    fontFamily: terminalTheme.fonts.monoBold,
    fontSize: terminalTheme.fontSize.lg,
    color: terminalTheme.colors.primary,
  },
  title: {
    fontSize: terminalTheme.fontSize.lg,
  },
  prompt: {
    fontFamily: terminalTheme.fonts.monoBold,
    color: terminalTheme.colors.success,
  },
  separator: {
    fontFamily: terminalTheme.fonts.mono,
    color: terminalTheme.colors.textMuted,
  },
  command: {
    fontFamily: terminalTheme.fonts.mono,
    color: terminalTheme.colors.text,
  },
  cursor: {
    fontFamily: terminalTheme.fonts.mono,
    color: terminalTheme.colors.cursor,
  },
  subtitle: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.sm,
    color: terminalTheme.colors.textMuted,
    marginTop: terminalTheme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: terminalTheme.colors.border,
    marginTop: terminalTheme.spacing.sm,
  },
});
