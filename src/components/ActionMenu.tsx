import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { terminalTheme } from '../theme/terminal';

interface ActionItem {
  key: string;
  label: string;
  color?: string;
  destructive?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  actions: ActionItem[];
  onSelect: (key: string) => void;
}

export function ActionMenu({ visible, onClose, title, actions, onSelect }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.divider} />
          </View>

          {actions.map((action, index) => (
            <TouchableOpacity
              key={action.key}
              style={[
                styles.action,
                index === actions.length - 1 && styles.lastAction,
              ]}
              onPress={() => {
                onSelect(action.key);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.actionText,
                  action.color && { color: action.color },
                  action.destructive && styles.destructive,
                ]}
              >
                {'> '}{action.label}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.divider} />
          <TouchableOpacity style={styles.cancelAction} onPress={onClose}>
            <Text style={styles.cancelText}>{'< '}CANCEL</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: terminalTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: terminalTheme.colors.border,
    paddingBottom: 34,
  },
  header: {
    paddingHorizontal: terminalTheme.spacing.lg,
    paddingTop: terminalTheme.spacing.lg,
  },
  title: {
    fontFamily: terminalTheme.fonts.monoBold,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: terminalTheme.colors.border,
    marginTop: terminalTheme.spacing.md,
  },
  action: {
    paddingHorizontal: terminalTheme.spacing.lg,
    paddingVertical: terminalTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: terminalTheme.colors.border,
  },
  lastAction: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.text,
  },
  destructive: {
    color: terminalTheme.colors.error,
  },
  cancelAction: {
    paddingHorizontal: terminalTheme.spacing.lg,
    paddingVertical: terminalTheme.spacing.md,
  },
  cancelText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.textMuted,
  },
});
