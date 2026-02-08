import { useState, useMemo, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { TerminalContainer } from '../src/components/TerminalContainer';
import { TerminalHeader } from '../src/components/TerminalHeader';
import { TaskItem } from '../src/components/TaskItem';
import { CommandInput } from '../src/components/CommandInput';
import { StatusTabs } from '../src/components/StatusTabs';
import { useTasks } from '../src/hooks/useTasks';
import { terminalTheme } from '../src/theme/terminal';
import { TaskStatus } from '../src/types/task';

const HELP_TEXT = `Commands:
  /add <task>  - Add new task
  /inbox       - Show inbox
  /next        - Show next actions
  /waiting     - Show waiting
  /someday     - Show someday
  /done        - Show completed
  /all         - Show all`;

export default function HomeScreen() {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<TaskStatus | 'all'>('all');
  const [helpVisible, setHelpVisible] = useState(false);
  const { tasks, loading, counts, addTask, updateStatus, removeTask, refresh } = useTasks();

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

  const handleCommand = async (text: string) => {
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
        case 'add':
          if (args.length > 0) {
            await addTask(args.join(' '));
          }
          return;
      }
    }

    await addTask(text);
    setHelpVisible(false);
  };

  const handleTaskPress = (taskId: number) => {
    router.push(`/task/${taskId}`);
  };

  const handleTaskLongPress = (taskId: number, currentTaskStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentTaskStatus === 'done' ? 'inbox' : 'done';
    updateStatus(taskId, nextStatus);
  };

  const taskCount = filteredTasks.length;
  const subtitle = loading
    ? 'Loading...'
    : `${taskCount} task${taskCount !== 1 ? 's' : ''} | /help for commands`;

  return (
    <TerminalContainer>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TerminalHeader title="tasks" subtitle={subtitle} />

        <StatusTabs
          currentStatus={currentStatus}
          onStatusChange={setCurrentStatus}
          counts={counts}
        />

        {helpVisible && (
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>{HELP_TEXT}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading tasks...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
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
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <TaskItem
                task={item}
                index={index}
                onPress={() => handleTaskPress(item.id)}
                onLongPress={() => handleTaskLongPress(item.id, item.status)}
              />
            )}
            style={styles.list}
            contentContainerStyle={styles.listContent}
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
});
