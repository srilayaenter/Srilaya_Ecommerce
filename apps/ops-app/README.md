# SriLaYa Ops

A recipe & batch-scale calculator for SriLaYa's kitchen/workshop production. Runs as a website (PWA) and as a native Android app.

## Project structure

- **`www/`** — the actual app (`index.html`, `sw.js`, `vendor/`). This is the source of truth. Edit files here.
- **`android/`** — the Capacitor-generated native Android wrapper. Don't hand-edit the web content in here (`android/app/src/main/assets/public`) — it gets overwritten every time you sync.
- **`toolchain/`** — a portable JDK 21 (`jdk-21.0.11+10`), bundled locally because the system only had JDK 11 and Capacitor 8's Android build requires JDK 21. Not needed for the website, only for rebuilding the Android APK.

## Running the website locally

```bash
python -m http.server 8090 --directory www
```

Or use the `srilaya-ops` entry in `.claude/launch.json` with the `run` skill / preview tools.

## Rebuilding the Android APK after changing `www/`

```bash
cd D:/CompanyWebsite/srilaya-ops
npx cap sync android
```

Then build the debug APK:

```bash
export JAVA_HOME="D:/CompanyWebsite/srilaya-ops/toolchain/jdk-21.0.11+10"
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="C:/Users/HP/AppData/Local/Android/Sdk"
cd android
./gradlew.bat assembleDebug
```

The APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`. Copy it to an Android phone and open it to install (enable "install unknown apps" for whichever app you transfer it with — Files, Drive, etc.).

This is a **debug build**, signed with the generic Android debug key. Fine for quick local testing, but Google Play Protect and some antivirus scanners are more suspicious of debug-signed APKs since they carry no real identity. Prefer the release build below for anything actually handed to staff.

## Building a signed release APK

There's a release keystore at `keystore/srilaya-ops-release.jks` (own identity, not the shared debug key), referenced via `android/keystore.properties` (gitignored — see `.gitignore`). **Back up `keystore/` somewhere safe outside this machine** (password manager + offline copy). If it's lost, no future update can ever be signed to match an already-installed copy of this app — everyone would need to uninstall and reinstall from scratch, losing local data unless they'd backed up their recipes first.

```bash
cd D:/CompanyWebsite/srilaya-ops
npx cap sync android
export JAVA_HOME="D:/CompanyWebsite/srilaya-ops/toolchain/jdk-21.0.11+10"
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="C:/Users/HP/AppData/Local/Android/Sdk"
cd android
./gradlew.bat assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`. This is what should actually go to employees.

Every time you bump the app (new features, bug fixes), rebuild with the exact same keystore so Android treats it as a valid update to whatever's already installed. Also bump `versionCode`/`versionName` in `android/app/build.gradle` each release — Android needs `versionCode` to increase for a reinstall to be treated as an update rather than a conflicting/duplicate app.

## Distributing releases (naturals.com admin page)

Staff download the APK from `naturals.com/admin/ops-app` (owner/admin/manager only), which streams the file from Supabase Storage (`media` bucket) via `/api/admin/ops-app-download` in the `srilaya-ecommerce` repo.

**Important gotcha:** Supabase Storage's CDN caches an object by its exact path and does **not** reliably invalidate that cache when you overwrite/upsert the same path — a delete+recreate at the same path was observed to still serve the old bytes (identical eTag) while the metadata API correctly showed the new size. **Always upload each new release to a new path** (e.g. suffix with the versionCode: `private/srilaya-ops/app-release-v3.apk`) and update `APK_PATH` in `srilaya-ecommerce/apps/web/app/api/admin/ops-app-download/route.ts` to match. Don't overwrite the previous path in place.

## App icon

The launcher/PWA icons (`www/icons/*.png`, `android/app/src/main/res/mipmap-*/ic_launcher*.png`) are generated from the SriLaYa Enterprises logo at `apps/web/public/brand/srilaya-logo.png` in the `srilaya-ecommerce` repo, cropped to just the circular emblem. If the brand logo changes, regenerate icons from that source rather than the current cropped versions.

## Data persistence

Recipes live in the browser's/WebView's `localStorage`, per install. There is no shared backend — installing the app fresh on a new phone starts from the built-in 70-recipe catalog. Use the in-app **Backup All Recipes** / **Restore Backup** buttons to move data between devices or protect against loss.
