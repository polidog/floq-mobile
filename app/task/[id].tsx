import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TerminalContainer } from '../../src/components/TerminalContainer';
import { TerminalHeader } from '../../src/components/TerminalHeader';
import { ActionMenu } from '../../src/components/ActionMenu';
import { terminalTheme } from '../../src/theme/terminal';
import { Task, TaskStatus, STATUS_LABELS, STATUS_COLORS, Comment, EffortSize, EFFORT_LABELS } from '../../src/types/task';
import * as db from '../../src/db/database';

const STATUS_ACTIONS = [
  { key: 'inbox', label: 'Move to INBOX', color: STATUS_COLORS.inbox },
  { key: 'next', label: 'Move to NEXT', color: STATUS_COLORS.next },
  { key: 'waiting', label: 'Move to WAITING', color: STATUS_COLORS.waiting },
  { key: 'someday', label: 'Move to SOMEDAY', color: STATUS_COLORS.someday },
  { key: 'done', label: 'Mark as DONE', color: STATUS_COLORS.done },
];

const EFFORT_ACTIONS = [
  { key: 'small', label: 'Small (S)', color: terminalTheme.colors.success },
  { key: 'medium', label: 'Medium (M)', color: terminalTheme.colors.warning },
  { key: 'large', label: 'Large (L)', color: terminalTheme.colors.error },
  { key: 'clear', label: 'Clear', color: terminalTheme.colors.textMuted },
];

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString();
}

function parseDateInput(input: string): number | null {
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  if (isNaN(date.getTime())) return null;
  return Math.floor(date.getTime() / 1000);
}

