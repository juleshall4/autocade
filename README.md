# Autocade

A premium arcade-style scoreboard and game manager for Autodarts. Real-time display for your dart throws with multiplayer support, designed to run alongside the [Autodarts Board Manager](https://autodarts.io).

![Status](https://img.shields.io/badge/status-beta-blue)

## Why Autocade?

Autocade is a **more stylised and fun** alternative to the standard Autodarts interface. It's designed to bring that arcade gaming feel to your dart sessions with flashy animations, dynamic overlays, and a premium glassmorphic UI.

Plus, Autocade includes game modes **not available in Autodarts** - like Killer - giving you more ways to play with friends.

> 🚀 **More games coming soon** Autocade is actively being developed with new game modes on the roadmap.

## Features

### 🎯 Game Modes
- **X01** - Classic 501/301 with configurable starting scores, Double In/Out, Single Out options
- **Around the Clock** - Hit 1-20 (+ optional Bull) in sequence with multiple modes:
  - Single, Double, Triple, or Full Board
  - Configurable hits required per target
  - Multiplier mode for faster progression
- **Killer** *(coming soon)* - Classic pub darts game not available on Autodarts

### 👥 Player Management
- Add/remove players with custom names and photos
- Player photos displayed in game and victory screens
- Persistent player data across sessions

### 🎨 Theming & Customization
- 6 beautiful color themes (Midnight, Ocean, Purple Haze, Forest, Crimson, Amber)
- Glassmorphic UI with backdrop blur effects
- Adjustable UI scaling for player list and game view
- Fullscreen mode support

### 🔊 Caller System
- Score announcements with voice packs
- Configurable announcement options:
  - All darts, round totals, checkouts, busts, game start
- Adjustable volume

### 🎮 Game Features
- Real-time WebSocket connection to Board Manager
- Live checkout suggestions for X01
- Interactive dartboard with segment highlighting
- Victory overlay with confetti effects
- "Next Player" turn announcements with animated panel
- Manual score entry drawer for corrections

### ⚙️ Settings
- Connection management with IP configuration
- Appearance toggles (connection status, board status, dev tools)
- Audio settings with voice selection

## Requirements

- **Node.js** 18+ ([Download](https://nodejs.org))
- **Autodarts Board Manager** running on your network

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/juleshall4/autocade.git
   cd autocade
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the app**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   
   Navigate to [http://localhost:5173](http://localhost:5173)

5. **Configure connection**
   
   On first launch, enter your Board Manager's IP address (e.g., `192.168.1.45`). The app connects via WebSocket on port 3180.

## Tech Stack

- **React 18** + TypeScript
- **Vite** - Fast dev server and build
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **canvas-confetti** - Victory celebrations
- **WebSocket** - Real-time Board Manager connection

## Project Structure

```
src/
├── components/     # UI components (games, overlays, settings)
├── hooks/          # Custom React hooks (autodarts, caller, players)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions (checkouts)
└── App.tsx         # Main application
```

## License

MIT

