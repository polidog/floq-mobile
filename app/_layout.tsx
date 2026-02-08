import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import {
  useFonts,
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { terminalTheme } from '../src/theme/terminal';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer} accessibilityRole="progressbar" accessibilityLabel="Loading application">
        <Text style={styles.loadingText}>LOADING FLOQ...</Text>
        <ActivityIndicator color={terminalTheme.colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: terminalTheme.colors.background },
            animation: 'fade',
          }}
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: terminalTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: terminalTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: terminalTheme.colors.text,
    fontSize: 14,
    letterSpacing: 2,
  },
});
