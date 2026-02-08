# floq - Store Submission Guide

## App Information

| Item | Value |
|------|-------|
| App Name | floq |
| Bundle ID (iOS) | com.polidog.floq |
| Package Name (Android) | com.polidog.floq |
| Category | Productivity |
| Primary Language | Japanese |

---

## App Description

### Japanese (Primary)

**Short Description (80 characters max / Google Play)**

Terminal style GTD task manager. Organize tasks simply and boost productivity.

**Full Description**

floqは、ターミナルスタイルのUIを採用したGTD（Getting Things Done）タスク管理アプリです。

特徴:
- ターミナル風のミニマルなデザイン
- GTDメソッドに基づくタスク管理（Inbox / Next / Waiting / Someday / Done）
- JetBrains Monoフォントによる視認性の高い表示
- オフライン対応（ローカルSQLiteデータベース）
- ダークモード専用のフォーカスしやすいUI

シンプルでありながら強力なタスク管理を、あなたの手の中に。

### English

**Short Description (80 characters max / Google Play)**

Terminal-style GTD task manager. Organize tasks simply and boost productivity.

**Full Description**

floq is a GTD (Getting Things Done) task management app with a terminal-style UI.

Features:
- Minimal terminal-inspired design
- GTD-based task management (Inbox / Next / Waiting / Someday / Done)
- High-readability display with JetBrains Mono font
- Offline support (local SQLite database)
- Dark mode only UI for focused work

Simple yet powerful task management, right in your hands.

---

## Screenshots Requirements

### iOS (Required Sizes)

| Device | Resolution | Display Size |
|--------|-----------|-------------|
| iPhone 16 Pro Max | 1320 x 2868 px | 6.7" |
| iPhone 16 Pro | 1206 x 2622 px | 6.3" |
| iPhone 14 | 1170 x 2532 px | 6.1" (if supporting iOS < 18) |
| iPad Pro (6th gen, 12.9") | 2048 x 2732 px | 12.9" |
| iPad Pro (M4, 13") | 2064 x 2752 px | 13" (if targeting latest) |

**Recommended Screenshots (5-10 per device size):**
1. Inbox view with tasks
2. Task detail / edit screen
3. GTD category switching (Next / Waiting / Someday)
4. Completed tasks view
5. Empty state / onboarding

### Android (Required Sizes)

| Device Type | Resolution | Notes |
|------------|-----------|-------|
| Phone | 1080 x 1920 px (min) | 16:9 aspect ratio recommended |
| Phone | 1080 x 2400 px | Tall phone ratio |
| 7" Tablet | 1200 x 1920 px | If supporting tablets |
| 10" Tablet | 1920 x 1200 px | If supporting tablets |

**Google Play Screenshot Requirements:**
- Minimum: 2 screenshots per device type
- Maximum: 8 screenshots per device type
- Format: JPEG or PNG (24-bit, no alpha)
- Minimum dimension: 320 px
- Maximum dimension: 3840 px

---

## Feature Graphic (Android / Google Play)

- Size: 1024 x 500 px
- Format: JPEG or PNG (24-bit, no alpha)
- Required for Google Play Store listing

---

## App Icon

| Platform | Size | Notes |
|----------|------|-------|
| iOS | 1024 x 1024 px | No transparency, no rounded corners (iOS adds them) |
| Android | 512 x 512 px | Adaptive icon (foreground + background) |
| Google Play | 512 x 512 px | High-res icon for store listing |

---

## Privacy Policy

A privacy policy URL is **required** for both App Store and Google Play.

### What to Include:
- What data the app collects (floq: task data stored locally only)
- How data is stored (locally on device via SQLite)
- Third-party services used (Expo Updates for OTA updates)
- Contact information
- Data retention and deletion policy

### Recommendation:
- Host a simple privacy policy page on GitHub Pages or a personal website
- URL format: `https://polidog.github.io/floq-privacy-policy/`
- The policy must be publicly accessible (not behind auth)

---

## Age Rating / Content Rating

### iOS (App Store)
- Recommended: **4+** (Ages 4 and older)
- No objectionable content
- No user-generated content shared between users
- No internet-based features requiring age gating
- Self-rate via App Store Connect questionnaire

### Android (Google Play)
- Complete the **IARC content rating questionnaire** in Google Play Console
- Expected result: **Everyone (PEGI 3 / ESRB Everyone)**
- No violence, no mature content, no user-to-user interaction
- No ads

---

## Pre-Submission Checklist

### Both Platforms
- [ ] App icon is set and meets size requirements
- [ ] Splash screen is configured
- [ ] Privacy policy URL is live and accessible
- [ ] App description is written in both Japanese and English
- [ ] Screenshots are captured for all required device sizes
- [ ] expo-updates is installed and configured
- [ ] `EAS_PROJECT_ID` is set (replace `YOUR_PROJECT_ID`)
- [ ] Production build tested on physical device

### iOS Specific
- [ ] Apple Developer Program membership is active ($99/year)
- [ ] App Store Connect app record is created
- [ ] `ascAppId` in eas.json is set (replace `YOUR_APP_STORE_CONNECT_APP_ID`)
- [ ] `appleTeamId` in eas.json is set (replace `YOUR_APPLE_TEAM_ID`)
- [ ] Content rating questionnaire completed
- [ ] Export compliance (uses encryption: No, unless using HTTPS only)
- [ ] App Review information provided (demo account if needed)

### Android Specific
- [ ] Google Play Developer account is active ($25 one-time)
- [ ] Google Play Console app is created
- [ ] `google-service-account-key.json` is configured for EAS Submit
- [ ] Content rating questionnaire (IARC) completed
- [ ] Target API level meets current Google Play requirements
- [ ] Data safety section completed in Google Play Console
- [ ] Feature graphic (1024 x 500) is uploaded

---

## Build & Submit Commands

```bash
# Production build
npm run build:ios          # eas build --profile production --platform ios
npm run build:android      # eas build --profile production --platform android

# Submit to stores
npm run submit:ios         # eas submit --profile production --platform ios
npm run submit:android     # eas submit --profile production --platform android

# OTA updates (after initial store release)
npm run update:production  # eas update --channel production
```

---

## Important Notes

1. **First submission takes longer**: Apple review typically takes 24-48 hours for first submission.
   Google Play review typically takes a few hours to a few days.

2. **EAS Project ID**: Run `eas init` to generate a project ID, then update `EAS_PROJECT_ID`
   in eas.json env sections and as an EAS Secret.

3. **Versioning**: Version is managed remotely via EAS (`appVersionSource: "remote"` in eas.json).
   Use `eas build:version:set` to manage versions.

4. **OTA Updates**: After the initial store release, JavaScript-only changes can be pushed
   via `eas update` without going through store review.
