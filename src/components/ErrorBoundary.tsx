import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { terminalTheme } from '../theme/terminal';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    if (__DEV__) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error } = this.state;

      return (
        <View
          style={styles.container}
          accessibilityRole="alert"
          accessibilityLabel="Application error occurred"
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>
              <Text style={styles.prompt}>floq</Text>
              <Text style={styles.separator}> {'>'} </Text>
              <Text style={styles.command}>error</Text>
              <Text style={styles.cursor}>_</Text>
            </Text>
          </View>

          <View style={styles.divider} />

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={styles.errorLabel}>FATAL ERROR</Text>
            <Text style={styles.errorMessage}>
              {error?.message ?? 'An unexpected error occurred'}
            </Text>

            {__DEV__ && error?.stack && (
              <View style={styles.stackContainer}>
                <Text style={styles.stackLabel}>STACK TRACE</Text>
                <Text style={styles.stackText} numberOfLines={15}>
                  {error.stack}
                </Text>
              </View>
            )}

            <View style={styles.hintContainer}>
              <Text style={styles.hintText}>
                The application encountered an unrecoverable error.
              </Text>
              <Text style={styles.hintText}>
                Try restarting to restore normal operation.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.resetButton}
            onPress={this.handleReset}
            accessibilityRole="button"
            accessibilityLabel="Retry and restart the application"
          >
            <Text style={styles.resetText}>{'> '}RETRY</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: terminalTheme.colors.background,
  },
  header: {
    paddingHorizontal: terminalTheme.spacing.lg,
    paddingTop: 60,
    paddingBottom: terminalTheme.spacing.md,
    backgroundColor: terminalTheme.colors.surface,
  },
  headerText: {
    fontSize: terminalTheme.fontSize.lg,
  },
  prompt: {
    fontFamily: terminalTheme.fonts.monoBold,
    color: terminalTheme.colors.error,
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
    color: terminalTheme.colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: terminalTheme.colors.error,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: terminalTheme.spacing.lg,
  },
  errorLabel: {
    fontFamily: terminalTheme.fonts.monoBold,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.error,
    marginBottom: terminalTheme.spacing.sm,
  },
  errorMessage: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.text,
    lineHeight: 22,
    marginBottom: terminalTheme.spacing.xl,
  },
  stackContainer: {
    backgroundColor: terminalTheme.colors.surface,
    borderWidth: 1,
    borderColor: terminalTheme.colors.border,
    borderRadius: terminalTheme.borderRadius.sm,
    padding: terminalTheme.spacing.md,
    marginBottom: terminalTheme.spacing.xl,
  },
  stackLabel: {
    fontFamily: terminalTheme.fonts.monoBold,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.textDim,
    marginBottom: terminalTheme.spacing.sm,
  },
  stackText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.textMuted,
    lineHeight: 18,
  },
  hintContainer: {
    borderLeftWidth: 2,
    borderLeftColor: terminalTheme.colors.warning,
    paddingLeft: terminalTheme.spacing.md,
  },
  hintText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.sm,
    color: terminalTheme.colors.textMuted,
    lineHeight: 20,
  },
  resetButton: {
    paddingHorizontal: terminalTheme.spacing.lg,
    paddingVertical: terminalTheme.spacing.lg,
    backgroundColor: terminalTheme.colors.surface,
  },
  resetText: {
    fontFamily: terminalTheme.fonts.monoBold,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.success,
  },
});
