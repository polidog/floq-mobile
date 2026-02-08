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

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadTask = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const tasks = await db.getTasks();
      const found = tasks.find(t => t.id === parseInt(id, 10));
      if (found) {
        setTask(found);
        setNotes(found.notes || '');
      }
    } catch (_err) {
      // task not found
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;

    try {
      await db.updateTaskStatus(task.id, newStatus as TaskStatus);
      setTask({
        ...task,
        status: newStatus as TaskStatus,
        updatedAt: new Date().toISOString(),
        completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
      });
    } catch (_err) {
      // failed to update
    }
  };

  const handleSaveNotes = async () => {
    if (!task) return;

    try {
      await db.updateTask(task.id, { notes });
      setTask({ ...task, notes });
      setEditingNotes(false);
    } catch (_err) {
      // failed to save
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      await db.deleteTask(task.id);
      router.back();
    } catch (_err) {
      // failed to delete
    }
  };

  if (loading) {
    return (
      <TerminalContainer>
        <SafeAreaView style={styles.safeArea}>
          <TerminalHeader title="loading" showBack onBack={() => router.back()} />
          <View style={styles.loadingContainer}>
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
          <TerminalHeader title="error" showBack onBack={() => router.back()} />
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>Task not found</Text>
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
          subtitle={`ID: ${task.id}`}
          showBack
          onBack={() => router.back()}
        />

        <ScrollView style={styles.content}>
          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>TITLE</Text>
            <Text style={styles.title}>{task.title}</Text>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.label}>STATUS</Text>
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => setShowStatusMenu(true)}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[task.status]}
              </Text>
              <Text style={styles.changeHint}>[tap to change]</Text>
            </TouchableOpacity>
          </View>

          {/* Project */}
          {task.project && (
            <View style={styles.section}>
              <Text style={styles.label}>PROJECT</Text>
              <Text style={styles.project}>+{task.project}</Text>
            </View>
          )}

          {/* Context */}
          {task.context && (
            <View style={styles.section}>
              <Text style={styles.label}>CONTEXT</Text>
              <Text style={styles.context}>@{task.context}</Text>
            </View>
          )}

          {/* Notes */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>NOTES</Text>
              {!editingNotes && (
                <TouchableOpacity onPress={() => setEditingNotes(true)}>
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
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity onPress={() => { setEditingNotes(false); setNotes(task.notes || ''); }}>
                    <Text style={styles.cancelButton}>[cancel]</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveNotes}>
                    <Text style={styles.saveButton}>[save]</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.notes}>
                {task.notes || '(no notes)'}
              </Text>
            )}
          </View>

          {/* Timestamps */}
          <View style={styles.section}>
            <Text style={styles.label}>CREATED</Text>
            <Text style={styles.timestamp}>{task.createdAt}</Text>
          </View>

          {task.completedAt && (
            <View style={styles.section}>
              <Text style={styles.label}>COMPLETED</Text>
              <Text style={styles.timestamp}>{task.completedAt}</Text>
            </View>
          )}

          {/* Delete */}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>
              {'> '}{confirmDelete ? 'CONFIRM DELETE? (tap again)' : 'DELETE TASK'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <ActionMenu
          visible={showStatusMenu}
          onClose={() => setShowStatusMenu(false)}
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
});
