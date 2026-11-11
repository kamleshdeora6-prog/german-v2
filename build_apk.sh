#!/usr/bin/env bash
# Builds the Android APK from android/ (smali + resources) and www/ (the web app).
# Needs: java 11+, tools/apktool.jar, tools/uber-apk-signer.jar  (see README-BUILD.md)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
TOOLS="${TOOLS:-$ROOT/tools}"
BUILD="$ROOT/build/apk"
rm -rf "$BUILD"; mkdir -p "$BUILD"
cp -r "$ROOT/android/AndroidManifest.xml" "$ROOT/android/apktool.yml" "$ROOT/android/res" "$ROOT/android/smali" "$BUILD/"
# 7.6: the APK is a small shell that shows the live web app (GitHub Pages) – every upload to GitHub updates the app,
# no new APK needed. Offline it uses the web app's own offline cache. Inside the APK: only the start page
# (hands old progress over once) and the "needs internet once" page.
APP_URL="${APP_URL:-https://kamleshdeora6-prog.github.io/german-v2/}"
case "$APP_URL" in */) ;; *) APP_URL="$APP_URL/";; esac
mkdir -p "$BUILD/assets/www"
cp "$ROOT/android/www/boot.html" "$ROOT/android/www/offline.html" "$BUILD/assets/www/"
sed -i "s#__APP_URL__#$APP_URL#g" "$BUILD/assets/www/boot.html" "$BUILD/assets/www/offline.html" "$BUILD/smali/de/deutschcoach/app/Client.smali"
echo "App shows: $APP_URL"
java -jar "$TOOLS/apktool.jar" b "$BUILD" -o "$ROOT/build/deutsch-coach-unsigned.apk"
# Signing: set KEYSTORE, KS_ALIAS, KS_PASS (and optionally KEY_PASS) to sign with YOUR release key.
# Without them the public Android debug key is used – fine for testing, never for distribution.
if [ -n "${KEYSTORE:-}" ]; then
  echo "Signing with release keystore $KEYSTORE (alias $KS_ALIAS)"
  java -jar "$TOOLS/signer.jar" -a "$ROOT/build/deutsch-coach-unsigned.apk" -o "$ROOT/build" --allowResign \
    --ks "$KEYSTORE" --ksAlias "$KS_ALIAS" --ksPass "$KS_PASS" --ksKeyPass "${KEY_PASS:-$KS_PASS}"
else
  echo "WARNING: no KEYSTORE set – signing with the public DEBUG key (testing only)"
  java -jar "$TOOLS/signer.jar" -a "$ROOT/build/deutsch-coach-unsigned.apk" -o "$ROOT/build" --allowResign
fi
mv "$ROOT/build"/*-aligned-*[sS]igned.apk "$ROOT/build/deutsch-coach.apk"
rm -f "$ROOT/build/deutsch-coach-unsigned.apk" "$ROOT/build"/*.idsig
echo "APK: $ROOT/build/deutsch-coach.apk"
