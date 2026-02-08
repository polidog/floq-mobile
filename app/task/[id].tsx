import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TerminalContainer } from '../../src/components/TerminalContainer';
import { TerminalHeader } from '../../src/components/TerminalHeader';
import { ActionMenu } from '../../src/components/ActionMenu';
import { terminalTheme } from '../../src/theme/terminal';
import { Task, TaskStatus, STATUS_LABELS, STATUS_COLORS } from '../../src/types/task';
import * as db from '../../src/db/database';

const STATUS_ACTIONS = [
  { key: 'inbox', label: 'Move to INBOX', color: STATUS_COLORS.inbox },
  { key: 'next', label: 'Move to NEXT', color: STATUS_COLORS.next },
  { key: 'waiting', label: 'Move to WAITING', color: STATUS_COLORS.waiting },
  { key: 'someday', label: 'Move to SOMEDAY', color: STATUS_COLORS.someday },
  { key: 'done', label: 'Mark as DONE', color: STATUS_COLORS.done },
];

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadTask = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const tasks = await db.getTasks();
      const found = tasks.find(t => t.id === id);
      if (found) {
        setTask(found);
        setNotes(found.notes || '');
      } else {
        setError('Task not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!task) return;

    try {
      setError(null);
      await db.updateTaskStatus(task.id, newStatus as TaskStatus);
      const now = Math.floor(Date.now() / 1000);
      setTask({
        ...task,
        status: newStatus as TaskStatus,
        updatedAt: now,
        completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }, [task]);

  const handleSaveNotes = useCallback(async () => {
    if (!task) return;

    try {
      setError(null);
      await db.updateTask(task.id, { notes });
      setTask({ ...task, notes });
      setEditingNotes(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes');
    }
  }, [task, notes]);

  const handleDelete = useCallback(async () => {
    if (!task) return;

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      setError(null);
      await db.deleteTask(task.id);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      setConfirmDelete(false);
    }
  }, [task, confirmDelete, router]);

  const handleCloseStatusMenu = useCallback(() => {
    setShowStatusMenu(false);
  }, []);

  const handleOpenStatusMenu = useCallback(() => {
    setShowStatusMenu(true);
  }, []);

  const handleStartEditNotes = useCallback(() => {
    setEditingNotes(true);
  }, []);

  const handleCancelEditNotes = useCallback(() => {
    setEditingNotes(false);
    setNotes(task?.notes || '');
  }, [task]);

  if (loading) {
    return (
      <TerminalContainer>
        <SafeAreaView style={styles.safeArea}>
          <TerminalHeader title="loading" showBack onBack={handleBack} />
          <View style={styles.loadingContainer} accessibilityRole="progressbar" accessibilityLabel="Loading task">
            <Text style={styles.loadingText}>Loading task...</Text>
          </View>
        </SafeAreaView>
      </TerminalContainer>
    );
  }

  if (!task) {
    return (
      <TerminalContainer>
        <SafeAreaView style={styles.safeArea}>
          <TerminalHeader title="error" showBack onBack={handleBack} />
          <View style={styles.loadingContainer} accessibilityRole="alert">
            <Text style={styles.errorText}>{error || 'Task not found'}</Text>
          </View>
        </SafeAreaView>
      </TerminalContainer>
    );
  }

  const statusColor = STATUS_COLORS[task.status];

  return (
    <TerminalContainer>
      <SafeAreaView style={styles.safeArea}>
        <TerminalHeader
          title="task"
          subtitle={`ID: ${task.id.slice(0, 8)}...`}
          showBack
          onBack={handleBack}
        />

        {error && (
          <TouchableOpacity
            style={styles.errorBanner}
            onPress={() => setError(null)}
            accessibilityRole="alert"
            accessibilityLabel={`Error: ${error}. Tap to dismiss.`}
          >
            <Text style={styles.errorBannerText}>ERROR: {error}</Text>
            <Text style={styles.errorDismiss}>[dismiss]</Text>
          </TouchableOpacity>
        )}

        <ScrollView style={styles.content}>
          {/* Title */}
          <View style={styles.section} accessibilityRole="text" accessibilityLabel={`Task title: ${task.title}`}>
            <Text style={styles.label}>TITLE</Text>
            <Text style={styles.title}>{task.title}</Text>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.label}>STATUS</Text>
            <TouchableOpacity
              style={styles.statusButton}
              onPress={handleOpenStatusMenu}
              accessibilityRole="button"
              accessibilityLabel={`Status: ${STATUS_LABELS[task.status]}. Tap to change status.`}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[task.status]}
              </Text>
              <Text style={styles.changeHint}>[tap to change]</Text>
            </TouchableOpacity>
          </View>

          {/* Project */}
          {task.project && (
            <View style={styles.section} accessibilityRole="text" accessibilityLabel={`Project: ${task.project}`}>
              <Text style={styles.label}>PROJECT</Text>
              <Text style={styles.project}>+{task.project}</Text>
            </View>
          )}

          {/* Context */}
          {task.context && (
            <View style={styles.section} accessibilityRole="text" accessibilityLabel={`Context: ${task.context}`}>
              <Text style={styles.label}>CONTEXT</Text>
              <Text style={styles.context}>@{task.context}</Text>
            </View>
          )}

          {/* Notes */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>NOTES</Text>
              {!editingNotes && (
                <TouchableOpacity
                  onPress={handleStartEditNotes}
                  accessibilityRole="button"
                  accessibilityLabel="Edit notes"
                >
                  <Text style={styles.editButton}>[edit]</Text>
                </TouchableOpacity>
              )}
            </View>
            {editingNotes ? (
              <View>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="Add notes..."
                  placeholderTextColor={terminalTheme.colors.textDim}
                  accessibilityLabel="Notes input"
                  accessibilityHint="Enter notes for this task"
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity
                    onPress={handleCancelEditNotes}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel editing notes"
                  >
                    <Text style={styles.cancelButton}>[cancel]</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveNotes}
                    accessibilityRole="button"
                    accessibilityLabel="Save notes"
                  >
                    <Text style={styles.saveButton}>[save]</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.notes} accessibilityRole="text">
                {task.notes || '(no notes)'}
              </Text>
            )}
          </View>

          {/* Timestamps */}
          <View style={styles.section} accessibilityRole="text" accessibilityLabel={`Created at ${formatTimestamp(task.createdAt)}`}>
            <Text style={styles.label}>CREATED</Text>
            <Text style={styles.timestamp}>{formatTimestamp(task.createdAt)}</Text>
          </View>

          {task.completedAt && (
            <View style={styles.section} accessibilityRole="text" accessibilityLabel={`Completed at ${task.completedAt}`}>
              <Text style={styles.label}>COMPLETED</Text>
              <Text style={styles.timestamp}>{task.completedAt}</Text>
            </View>
          )}

          {/* Delete */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel={confirmDelete ? 'Confirm delete. Tap again to permanently delete this task.' : 'Delete task'}
          >
            <Text style={styles.deleteText}>
              {'> '}{confirmDelete ? 'CONFIRM DELETE? (tap again)' : 'DELETE TASK'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <ActionMenu
          visible={showStatusMenu}
          onClose={handleCloseStatusMenu}
          title="CHANGE STATUS"
          actions={STATUS_ACTIONS}
          onSelect={handleStatusChange}
        />
      </SafeAreaView>
    </TerminalContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.textMuted,
  },
  errorText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.error,
  },
  content: {
    flex: 1,
    padding: terminalTheme.spacing.lg,
  },
  section: {
    marginBottom: terminalTheme.spacing.xl,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.textDim,
    marginBottom: terminalTheme.spacing.xs,
  },
  title: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.lg,
    color: terminalTheme.colors.text,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: terminalTheme.spacing.sm,
  },
  statusText: {
    fontFamily: terminalTheme.fonts.monoBold,
    fontSize: terminalTheme.fontSize.md,
  },
  changeHint: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.textDim,
  },
  project: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.primary,
  },
  context: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.warning,
  },
  notes: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.textMuted,
    lineHeight: 22,
  },
  notesInput: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.text,
    backgroundColor: terminalTheme.colors.surface,
    borderWidth: 1,
    borderColor: terminalTheme.colors.border,
    borderRadius: terminalTheme.borderRadius.sm,
    padding: terminalTheme.spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: terminalTheme.spacing.md,
    marginTop: terminalTheme.spacing.sm,
  },
  editButton: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.primary,
  },
  cancelButton: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.sm,
    color: terminalTheme.colors.textMuted,
  },
  saveButton: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.sm,
    color: terminalTheme.colors.success,
  },
  timestamp: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.sm,
    color: terminalTheme.colors.textMuted,
  },
  deleteButton: {
    paddingVertical: terminalTheme.spacing.md,
    marginTop: terminalTheme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: terminalTheme.colors.border,
  },
  deleteText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.error,
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: terminalTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: terminalTheme.colors.error,
    paddingHorizontal: terminalTheme.spacing.lg,
    paddingVertical: terminalTheme.spacing.sm,
  },
  errorBannerText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.sm,
    color: terminalTheme.colors.error,
    flex: 1,
  },
  errorDismiss: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.textDim,
    marginLeft: terminalTheme.spacing.sm,
  },
});
