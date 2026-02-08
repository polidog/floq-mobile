// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
  }),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(false),
  }),
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  useSegments: jest.fn().mockReturnValue([]),
  usePathname: jest.fn().mockReturnValue('/'),
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  isLoaded: jest.fn().mockReturnValue(true),
  loadAsync: jest.fn().mockResolvedValue(undefined),
  useFonts: jest.fn().mockReturnValue([true, null]),
}));

// Mock @expo-google-fonts/jetbrains-mono
jest.mock('@expo-google-fonts/jetbrains-mono', () => ({
  useFonts: jest.fn().mockReturnValue([true, null]),
  JetBrainsMono_400Regular: 'JetBrainsMono_400Regular',
  JetBrainsMono_700Bold: 'JetBrainsMono_700Bold',
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      name: 'floq',
      slug: 'floq-mobile',
    },
  },
}));
