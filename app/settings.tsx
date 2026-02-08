import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TerminalContainer } from '../src/components/TerminalContainer';
import { TerminalHeader } from '../src/components/TerminalHeader';
import { terminalTheme } from '../src/theme/terminal';
import { getTursoConfig, saveTursoConfig, disableTurso, clearTursoConfig, TursoConfig } from '../src/db/settings';
import { reinitializeDatabase, syncDatabase } from '../src/db/database';

export default function SettingsScreen() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [currentConfig, setCurrentConfig] = useState<TursoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const config = await getTursoConfig();
      setCurrentConfig(config);
      if (config) {
        setUrl(config.url);
        setAuthToken(config.authToken);
      }
    } catch (err) {
      setMessage({ text: 'Failed to load settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleTest = useCallback(async () => {
    if (!url.trim() || !authToken.trim()) {
      setMessage({ text: 'URL and Auth Token are required', type: 'error' });
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      const response = await fetch(url.trim(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            { type: 'execute', stmt: { sql: 'SELECT 1' } },
            { type: 'close' },
          ],
        }),
      });

      if (response.ok) {
        setMessage({ text: 'Connection successful!', type: 'success' });
      } else {
        setMessage({ text: `Connection failed: HTTP ${response.status}`, type: 'error' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessage({ text: `Connection failed: ${msg}`, type: 'error' });
    } finally {
      setTesting(false);
    }
  }, [url, authToken]);

  const handleSave = useCallback(async () => {
    if (!url.trim() || !authToken.trim()) {
      setMessage({ text: 'URL and Auth Token are required', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await saveTursoConfig(url.trim(), authToken.trim());
      await reinitializeDatabase();
      await syncDatabase();
      const config = await getTursoConfig();
      setCurrentConfig(config);
      setMessage({ text: 'Turso configuration saved and enabled', type: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessage({ text: `Failed to save: ${msg}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [url, authToken]);

  const handleDisable = useCallback(async () => {
    try {
      setMessage(null);
      await disableTurso();
      await reinitializeDatabase();
      const config = await getTursoConfig();
      setCurrentConfig(config);
      setMessage({ text: 'Turso disabled. Using local SQLite.', type: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessage({ text: `Failed to disable: ${msg}`, type: 'error' });
    }
  }, []);

  const handleClear = useCallback(async () => {
    try {
      setMessage(null);
      await clearTursoConfig();
      await reinitializeDatabase();
      setUrl('');
      setAuthToken('');
      setCurrentConfig(null);
      setMessage({ text: 'Turso configuration cleared', type: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessage({ text: `Failed to clear: ${msg}`, type: 'error' });
    }
  }, []);

  if (loading) {
    return (
      <TerminalContainer>
        <SafeAreaView style={styles.safeArea}>
          <TerminalHeader title="settings" showBack onBack={handleBack} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={terminalTheme.colors.primary} />
          </View>
        </SafeAreaView>
      </TerminalContainer>
    );
  }

  const isConfigured = currentConfig !== null;
  const isEnabled = currentConfig?.enabled === true;

  return (
    <TerminalContainer>
      <SafeAreaView style={styles.safeArea}>
        <TerminalHeader
          title="settings"
          subtitle="Turso Database Configuration"
          showBack
          onBack={handleBack}
        />

        <ScrollView style={styles.content}>
          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.label}>STATUS</Text>
            <Text style={[styles.statusValue, { color: isEnabled ? terminalTheme.colors.success : terminalTheme.colors.textMuted }]}>
              {isEnabled ? 'CONNECTED (Turso)' : isConfigured ? 'DISABLED (Local SQLite)' : 'NOT CONFIGURED (Local SQLite)'}
            </Text>
          </View>

          {/* Message */}
          {message && (
            <View style={[styles.messageBanner, message.type === 'error' ? styles.errorBanner : styles.successBanner]}>
              <Text style={[styles.messageText, { color: message.type === 'error' ? terminalTheme.colors.error : terminalTheme.colors.success }]}>
                {message.text}
              </Text>
            </View>
          )}

          {/* URL */}
          <View style={styles.section}>
            <Text style={styles.label}>TURSO DATABASE URL</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="libsql://your-db.turso.io"
              placeholderTextColor={terminalTheme.colors.textDim}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Turso database URL"
            />
          </View>

          {/* Auth Token */}
          <View style={styles.section}>
            <Text style={styles.label}>AUTH TOKEN</Text>
            <TextInput
              style={styles.input}
              value={authToken}
              onChangeText={setAuthToken}
              placeholder="eyJ..."
              placeholderTextColor={terminalTheme.colors.textDim}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Turso auth token"
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.testButton]}
              onPress={handleTest}
              disabled={testing || saving}
              accessibilityRole="button"
              accessibilityLabel="Test connection"
            >
              <Text style={styles.actionButtonText}>
                {testing ? '> TESTING...' : '> TEST CONNECTION'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={testing || saving}
              accessibilityRole="button"
              accessibilityLabel="Save and enable Turso"
            >
              <Text style={styles.saveButtonText}>
                {saving ? '> SAVING...' : '> SAVE & ENABLE'}
              </Text>
            </TouchableOpacity>

            {isEnabled && (
              <TouchableOpacity
                style={[styles.actionButton, styles.disableButton]}
                onPress={handleDisable}
                disabled={testing || saving}
                accessibilityRole="button"
                accessibilityLabel="Disable Turso and use local SQLite"
              >
                <Text style={styles.disableButtonText}>{'> DISABLE TURSO'}</Text>
              </TouchableOpacity>
            )}

            {isConfigured && (
              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                onPress={handleClear}
                disabled={testing || saving}
                accessibilityRole="button"
                accessibilityLabel="Clear Turso configuration"
              >
                <Text style={styles.clearButtonText}>{'> CLEAR CONFIGURATION'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
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
  content: {
    flex: 1,
    padding: terminalTheme.spacing.lg,
  },
  section: {
    marginBottom: terminalTheme.spacing.xl,
  },
  label: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.xs,
    color: terminalTheme.colors.textDim,
    marginBottom: terminalTheme.spacing.xs,
  },
  statusValue: {
    fontFamily: terminalTheme.fonts.monoBold,
    fontSize: terminalTheme.fontSize.md,
  },
  input: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.text,
    backgroundColor: terminalTheme.colors.surface,
    borderWidth: 1,
    borderColor: terminalTheme.colors.border,
    borderRadius: terminalTheme.borderRadius.sm,
    padding: terminalTheme.spacing.md,
  },
  messageBanner: {
    padding: terminalTheme.spacing.md,
    marginBottom: terminalTheme.spacing.xl,
    borderWidth: 1,
    borderRadius: terminalTheme.borderRadius.sm,
  },
  errorBanner: {
    borderColor: terminalTheme.colors.error,
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
  },
  successBanner: {
    borderColor: terminalTheme.colors.success,
    backgroundColor: 'rgba(63, 185, 80, 0.1)',
  },
  messageText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.sm,
  },
  actions: {
    gap: terminalTheme.spacing.md,
  },
  actionButton: {
    paddingVertical: terminalTheme.spacing.md,
    paddingHorizontal: terminalTheme.spacing.lg,
    borderWidth: 1,
    borderRadius: terminalTheme.borderRadius.sm,
  },
  testButton: {
    borderColor: terminalTheme.colors.primary,
  },
  actionButtonText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.primary,
  },
  saveButton: {
    borderColor: terminalTheme.colors.success,
  },
  saveButtonText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.success,
  },
  disableButton: {
    borderColor: terminalTheme.colors.warning,
  },
  disableButtonText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.warning,
  },
  clearButton: {
    borderColor: terminalTheme.colors.error,
  },
  clearButtonText: {
    fontFamily: terminalTheme.fonts.mono,
    fontSize: terminalTheme.fontSize.md,
    color: terminalTheme.colors.error,
  },
});
