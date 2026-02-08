import { Platform } from 'react-native';

export interface TursoConfig {
  url: string;
  authToken: string;
  enabled: boolean;
}

// Web用のインメモリ設定ストレージ
let memorySettings: Record<string, string> = {};

let SQLite: typeof import('expo-sqlite') | null = null;
let settingsDb: import('expo-sqlite').SQLiteDatabase | null = null;

async function ensureSettingsDb(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (settingsDb) return;

  SQLite = await import('expo-sqlite');
  settingsDb = await SQLite.openDatabaseAsync('floq_settings.db');

  await settingsDb.execAsync(`
    CREATE TABLE IF NOT EXISTS _settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export async function getSetting(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memorySettings[key] ?? null;
  }

  await ensureSettingsDb();
  if (!settingsDb) return null;

  const row = await settingsDb.getFirstAsync<{ value: string }>(
    'SELECT value FROM _settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memorySettings[key] = value;
    return;
  }

  await ensureSettingsDb();
  if (!settingsDb) return;

  await settingsDb.runAsync(
    'INSERT OR REPLACE INTO _settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export async function deleteSetting(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    delete memorySettings[key];
    return;
  }

  await ensureSettingsDb();
  if (!settingsDb) return;

  await settingsDb.runAsync('DELETE FROM _settings WHERE key = ?', [key]);
}

export async function saveTursoConfig(url: string, authToken: string): Promise<void> {
  await setSetting('turso_url', url);
  await setSetting('turso_auth_token', authToken);
  await setSetting('turso_enabled', 'true');
}

export async function getTursoConfig(): Promise<TursoConfig | null> {
  const url = await getSetting('turso_url');
  const authToken = await getSetting('turso_auth_token');
  const enabled = await getSetting('turso_enabled');

  if (!url || !authToken) return null;

  return {
    url,
    authToken,
    enabled: enabled === 'true',
  };
}

export async function isTursoConfigured(): Promise<boolean> {
  const config = await getTursoConfig();
  return config !== null && config.enabled;
}

export async function disableTurso(): Promise<void> {
  await setSetting('turso_enabled', 'false');
}

export async function clearTursoConfig(): Promise<void> {
  await deleteSetting('turso_url');
  await deleteSetting('turso_auth_token');
  await deleteSetting('turso_enabled');
}
