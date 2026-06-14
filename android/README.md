# Litefin Android TV

This directory contains the Android TV shell for Litefin. The existing web app is bundled into `app/src/main/assets` and rendered by a full-screen `WebView`, while video playback is delegated to a native Media3 `ExoPlayer` instance through the `LitefinAndroidPlayer` JavaScript bridge.

## Build flow

From the repository root:

```bash
npm run android:sync
cd android
./gradlew assembleDebug
```

`npm run android:assemble` runs both steps when a Gradle wrapper or local Gradle installation is available.

## Architecture

- `MainActivity.kt` hosts the transparent WebView and the Media3 `PlayerView`.
- `src/android/AndroidMedia3Player.js` implements Litefin's player backend contract and forwards playback commands to the native bridge.
- `src/api/profiles/AndroidProfile.js` advertises Android TV playback capabilities to Jellyfin so ExoPlayer can direct-play or remux suitable media.
