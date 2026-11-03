#!/usr/bin/env bash
# Installs YT Course for the current user (no root needed):
# npm deps, `yt-course` command, app-menu entry and icons.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

command -v node >/dev/null || { echo "Node.js is required (sudo dnf install nodejs)"; exit 1; }
command -v yt-dlp >/dev/null || echo "Note: yt-dlp not found. Run: sudo dnf install yt-dlp  (or the app will download it on first import)"

npm install
[ -x node_modules/electron/dist/electron ] || node node_modules/electron/install.js

mkdir -p "$HOME/.local/bin" "$HOME/.local/share/applications"
cat > "$HOME/.local/bin/yt-course" <<LAUNCH
#!/bin/bash
cd "$DIR" && exec ./node_modules/.bin/electron . "\$@"
LAUNCH
chmod +x "$HOME/.local/bin/yt-course"

for s in 48 64 128 256 512; do
  d="$HOME/.local/share/icons/hicolor/${s}x${s}/apps"; mkdir -p "$d"
  cp "assets/icon-$s.png" "$d/yt-course.png"
done
mkdir -p "$HOME/.local/share/icons/hicolor/scalable/apps"
cp assets/icon.svg "$HOME/.local/share/icons/hicolor/scalable/apps/yt-course.svg"

cat > "$HOME/.local/share/applications/yt-course.desktop" <<DESKTOP
[Desktop Entry]
Name=YT Course
Comment=Turn YouTube playlists into Udemy-style courses
Exec=$HOME/.local/bin/yt-course %u
Icon=yt-course
Terminal=false
Type=Application
Categories=Education;AudioVideo;
StartupWMClass=YT Course
DESKTOP

update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
echo "Done. Launch from the app menu (YT Course) or run: yt-course"
