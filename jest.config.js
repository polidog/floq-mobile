/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
  ],
  transform: {
    '\\.[jt]sx?$': [
      'babel-jest',
      {
        caller: {
          name: 'metro',
          bundler: 'metro',
          platform: 'ios',
        },
        configFile: require.resolve('expo/internal/babel-preset.js'),
        plugins: [
          'babel-plugin-dynamic-import-node',
        ],
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],
};
