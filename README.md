# Playlearn

<p align="center"><img src="assets/icon-256.png" width="128" alt="Playlearn icon"></p>

Turn any **YouTube playlist** into a **Udemy-style course** on your Linux desktop.
Paste a playlist link and get a classroom with sections, lesson checklist, progress tracking,
notes and a custom video player. Everything about your courses is stored locally on your computer.

Built with Electron. Developed and tested on Fedora.

## Features

- **Home page** – course grid with progress bars, "Continue learning" banner, add-playlist box
- **Udemy-like course page** – dark top bar with progress ring, video on the left,
  *Course content* sidebar (sections of 10 lessons, checkboxes, durations), Overview and Notes tabs
- **Import a playlist three ways** – paste a link, drag a link onto the window,
  or run `playlearn "https://www.youtube.com/playlist?list=..."`
- **Progress saved locally** – completed lessons, resume position, last lesson watched, per-lesson notes
- **Custom player** – play/pause, ±10s skip, seek bar with buffer, volume, speed, fullscreen,
  **captions** (on/off + language) and **auto-dubbed audio** switching; your choices are remembered
- **Autoplay next lesson**, auto-complete at ~92 % watched
- **Ad blocking** – network rules for ad hosts plus an in-player ad skipper (best effort)
- **Back button** on the course page (also `Esc` / `Alt+←`)

- **Playlist refresh** – picks up videos the creator adds later without touching your progress. The **↻** button on a course card (or **Refresh all** on Home), and **Refresh playlist** on the Overview tab, re-read the playlist; opening a course also checks automatically, at most once a day. New lessons get a **New** badge for a week; lessons that left the playlist are dropped, unless you have progress, notes or a download for them (those stay, marked *removed*)
- **Chapters on the seek bar** – videos with chapters get tick marks on the seek bar, a hover tooltip with time + chapter title, the current chapter name next to the time, a chapters menu, and `[` / `]` to jump between chapters (chapters are read with yt-dlp the first time a lesson opens, then cached)
- **Lesson search** – search box above the lesson list (`/` or `Ctrl+F`) matches lesson titles, your notes (general and timestamped) and chapter names, highlights matches, and jumps straight to the note/chapter moment when you click a result
- **Dark mode** – toggle in the top bar (sun/moon button); follows your system setting the first time and is remembered
- **Offline downloads** – download any lesson (arrow next to it) or the whole course (Overview tab). Offline lessons play in the same custom player with no internet, no ads and no YouTube page around them, keep captions (English) when available, and are used automatically

### Built for studying without distractions

- **Focus mode** (`Z`) – hides everything except the video; `Z` or `Esc` exits
- **No YouTube suggestions** – YouTube's pause/end-screen recommendation walls are hidden; at the end of a lesson you get a clean "Lesson complete" card with a Next button
- **Study timer** – Pomodoro presets (25/5, 50/10, 90/15) with automatic breaks; on GNOME it turns on **Do Not Disturb** while you study and restores your setting afterwards (even after a crash)
- **Timestamped notes** (`N`) – jot a note at the current second, click it later to jump back, and export all notes as Markdown

## Install (Fedora / Linux)

One command, no cloning needed. Requires **Node.js 18+** (`sudo dnf install nodejs`):

```bash
npx github:rahul1015s/playlearn
```

This installs Playlearn for your user (no root): the app goes to `~/.local/share/playlearn`,
a `playlearn` command to `~/.local/bin`, and **Playlearn** (with icon) appears in your app menu.
It launches automatically when done. Run the same command again any time to update.

