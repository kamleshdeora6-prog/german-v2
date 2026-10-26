#!/usr/bin/env bash
# Prepares the Xcode project. Requires macOS + Xcode. No Gradle/CocoaPods needed.
#   brew install xcodegen      (once)
#   ./build_ios.sh             -> creates DeutschCoach.xcodeproj and opens it
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
rm -rf "$HERE/www"; mkdir -p "$HERE/www"
# copy the web app (everything the service worker caches)
cd "$ROOT"
cp -R index.html manifest.webmanifest sw.js css js icons "$HERE/www/"
# the service worker is useless inside the app bundle (file://) – the app is already offline
echo "web app copied into ios/www ($(du -sh "$HERE/www" | cut -f1))"
cd "$HERE"
if command -v xcodegen >/dev/null; then
  xcodegen generate
  echo "Created DeutschCoach.xcodeproj"
  # (an "a && b" line at the end made the whole script exit with 1 on CI – the reason iOS builds always failed)
  if [ "$1" = "--open" ]; then open DeutschCoach.xcodeproj; fi
else
  echo "xcodegen not found. Install with: brew install xcodegen"
  echo "Then run ./build_ios.sh again, or create an App target in Xcode manually,"
  echo "add ios/Sources/App.swift and drag ios/www in as a *folder reference*."
fi
exit 0
