// app.config.js - Dynamic Expo configuration
// Environment variables can be set in eas.json (env) or via EAS Secrets.
// For local development, create a .env file (not committed to git).

const IS_DEV = process.env.APP_ENV === "development";
const IS_PREVIEW = process.env.APP_ENV === "preview";

const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? "YOUR_PROJECT_ID";

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: IS_DEV ? "floq (Dev)" : IS_PREVIEW ? "floq (Preview)" : "floq",
  slug: "floq-mobile",
  version: "1.0.0",
  owner: "polidog",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  scheme: "floq",
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    fallbackToCacheTimeout: 3000,
    checkAutomatically: "ON_LOAD",
  },
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0d1117",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.polidog.floq",
    buildNumber: "1",
    infoPlist: {
      NSCameraUsageDescription:
        "This app does not use the camera.",
      NSPhotoLibraryUsageDescription:
        "This app does not access the photo library.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0d1117",
    },
    edgeToEdgeEnabled: true,
    package: "com.polidog.floq",
    versionCode: 1,
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-sqlite",
      {
        enableFTS: true,
        useLibSQL: true,
      },
    ],
    "expo-updates",
  ],
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
    router: {
      origin: false,
    },
  },
};

export default { expo: config };
