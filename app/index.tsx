import { useState, useMemo, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { TerminalContainer } from '../src/components/TerminalContainer';
import { TerminalHeader } from '../src/components/TerminalHeader';
import { TaskItem } from '../src/components/TaskItem';
import { CommandInput } from '../src/components/CommandInput';
import { StatusTabs } from '../src/components/StatusTabs';
import { useTasks } from '../src/hooks/useTasks';
import { terminalTheme } from '../src/theme/terminal';
import { Task, TaskStatus } from '../src/types/task';

const HELP_TEXT = `Commands:
  /add <task>  - Add new task
  /inbox       - Show inbox
  /next        - Show next actions
  /waiting     - Show waiting
  /someday     - Show someday
  /done        - Show completed
  /all         - Show all
  /settings    - Open settings`;

const TASK_ITEM_HEIGHT = 64;

const keyExtractor = (item: Task) => item.id;

const getItemLayout = (_data: ArrayLike<Task> | null | undefined, index: number) => ({
  length: TASK_ITEM_HEIGHT,
  offset: TASK_ITEM_HEIGHT * index,
  index,
});

export default function HomeScreen() {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<TaskStatus | 'all'>('all');
  const [helpVisible, setHelpVisible] = useState(false);
  const { tasks, loading, error, counts, addTask, updateStatus, removeTask, refresh, clearError } = useTasks();

  // Refresh tasks when screen comes into focus (e.g. back from detail)
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filteredTasks = useMemo(() => {
    if (currentStatus === 'all') return tasks;
    return tasks.filter(task => task.status === currentStatus);
  }, [tasks, currentStatus]);

  const handleCommand = useCallback(async (text: string) => {
    if (text.startsWith('/')) {
      const [command, ...args] = text.slice(1).split(' ');
      switch (command.toLowerCase()) {
        case 'help':
          setHelpVisible(prev => !prev);
          return;
        case 'inbox':
          setCurrentStatus('inbox');
          return;
        case 'next':
          setCurrentStatus('next');
          return;
        case 'waiting':
          setCurrentStatus('waiting');
          return;
        case 'someday':
          setCurrentStatus('someday');
          return;
        case 'done':
          setCurrentStatus('done');
          return;
        case 'all':
          setCurrentStatus('all');
          return;
        case 'settings':
          router.push('/settings');
          return;
        case 'add':
          if (args.length > 0) {
            await addTask(args.join(' '));
          }
          return;
      }
    }

    await addTask(text);
    setHelpVisible(false);
  }, [addTask, router]);

  const handleTaskPress = useCallback((taskId: string) => {
    router.push(`/task/${taskId}`);
  }, [router]);

  const handleTaskLongPress = useCallback((taskId: string, currentTaskStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentTaskStatus === 'done' ? 'inbox' : 'done';
    updateStatus(taskId, nextStatus);
  }, [updateStatus]);

  const handleSettingsPress = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const renderItem = useCallback(({ item, index }: { item: Task; index: number }) => (
    <TaskItem
      task={item}
      index={index}
      onPress={handleTaskPress}
      onLongPress={handleTaskLongPress}
    />
  ), [handleTaskPress, handleTaskLongPress]);

  const taskCount = filteredTasks.length;
  const subtitle = loading
    ? 'Loading...'
    : `${taskCount} task${taskCount !== 1 ? 's' : ''} | /help for commands`;

  return (
    <TerminalContainer>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <TerminalHeader title="tasks" subtitle={subtitle} />
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettingsPress}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Text style={styles.settingsIcon}>[*]</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <TouchableOpacity
            style={styles.errorBanner}
            onPress={clearError}
            accessibilityRole="alert"
            accessibilityLabel={`Error: ${error}. Tap to dismiss.`}
          >
            <Text style={styles.errorText}>ERROR: {error}</Text>
            <Text style={styles.errorDismiss}>[dismiss]</Text>
          </TouchableOpacity>
        )}

        <StatusTabs
          currentStatus={currentStatus}
          onStatusChange={setCurrentStatus}
          counts={counts}
        />

        {helpVisible && (
          <View style={styles.helpContainer} accessibilityRole="text" accessibilityLabel="Help: list of available commands">
            <Text style={styles.helpText}>{HELP_TEXT}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.emptyContainer} accessibilityRole="progressbar" accessibilityLabel="Loading tasks">
            <Text style={styles.emptyText}>Loading tasks...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer} accessibilityRole="text">
            <Text style={styles.emptyText}>
              {currentStatus === 'all'
                ? 'No tasks yet. Type below to add one.'
                : `No ${currentStatus} tasks.`}
            </Text>
            <Text style={styles.hintText}>
              tip: type a task and press RET to add
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            removeClippedSubviews={true}
            maxToRenderPerBatch={15}
            windowSize={10}
            initialNumToRender={10}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            accessibilityRole="list"
            accessibilityLabel={`Task list, ${taskCount} items`}
          />
        )}

        <SafeAreaView edges={['bottom']} style={styles.inputContainer}>
          <CommandInput
            onSubmit={handleCommand}
            placeholder="Add task or /command..."
          />
        </SafeAreaView>
      </SafeAreaView>
    </TerminalContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  settingsButton: {
    paddingTop: terminalTheme.spacing.md + 4,
    paddingRight: terminalTheme.spacing.lg,
    paddingLeft: terminalTheme.spacing.sm,
    backgroundColor: terminalTheme.colors.surface,
  },
  settingsIcon: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.textMuted,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: terminalTheme.spacing.xl,
  },
  emptyText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.textMuted,
    textAlign: 'center',
  },
  hintText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.sm,
    color: terminalTheme.colors.textDim,
    marginTop: terminalTheme.spacing.md,
  },
  helpContainer: {
    backgroundColor: terminalTheme.colors.surface,
    padding: terminalTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: terminalTheme.colors.border,
  },
  helpText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.sm,
    color: terminalTheme.colors.textMuted,
    lineHeight: 22,
  },
  inputContainer: {
    backgroundColor: terminalTheme.colors.surface,
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
  errorText: {
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
