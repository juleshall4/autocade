# Autocade

A stylish arcade-style scoreboard for [Autodarts](https://autodarts.io). Flashy animations, glassmorphic UI, and game modes not available in the standard Autodarts interface.

![Status](https://img.shields.io/badge/status-beta-yellow)

> ⚠️ **Work in Progress** — Autocade is under active development. There may be bugs, but it's fully usable for fun sessions. Performance optimizations coming soon!

---

## Game Modes

### X01
Classic 501/301 with Double In/Out, Single Out, and live checkout suggestions.

<p align="center">
  <img src="screenshots/x01-game-view.png" width="24%" />
  <img src="screenshots/x01-scoring.png" width="24%" />
  <img src="screenshots/x01-checkout.png" width="24%" />
  <img src="screenshots/x01-rules.png" width="24%" />
</p>

### Around the Clock
Hit 1-20 (+ Bull) in sequence. Modes: Single, Double, Triple, or Full Board with configurable hits and multiplier options.

<p align="center">
  <img src="screenshots/atc-game-view.png" width="32%" />
  <img src="screenshots/atc-scoring.png" width="32%" />
  <img src="screenshots/atc-rules.png" width="32%" />
</p>

### Killer
Classic pub darts elimination game — not available on Autodarts!

<p align="center">
  <img src="screenshots/killer-game-view.png" width="24%" />
  <img src="screenshots/killer-activated.png" width="24%" />
  <img src="screenshots/killer-elimination.png" width="24%" />
  <img src="screenshots/killer-rules.png" width="24%" />
</p>

---

## Features

- **Players** — Custom names, photos, persistent data
- **Themes** — 6 color themes with glassmorphic effects
- **Caller** — Voice announcements for scores, checkouts, busts
- **Live Display** — Real-time WebSocket connection, animated dartboard, confetti celebrations

### Themes

<p align="center">
  <img src="screenshots/theme-midnight.png" width="32%" />
  <img src="screenshots/theme-ocean.png" width="32%" />
  <img src="screenshots/theme-purple-haze.png" width="32%" />
</p>
<p align="center">
  <img src="screenshots/theme-forest.png" width="32%" />
  <img src="screenshots/theme-crimson.png" width="32%" />
  <img src="screenshots/theme-amber.png" width="32%" />
</p>

---

## Quick Start

**Requirements:** Node.js 18+, Autodarts Board Manager running on your network

```bash
git clone https://github.com/juleshall4/autocade.git
cd autocade
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and enter your Board Manager IP.

---

## Tech Stack

React 18 • TypeScript • Vite • Tailwind CSS • WebSocket

---

## License

MIT
