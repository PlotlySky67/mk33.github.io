# A+ Sunsets — mobile app

The app promised on [asunsets.com](https://asunsets.com): a personal, quiet
gallery for the sunsets you actually save. Take or pick a photo, the app
tags it with where you were, and it's organized automatically into your
feed and your profile. Follow friends to see their skies too.

Built with [Expo](https://expo.dev) (React Native + TypeScript),
[Firebase](https://firebase.google.com) (Auth + Firestore) for accounts and
data, and [Cloudinary](https://cloudinary.com) (free tier, no card needed)
for photo hosting.

## Features

- **Accounts** — sign up / log in with email & password.
- **Feed** — a two-column gallery of your sunsets *and* the ones saved by
  people you follow, newest first, updating live.
- **Add** — take a photo or pick one from your library; the app detects your
  location in the background and lets you confirm/edit the city & country
  before saving. Uploads straight to Cloudinary.
- **Friends** — search people by name, follow/unfollow them; their sunsets
  then show up in your feed with their name on the card.
- **Profile** — your own sunsets grouped by place, with quick stats (total
  saved, distinct places, friends followed), and log out.
- **Detail** — full photo, date, place, who saved it, and delete (owner only).

## Setup (required — do this first)

The app won't run until it's pointed at a Firebase project and a Cloudinary
account. Both have free tiers that don't require a credit card.

### 1. Firebase (accounts + database)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) →
   **Add project** (free "Spark" plan — no billing needed for this).
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → Create database → start in **production mode**
   (we provide rules below).
4. Project settings (⚙️ gear icon) → **General** → scroll to "Your apps" →
   click the **Web** icon (`</>`) → register an app (nickname doesn't
   matter, no need for Firebase Hosting) → copy the `firebaseConfig` values
   shown.
5. **Security rules** — paste the contents of `firestore.rules` (in this
   folder) into Firestore → Rules in the console, then **Publish**. Without
   this, every read/write is blocked by default.

> Firebase Storage now requires the paid Blaze plan, which is why photos go
> to Cloudinary instead — Firestore and Auth stay on the free Spark plan.

### 2. Cloudinary (photo hosting)

1. Go to [cloudinary.com](https://cloudinary.com) → sign up for a free
   account (no card required).
2. On your Dashboard, copy the **Cloud name** shown at the top.
3. Go to **Settings** (gear icon) → **Upload** tab → scroll to "Upload
   presets" → **Add upload preset**.
4. Set **Signing Mode** to **Unsigned**, optionally set **Folder** to
   `sunsets`, then **Save**. Copy the preset's name.

### 3. Fill in your `.env`

In `apsunsets-app/`, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then fill in the values you copied from Firebase and Cloudinary:

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=...
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

That's it — no server to run, no CLI login required for local dev.

> The first time a query (feed, search, profile) runs, Firestore may log an
> error in the terminal with a link to auto-create a composite index. Click
> it, wait ~1 minute, and retry — this only happens once per query shape.

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
App.tsx                    navigation (auth stack, tabs, detail screen)
src/screens/                Login, SignUp, Feed, Add, Friends, Profile, SunsetDetail
src/components/             SunsetCard, EmptyState
src/contexts/AuthContext.tsx current user + following list, sign up/in/out
src/firebase/config.ts      Firebase app/auth/Firestore init
src/firebase/sunsets.ts     upload/query/delete sunsets
src/firebase/users.ts       search users, follow/unfollow
src/cloudinary/upload.ts    uploads a picked photo to Cloudinary
src/theme/colors.ts         shared sunset color palette
assets/                     app icon & adaptive icon (generated placeholders)
firestore.rules             Firestore security rules (paste into console)
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

3. **Set your env vars as EAS secrets** so production builds have them too
   (they won't read your local `.env`):
   ```bash
   eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..." --visibility plaintext
   ```
   (repeat for every variable from `.env`, Firebase and Cloudinary alike)

4. **Build for iOS:**
   ```bash
   eas build --platform ios
   ```
   The first run will walk you through Apple credentials (or let EAS manage
   signing certificates/provisioning profiles for you).

5. **Submit to App Store Connect:**
   ```bash
   eas submit --platform ios
   ```

6. Finish the listing (screenshots, description, privacy nutrition labels)
   in [App Store Connect](https://appstoreconnect.apple.com), matching the
   copy already on the website ("Every sky, saved.").

Before a real submission, swap the placeholder gradient icon in `assets/`
for final artwork, and double check `app.json`'s `ios.bundleIdentifier`
matches the App ID registered in your Apple Developer account.

## Notes / next steps

- Friend search matches on the start of a name (case-insensitive). There's
  no discovery/suggestions yet — you have to know the name to search it.
- The feed does a Firestore `in` query capped at 30 people (you + who you
  follow); fine for an MVP, would need pagination/fan-out at real scale.
- The location flow degrades gracefully: if permission is denied, the
  sunset still saves, just without a place tag.
- Deleting a sunset removes it from the feed but the photo stays on
  Cloudinary's free tier (deleting it needs a signed request, i.e. a
  server) — fine at hobby scale, worth revisiting if storage matters later.
