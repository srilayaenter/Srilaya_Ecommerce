# SriLaYa Green Ops

A recipe & batch-scale calculator for SriLaYa's Wellness, Hair Care, Skincare, and Household/Eco-Cleaning product lines (the "green" business unit). Runs as a website (PWA) and as a native Android app. Sibling app to `apps/ops-app` (Foods & Laddus, soap manufacturing).

## Project structure

- **`www/`** — the actual app (`index.html`, `sw.js`, `vendor/`). This is the source of truth. Edit files here.
- **`android/`** — the Capacitor-generated native Android wrapper (created via `npx cap add android`). Don't hand-edit the web content in here (`android/app/src/main/assets/public`) — it gets overwritten every time you sync.
- **`toolchain/`** — not included here; reuse the portable JDK 21 from `apps/ops-app/toolchain/jdk-21.0.11+10` (Capacitor 8's Android build requires JDK 21).

Unlike `ops-app`, this app has no Supabase cloud sync — all recipes are local-only in the browser's/WebView's `localStorage`, per install.

## Running the website locally

```bash
python -m http.server 8091 --directory www
```

Or use the `srilaya-green-ops` entry in `.claude/launch.json` with the `run` skill / preview tools.

## Building the Android APK

First time only, from the `apps/green-ops` directory:

```bash
npm install
npx cap add android
npx cap sync android
```

Then build the debug APK (reusing the JDK bundled with `ops-app`):

```bash
export JAVA_HOME="D:/CompanyWebsite/srilaya-ecommerce/apps/ops-app/toolchain/jdk-21.0.11+10"
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="C:/Users/HP/AppData/Local/Android/Sdk"
cd android
./gradlew.bat assembleDebug
```

The APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`. Copy it to an Android phone and open it to install (enable "install unknown apps" for whichever app you transfer it with).

This is a **debug build**, signed with the generic Android debug key. Fine for quick local testing. For a signed release build (needed before handing this to staff), generate a **new** keystore (don't reuse `ops-app`'s — each app's keystore is separate) — see `apps/ops-app/README.md` for the release-signing pattern to follow.

## Distributing releases

Not yet set up. `ops-app` distributes via `naturals.com/admin/ops-app`; an equivalent `green.com/admin/green-ops` page (or similar) would need to be built when this app is ready to hand to staff.

## App icon

Currently reuses the same SriLaYa Enterprises logo icons as `ops-app` (`www/icons/*.png`). Swap for a green-line-specific icon if desired.

## Data persistence

Recipes live in the browser's/WebView's `localStorage`, per install. There is no shared backend. Use the in-app **Backup All Recipes** / **Restore Backup** buttons to move data between devices or protect against loss.