function isDueDateOverdue(ts: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const todayStart = now - (now % 86400);
  return ts < todayStart;
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showEffortMenu, setShowEffortMenu] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  // Editable fields
  const [editingWaitingFor, setEditingWaitingFor] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState('');
  const [editingProject, setEditingProject] = useState(false);
  const [projectInput, setProjectInput] = useState('');
  const [editingContext, setEditingContext] = useState(false);
  const [contextInput, setContextInput] = useState('');
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [dueDateInput, setDueDateInput] = useState('');

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
        const taskComments = await db.getComments(id);
        setComments(taskComments);
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

  // Focus toggle
  const handleToggleFocus = useCallback(async () => {
    if (!task) return;
    try {
      setError(null);
      const newFocused = !task.isFocused;
      await db.updateTask(task.id, { isFocused: newFocused });
      setTask({ ...task, isFocused: newFocused });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update focus');
    }
  }, [task]);

  // Effort
  const handleEffortChange = useCallback(async (key: string) => {
    if (!task) return;
    try {
      setError(null);
      const effort = key === 'clear' ? undefined : key as EffortSize;
      await db.updateTask(task.id, { effort });
      setTask({ ...task, effort });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update effort');
    }
  }, [task]);

  // Comments
  const handleAddComment = useCallback(async () => {
    if (!task || !newComment.trim()) return;
    try {
      setError(null);
      const comment = await db.addComment(task.id, newComment);
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      db.syncDatabase().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    }
  }, [task, newComment]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      setError(null);
      await db.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      db.syncDatabase().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  }, []);

  // Waiting For
  const handleSaveWaitingFor = useCallback(async () => {
    if (!task) return;
    try {
      setError(null);
      const waitingFor = waitingForInput.trim() || undefined;
      await db.updateTask(task.id, { waitingFor });
      setTask({ ...task, waitingFor });
      setEditingWaitingFor(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update waiting for');
    }
  }, [task, waitingForInput]);

  // Project
  const handleSaveProject = useCallback(async () => {
    if (!task) return;
    try {
      setError(null);
      const project = projectInput.trim() || undefined;
      await db.updateTask(task.id, { project });
      setTask({ ...task, project });
      setEditingProject(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    }
  }, [task, projectInput]);

  // Context
  const handleSaveContext = useCallback(async () => {
    if (!task) return;
    try {
      setError(null);
      const context = contextInput.trim() || undefined;
      await db.updateTask(task.id, { context });
      setTask({ ...task, context });
      setEditingContext(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update context');
    }
  }, [task, contextInput]);

  // Due Date
  const handleSaveDueDate = useCallback(async () => {
    if (!task) return;
    try {
      setError(null);
      const dueDate = parseDateInput(dueDateInput.trim());
      if (dueDateInput.trim() && dueDate === null) {
        setError('Invalid date format. Use YYYY-MM-DD');
        return;
      }
      await db.updateTask(task.id, { dueDate: dueDate ?? undefined });
      setTask({ ...task, dueDate: dueDate ?? undefined });
      setEditingDueDate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update due date');
    }
  }, [task, dueDateInput]);

  const handleClearDueDate = useCallback(async () => {
    if (!task) return;
    try {
      setError(null);
      await db.updateTask(task.id, { dueDate: undefined });
      setTask({ ...task, dueDate: undefined });
      setEditingDueDate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear due date');
    }
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
          {/* Title + Focus */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>TITLE</Text>
              <TouchableOpacity
                onPress={handleToggleFocus}
                accessibilityRole="button"
                accessibilityLabel={task.isFocused ? 'Remove focus' : 'Set focus'}
              >
                <Text style={[styles.focusButton, task.isFocused && styles.focusActive]}>
                  {task.isFocused ? '[★ focused]' : '[☆ focus]'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>
              {task.isFocused ? '★ ' : ''}{task.title}
            </Text>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.label}>STATUS</Text>
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => setShowStatusMenu(true)}
              accessibilityRole="button"
              accessibilityLabel={`Status: ${STATUS_LABELS[task.status]}. Tap to change status.`}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[task.status]}
              </Text>
              <Text style={styles.changeHint}>[tap to change]</Text>
            </TouchableOpacity>
          </View>

          {/* Waiting For (shown when status is waiting) */}
          {task.status === 'waiting' && (
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>WAITING FOR</Text>
                {!editingWaitingFor && (
                  <TouchableOpacity
                    onPress={() => { setWaitingForInput(task.waitingFor || ''); setEditingWaitingFor(true); }}
                    accessibilityRole="button"
                    accessibilityLabel="Edit waiting for"
                  >
                    <Text style={styles.editButton}>[edit]</Text>
                  </TouchableOpacity>
                )}
              </View>
              {editingWaitingFor ? (
                <View>
                  <TextInput
                    style={styles.fieldInput}
                    value={waitingForInput}
                    onChangeText={setWaitingForInput}
                    placeholder="Who are you waiting for?"
                    placeholderTextColor={terminalTheme.colors.textDim}
                    autoFocus
                  />
                  <View style={styles.notesActions}>
                    <TouchableOpacity onPress={() => setEditingWaitingFor(false)}>
                      <Text style={styles.cancelButton}>[cancel]</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveWaitingFor}>
                      <Text style={styles.saveButton}>[save]</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={[styles.fieldValue, { color: terminalTheme.colors.warning }]}>
                  {task.waitingFor ? `→ ${task.waitingFor}` : '(not set)'}
                </Text>
              )}
            </View>
          )}

          {/* Effort */}
          <View style={styles.section}>
            <Text style={styles.label}>EFFORT</Text>
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => setShowEffortMenu(true)}
              accessibilityRole="button"
              accessibilityLabel={`Effort: ${task.effort ? EFFORT_LABELS[task.effort] : 'not set'}. Tap to change.`}
            >
              {task.effort ? (
                <Text style={[styles.effortBadge, {
                  color: task.effort === 'small' ? terminalTheme.colors.success
                    : task.effort === 'medium' ? terminalTheme.colors.warning
                    : terminalTheme.colors.error,
                }]}>
                  [{EFFORT_LABELS[task.effort]}]
                </Text>
              ) : (
                <Text style={styles.fieldValueMuted}>(not set)</Text>
              )}
              <Text style={styles.changeHint}>[tap to change]</Text>
            </TouchableOpacity>
          </View>

          {/* Project */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>PROJECT</Text>
              {!editingProject && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => { setProjectInput(task.project || ''); setEditingProject(true); }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.editButton}>[edit]</Text>
                  </TouchableOpacity>
                  {task.project && (
                    <TouchableOpacity
                      onPress={async () => {
                        await db.updateTask(task.id, { project: undefined });
                        setTask({ ...task, project: undefined });
                      }}
                    >
                      <Text style={styles.clearButton}>[clear]</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            {editingProject ? (
              <View>
                <TextInput
                  style={styles.fieldInput}
                  value={projectInput}
                  onChangeText={setProjectInput}
                  placeholder="Project name"
                  placeholderTextColor={terminalTheme.colors.textDim}
                  autoFocus
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity onPress={() => setEditingProject(false)}>
                    <Text style={styles.cancelButton}>[cancel]</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveProject}>
                    <Text style={styles.saveButton}>[save]</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.project}>
                {task.project ? `+${task.project}` : '(not set)'}
              </Text>
            )}
          </View>

          {/* Context */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>CONTEXT</Text>
              {!editingContext && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => { setContextInput(task.context || ''); setEditingContext(true); }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.editButton}>[edit]</Text>
                  </TouchableOpacity>
                  {task.context && (
                    <TouchableOpacity
                      onPress={async () => {
                        await db.updateTask(task.id, { context: undefined });
                        setTask({ ...task, context: undefined });
                      }}
                    >
                      <Text style={styles.clearButton}>[clear]</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            {editingContext ? (
              <View>
                <TextInput
                  style={styles.fieldInput}
                  value={contextInput}
                  onChangeText={setContextInput}
                  placeholder="Context (e.g. work, home)"
                  placeholderTextColor={terminalTheme.colors.textDim}
                  autoFocus
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity onPress={() => setEditingContext(false)}>
                    <Text style={styles.cancelButton}>[cancel]</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveContext}>
                    <Text style={styles.saveButton}>[save]</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.context}>
                {task.context ? `@${task.context}` : '(not set)'}
              </Text>
            )}
          </View>

          {/* Due Date */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>DUE DATE</Text>
              {!editingDueDate && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setDueDateInput(task.dueDate ? new Date(task.dueDate * 1000).toISOString().slice(0, 10) : '');
                      setEditingDueDate(true);
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.editButton}>[edit]</Text>
                  </TouchableOpacity>
                  {task.dueDate && (
                    <TouchableOpacity onPress={handleClearDueDate}>
                      <Text style={styles.clearButton}>[clear]</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            {editingDueDate ? (
              <View>
                <TextInput
                  style={styles.fieldInput}
                  value={dueDateInput}
                  onChangeText={setDueDateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={terminalTheme.colors.textDim}
                  autoFocus
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity onPress={() => setEditingDueDate(false)}>
                    <Text style={styles.cancelButton}>[cancel]</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveDueDate}>
                    <Text style={styles.saveButton}>[save]</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={[
                styles.fieldValue,
                task.dueDate && isDueDateOverdue(task.dueDate) && { color: terminalTheme.colors.error },
              ]}>
                {task.dueDate ? formatDate(task.dueDate) : '(not set)'}
                {task.dueDate && isDueDateOverdue(task.dueDate) ? ' (overdue)' : ''}
              </Text>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>NOTES</Text>
              {!editingNotes && (
                <TouchableOpacity
                  onPress={() => setEditingNotes(true)}
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
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity
                    onPress={() => { setEditingNotes(false); setNotes(task.notes || ''); }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.cancelButton}>[cancel]</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveNotes} accessibilityRole="button">
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

          {/* Comments */}
          <View style={styles.section}>
            <Text style={styles.label}>COMMENTS ({comments.length})</Text>
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add comment..."
                placeholderTextColor={terminalTheme.colors.textDim}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                accessibilityRole="button"
                accessibilityLabel="Add comment"
              >
                <Text style={[styles.saveButton, !newComment.trim() && { color: terminalTheme.colors.textDim }]}>[add]</Text>
              </TouchableOpacity>
            </View>
            {comments.length === 0 ? (
              <Text style={styles.fieldValueMuted}>(no comments)</Text>
            ) : (
              comments.map(comment => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentContent}>
                    <Text style={styles.commentText}>{comment.content}</Text>
                    <Text style={styles.commentTimestamp}>{formatTimestamp(comment.createdAt)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteComment(comment.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete comment"
                  >
                    <Text style={styles.commentDelete}>[x]</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Timestamps */}
          <View style={styles.section} accessibilityRole="text">
            <Text style={styles.label}>CREATED</Text>
            <Text style={styles.timestamp}>{formatTimestamp(task.createdAt)}</Text>
          </View>

          {task.completedAt && (
            <View style={styles.section} accessibilityRole="text">
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
          onClose={() => setShowStatusMenu(false)}
          title="CHANGE STATUS"
          actions={STATUS_ACTIONS}
          onSelect={handleStatusChange}
        />

        <ActionMenu
          visible={showEffortMenu}
          onClose={() => setShowEffortMenu(false)}
          title="SET EFFORT"
          actions={EFFORT_ACTIONS}
          onSelect={handleEffortChange}
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
  actionRow: {
    flexDirection: 'row',
    gap: terminalTheme.spacing.sm,
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
  focusButton: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.textDim,
  },
  focusActive: {
    color: terminalTheme.colors.warning,
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
  effortBadge: {
    fontFamily: terminalTheme.fonts.monoBold,
    fontSize: terminalTheme.fontSize.md,
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
  fieldValue: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.text,
  },
  fieldValueMuted: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.textMuted,
  },
  fieldInput: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.text,
    backgroundColor: terminalTheme.colors.surface,
    borderWidth: 1,
    borderColor: terminalTheme.colors.border,
    borderRadius: terminalTheme.borderRadius.sm,
    padding: terminalTheme.spacing.md,
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
  clearButton: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.error,
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
  // Comments
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: terminalTheme.spacing.sm,
    marginBottom: terminalTheme.spacing.sm,
  },
  commentInput: {
    flex: 1,
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.sm,
    color: terminalTheme.colors.text,
    backgroundColor: terminalTheme.colors.surface,
    borderWidth: 1,
    borderColor: terminalTheme.colors.border,
    borderRadius: terminalTheme.borderRadius.sm,
    padding: terminalTheme.spacing.sm,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: terminalTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: terminalTheme.colors.border,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.sm,
    color: terminalTheme.colors.text,
  },
  commentTimestamp: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.textDim,
    marginTop: 2,
  },
  commentDelete: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.error,
    paddingLeft: terminalTheme.spacing.sm,
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
