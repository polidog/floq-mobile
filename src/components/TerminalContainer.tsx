import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { terminalTheme } from '../theme/terminal';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function TerminalContainer({ children, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: terminalTheme.colors.background,
  },
});