Importing playlists uses **yt-dlp** – `sudo dnf install yt-dlp` (if it's missing, the app downloads it on first import).
Make sure `~/.local/bin` is in your `PATH` to use the `playlearn` command.

```bash
npx github:rahul1015s/playlearn uninstall           # remove the app, keep your courses
npx github:rahul1015s/playlearn uninstall --purge   # remove the app and your saved courses
```

### Install from a clone

```bash
git clone https://github.com/rahul1015s/playlearn.git
cd playlearn
./install.sh
```

### Run without installing

```bash
npm install
npm start
```

## Usage

1. Open **Playlearn**.
2. Paste a playlist URL (must contain `?list=...`) and press **Create course**.
3. Click a course card to open it. Pick lessons from the right-hand *Course content* list.
4. Tick lessons manually, or let them complete automatically as you watch.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` / `K` | Play / pause |
| `J` / `L` | Back / forward 10 s |
| `←` / `→` | Back / forward 5 s |
| `↑` / `↓` | Volume ±5 |
| `M` | Mute |
| `F` | Fullscreen |
| `C` | Toggle captions |
| `Z` | Focus mode |
| `[` / `]` | Previous / next chapter |
| `/` or `Ctrl+F` | Search lessons |
| `N` | Add a note at the current time |
| `<` / `>` (or `,` / `.`) | Slower / faster |
| `Shift+N` / `Shift+P` | Next / previous lesson |
| `Esc` / `Alt+←` | Back to home |

### Captions & auto-dubbed audio

In the player bar, the **CC** button chooses caption language (or Off) and the **globe** button
lists the video's audio tracks, including YouTube's auto-dubbed languages. Choosing a dubbed
language applies it to every lesson that offers it; choosing the original track clears the preference.
Availability depends on the video – not every video has captions or dubs.

## Offline downloads

Downloads use `yt-dlp` and are saved next to your course data:

```
~/.config/Playlearn/downloads/<playlist-id>/<video-id>.mp4
```

- Click the **↓** button next to a lesson to download it, click it again while it downloads to cancel, or when done to remove it (confirm with a second click).
- Overview tab → **Offline downloads**: download everything, cancel, open the folder, remove all.
- Without `ffmpeg`, downloads are limited to 360p. For up to 720p: `sudo dnf install ffmpeg-free`.
- Deleting a course also deletes its downloads. Please respect creators' rights and YouTube's Terms of Service; downloads are meant for your own offline study.

## Where is my data?

Courses are plain JSON files:

```
~/.config/Playlearn/courses/<playlist-id>.json
```

> Upgrading from the old name "YT Course"? Courses in `~/.config/YT Course/` are copied over automatically on first launch.

Each file holds the lesson list, completed flags, resume positions and notes. Delete a course from
the Home page (hover a card → bin icon → click again), or remove its file. Back the folder up to keep your progress.

## How it works

- `yt-dlp --flat-playlist -J` reads the playlist metadata (titles, durations).
- The video plays through YouTube's embedded player, served from a small local HTTP server
  (YouTube blocks embeds from `file://`), with the default controls hidden and replaced by custom ones.
- Videos stream from YouTube unless you download them, so **watching needs an internet connection** unless a lesson is saved offline.

## Limitations

- Videos whose owners disabled embedding can't be streamed in the app (download them to play offline).
- Private / deleted videos are skipped on import.
- Refresh needs internet and `yt-dlp`; if the playlist can't be read, nothing is changed.
- Some ads are stitched into the stream and can't be blocked by URL; the skipper handles most of them.

## Project layout

```
main.js          Electron main process: storage, yt-dlp import, local server, ad blocking, player ops
preload.js       Safe bridge between UI and main process
renderer/        UI (index.html, styles.css, app.js)
assets/          App icon (SVG + PNG sizes)
bin/cli.js       `npx` installer / uninstaller (copies app, installs Electron, menu entry, icons)
install.sh       Same, but installs from a clone and runs in place
```

## Uninstall

```bash
rm -f ~/.local/bin/playlearn ~/.local/share/applications/playlearn.desktop
rm -f ~/.local/share/icons/hicolor/*/apps/playlearn.*
rm -rf ~/.config/"Playlearn"      # also deletes your saved courses
```

## Disclaimer

This is an unofficial tool, not affiliated with YouTube or Udemy. Videos are played through YouTube's
official embedded player. Respect creators and YouTube's Terms of Service.

## License

MIT
