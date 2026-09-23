#!/usr/bin/env bash
# Builds the Android APK from android/ (smali + resources) and www/ (the web app).
# Needs: java 11+, tools/apktool.jar, tools/uber-apk-signer.jar  (see README-BUILD.md)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
TOOLS="${TOOLS:-$ROOT/tools}"
BUILD="$ROOT/build/apk"
rm -rf "$BUILD"; mkdir -p "$BUILD"
cp -r "$ROOT/android/AndroidManifest.xml" "$ROOT/android/apktool.yml" "$ROOT/android/res" "$ROOT/android/smali" "$BUILD/"
mkdir -p "$BUILD/assets/www"
cp -r "$ROOT/index.html" "$ROOT/css" "$ROOT/js" "$ROOT/icons" "$ROOT/manifest.webmanifest" "$BUILD/assets/www/"
rm -f "$BUILD/assets/www/sw.js"          # no service worker inside the APK
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
