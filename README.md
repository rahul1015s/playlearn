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

## Install (Fedora / Linux)

Requirements: **Node.js 18+**, **npm**, **yt-dlp**.

```bash
sudo dnf install nodejs yt-dlp        # yt-dlp is also auto-downloaded on first import if missing

git clone https://github.com/rahul1015s/playlearn.git
cd playlearn
./install.sh
```

`install.sh` installs dependencies, creates the `playlearn` command in `~/.local/bin`,
and adds **Playlearn** (with icon) to your application menu. No root needed.

Make sure `~/.local/bin` is in your `PATH`.

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
| `<` / `>` (or `,` / `.`) | Slower / faster |
| `Shift+N` / `Shift+P` | Next / previous lesson |
| `Esc` / `Alt+←` | Back to home |

### Captions & auto-dubbed audio

In the player bar, the **CC** button chooses caption language (or Off) and the **globe** button
lists the video's audio tracks, including YouTube's auto-dubbed languages. Choosing a dubbed
language applies it to every lesson that offers it; choosing the original track clears the preference.
Availability depends on the video – not every video has captions or dubs.

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
- Videos stream from YouTube, so **watching needs an internet connection**; only course data is stored offline.

## Limitations

- Videos whose owners disabled embedding can't be played in the app.
- Private / deleted videos are skipped on import.
- A course doesn't auto-refresh when the playlist changes – delete and re-add it.
- Some ads are stitched into the stream and can't be blocked by URL; the skipper handles most of them.

## Project layout

```
main.js          Electron main process: storage, yt-dlp import, local server, ad blocking, player ops
preload.js       Safe bridge between UI and main process
renderer/        UI (index.html, styles.css, app.js)
assets/          App icon (SVG + PNG sizes)
install.sh       Per-user installer (command, menu entry, icons)
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
