# A+ Sunsets — mobile app

The app promised on [asunsets.com](https://asunsets.com): a personal, quiet
gallery for the sunsets you actually save. Take or pick a photo, the app
tags it with where you were, and it's organized automatically into your
feed and your profile — nothing else in the frame.

Built with [Expo](https://expo.dev) (React Native + TypeScript). Everything
is stored on-device (no backend, no accounts) — a deliberate MVP scope.

## Features

- **Feed** — a two-column gallery of every sunset you've saved, newest first.
- **Add** — take a photo or pick one from your library; the app detects your
  location in the background and lets you confirm/edit the city & country
  before saving.
- **Profile** — your sunsets grouped by place, with quick stats (total saved,
  distinct places).
- **Detail** — full photo, date, place, and delete.

Photos are copied into the app's private document storage and the index is
kept in `AsyncStorage`, so entries persist across app restarts and don't
depend on the original camera-roll asset still existing.

## Run it locally

```bash
cd apsunsets-app
npm install
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) for the fastest way to try
it, or press `i` / `a` to open an iOS Simulator / Android emulator if you
have Xcode / Android Studio installed.

> Camera, photo library, and location permissions only prompt when you
> actually use the "Add" tab — nothing is requested up front.

## Project structure

```
App.tsx                   navigation (bottom tabs + detail screen)
src/screens/               Feed, Add, Profile, SunsetDetail
src/components/            SunsetCard, EmptyState
src/storage/sunsetStore.ts local persistence (AsyncStorage + FileSystem)
src/theme/colors.ts         shared sunset color palette
assets/                     app icon & adaptive icon (generated placeholders)
```

## Publishing to the App Store

This repo can't run Xcode directly (no macOS here), so builds go through
[EAS Build](https://docs.expo.dev/build/introduction/), which builds iOS
binaries in the cloud — no Mac required for the build itself, though you
still need an [Apple Developer account](https://developer.apple.com/programs/)
($99/yr) to submit.

1. **Install the EAS CLI and log in:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configure the project** (creates `eas.json`, links it to an Expo
   account/project):
   ```bash
   eas build:configure
   ```

3. **Build for iOS:**
   ```bash
   eas build --platform ios
   ```
   The first run will walk you through Apple credentials (or let EAS manage
   signing certificates/provisioning profiles for you).

4. **Submit to App Store Connect:**
   ```bash
   eas submit --platform ios
   ```

5. Finish the listing (screenshots, description, privacy nutrition labels)
   in [App Store Connect](https://appstoreconnect.apple.com), matching the
   copy already on the website ("Every sky, saved.").

Before a real submission, swap the placeholder gradient icon in `assets/`
for final artwork, and double check `app.json`'s `ios.bundleIdentifier`
matches the App ID registered in your Apple Developer account.

## Notes / next steps

- No backend yet — sunsets live only on the device that saved them. A sync
  layer (e.g. Supabase/Firebase) would be the natural next step if the app
  needs multi-device or account support.
- The location flow degrades gracefully: if permission is denied, the
  sunset still saves, just without a place tag.
