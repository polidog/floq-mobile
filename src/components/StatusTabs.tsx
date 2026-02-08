import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { terminalTheme } from '../theme/terminal';
import { TaskStatus, STATUS_LABELS, STATUS_COLORS } from '../types/task';

interface Props {
  currentStatus: TaskStatus | 'all';
  onStatusChange: (status: TaskStatus | 'all') => void;
  counts: Record<TaskStatus | 'all', number>;
}

const STATUSES: (TaskStatus | 'all')[] = ['all', 'inbox', 'next', 'waiting', 'someday', 'done'];

export function StatusTabs({ currentStatus, onStatusChange, counts }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {STATUSES.map((status) => {
          const isActive = currentStatus === status;
          const label = status === 'all' ? 'ALL' : STATUS_LABELS[status];
          const color = status === 'all' ? terminalTheme.colors.text : STATUS_COLORS[status];
          const count = counts[status];

          return (
            <TouchableOpacity
              key={status}
              onPress={() => onStatusChange(status)}
              style={[styles.tab, isActive && styles.activeTab]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? color : terminalTheme.colors.textMuted },
                ]}
              >
                {label}
              </Text>
              <Text
                style={[
                  styles.count,
                  { color: isActive ? color : terminalTheme.colors.textDim },
                ]}
              >
                ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: terminalTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: terminalTheme.colors.border,
  },
  scrollContent: {
    paddingHorizontal: terminalTheme.spacing.md,
    paddingVertical: terminalTheme.spacing.sm,
    gap: terminalTheme.spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: terminalTheme.spacing.md,
    paddingVertical: terminalTheme.spacing.sm,
    borderRadius: terminalTheme.borderRadius.sm,
    marginRight: terminalTheme.spacing.xs,
  },
  activeTab: {
    backgroundColor: terminalTheme.colors.border,
  },
  tabText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.sm,
  },
  count: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    marginLeft: terminalTheme.spacing.xs,
  },
});
