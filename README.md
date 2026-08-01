<p align="center">
  <img src="src-tauri/icons/128x128.png" width="96" height="96" alt="Timeline Timer icon">
</p>

<h1 align="center">Timeline Timer</h1>

<p align="center">
  See the whole session, not just the next countdown.
</p>

<p align="center">
  <img alt="Tauri 2" src="https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white">
  <img alt="React 18" src="https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
  <a href="https://github.com/agsoto/timeline-timer/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/agsoto/timeline-timer/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/agsoto/timeline-timer/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/agsoto/timeline-timer?display_name=tag"></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-C6F05A"></a>
</p>

Timeline Timer is a small, always-on-top desktop HUD that turns a plain-text agenda into a continuously moving visual timeline. Dock it to any screen edge, see where you are at a glance, and keep the rest of the screen available for the work that matters.

It is designed for situations where a normal countdown hides too much context:

- Teachers and lecturers pacing lessons, activities, and breaks.
- Speakers keeping presentations and demos on schedule.
- Workshop facilitators balancing exercises, discussion, and wrap-up time.
- Interviewers, streamers, and podcast hosts tracking segments without breaking flow.
- Individuals running visible Pomodoros or other time-boxed focus routines.

## What it does

- Shows every agenda item and its relative duration on one timeline.
- Tracks live progress with a playhead, elapsed time, and remaining time.
- Docks horizontally or vertically to the top, bottom, left, or right edge.
- Switches to a minimal compact mode that stays useful without covering your content.
- Supports keyboard-first control, quick time adjustments, skipping, and reordering.
- Keeps layout preferences and supports live custom CSS overrides.
- Runs as a lightweight desktop app built with Tauri, React, and TypeScript.

## Agenda syntax

Write a label followed by a duration. Newlines, bullets, dashes, numbered lists, combined durations, and long or short unit names are accepted.

```text
☕ Welcome 5m
1. Architecture review 1h30m
- Questions 45 seconds
✅ Wrap-up 10m
```

Paste the agenda into Timeline Timer and start. The timeline scales each segment to its duration so both the current moment and the remaining shape of the session stay visible.

## Install and run

Packaged installers are published on the repository's [Releases page](https://github.com/agsoto/timeline-timer/releases). To run the app from source, use the commands below.

Prerequisites are Node.js 20.19 or newer, Rust, and the [Tauri v2 system dependencies](https://v2.tauri.app/start/prerequisites/) for your platform.

```sh
npm install
npm run tauri dev
```

Timeline Timer has primarily been developed and tested on Windows. See [Windows development and troubleshooting](./WINDOWS_DEVELOPMENT.md) for one-time setup, a single-command launch, and fixes for Cargo, the MSVC linker, Windows SDK libraries, and icon errors.

For browser-only UI development, run `npm run dev`.

## Keyboard controls

| Key | Action |
| --- | --- |
| `Space` / `Ctrl+P` | Start, pause, or resume |
| `Ctrl+R` | Restart |
| Arrow keys / `Home` / `End` | Select an item |
| `Enter` | Edit the selected item |
| `Delete` | Remove the selected item |
| `Ctrl+N` / `Ctrl+D` | Add / duplicate an item |
| `Ctrl+Up` / `Ctrl+Down` | Reorder the selected item |
| `+` / `-` | Add / remove one minute from the focused item, or the current item when none is focused |
| `S` | Skip the current item |
| `Ctrl+E` / `Ctrl+L` | Focus the editor / timeline |
| `Ctrl+K` | Toggle editing lock |
| `Ctrl+Alt+C` | Toggle compact mode |
| `Ctrl+,` | Open settings |
| `Alt+Shift+Arrow` | Dock to that screen edge |
| `Escape` | Close the active prompt/editor, or clear timeline-item focus |

When the remaining-time prompt is visible, keys `1`–`4` add 3, 5, 10, or 15 minutes.

## Customization

Settings control the dock edge, compact label length, compact time counters, and accent color. Resize the window directly to change its horizontal height or vertical width; those dimensions are restored independently for each orientation. Preferences are persisted and applied immediately. Appearance and layout can be reset independently, or every setting can be restored to its default without removing the agenda.

The desktop app also creates `custom.css` in its platform application-config directory on first launch; the exact path appears in Settings. Changes are applied while the app is open. Override the variables in `:root` or any application selector. The base `--accent-rgb`, `--hud-rgb`, `--white-rgb`, and `--black-rgb` channels drive the derived translucent colors, while semantic tokens can be overridden individually.

Optional bundled themes are intentionally deferred until the core experience is mature.

## Contributing

Pull requests are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, checks, and review expectations. Bugs and focused feature ideas are also welcome through GitHub Issues.

For maintainers, [RELEASING.md](./RELEASING.md) documents versioning and the automated multi-platform release flow. Notable changes are tracked in [CHANGELOG.md](./CHANGELOG.md).

## License

Timeline Timer is available under the [MIT License](./LICENSE).
