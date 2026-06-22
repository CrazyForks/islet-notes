# Islet App

Islet is a private diary app built with React, Vite, Capacitor, and Android. This project contains the web app, Capacitor configuration, Android project, and dependency manifest required to build the app.

## Requirements

- Node.js 22 or newer
- pnpm 10.15.0
- JDK and Android SDK for Android builds

## Install

```bash
pnpm install --frozen-lockfile
```

## Web Build

```bash
pnpm build
```

The web build output is written to `dist/`.

## Android Build

Use the Android release command when you need a buildable APK. It runs the full app build pipeline:

1. Builds the web app into `dist/`.
2. Syncs the web output and Capacitor plugins into the Android project.
3. Builds the Android APK with Gradle.

Build a release APK:

```bash
pnpm release:android -- --version 1.2.3
```

Build a debug APK:

```bash
pnpm release:android -- --version 1.2.3 --debug
```

`--version` must use `major.minor.patch` format. The command writes `android/version`, uses that value for the Android version name and version code, and generates APK files under `android/app/build/outputs/apk/`.

## Android Signing

Local signing files are ignored by Git. Put signing files under `android/signing/` when needed.

`android/signing/keystore.properties`:

```properties
storeFile=signing/riji.jks
storePassword=...
keyAlias=riji
keyPassword=...
```

## License

See `LICENSE`.
