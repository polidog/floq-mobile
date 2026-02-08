import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { terminalTheme } from '../theme/terminal';
import { Task, STATUS_LABELS, STATUS_COLORS } from '../types/task';

interface Props {
  task: Task;
  index: number;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
}

export function TaskItem({ task, index, onPress, onLongPress, selected }: Props) {
  const statusColor = STATUS_COLORS[task.status];
  const statusLabel = STATUS_LABELS[task.status];

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.container, selected && styles.selected]}
      activeOpacity={0.7}
    >
      <Text style={styles.index}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              task.status === 'done' && styles.completed,
            ]}
            numberOfLines={1}
          >
            {task.status === 'done' ? `[x] ${task.title}` : `[ ] ${task.title}`}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={[styles.status, { color: statusColor }]}>
            {statusLabel}
          </Text>
          {task.project && (
            <Text style={styles.project}>+{task.project}</Text>
          )}
          {task.context && (
            <Text style={styles.context}>@{task.context}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: terminalTheme.spacing.md,
    paddingHorizontal: terminalTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: terminalTheme.colors.border,
    backgroundColor: terminalTheme.colors.background,
  },
  selected: {
    backgroundColor: terminalTheme.colors.selection,
  },
  index: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.sm,
    color: terminalTheme.colors.textDim,
    width: 28,
    marginRight: terminalTheme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.text,
    flex: 1,
  },
  completed: {
    color: terminalTheme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: terminalTheme.spacing.xs,
    gap: terminalTheme.spacing.sm,
  },
  status: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    textTransform: 'uppercase',
  },
  project: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.primary,
  },
  context: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.warning,
  },
});
