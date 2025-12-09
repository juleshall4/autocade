# Autocade

Arcade-style view layer for Autodarts. A real-time display for your dart throws, designed to run alongside the [Autodarts Board Manager](https://autodarts.io).

![Status](https://img.shields.io/badge/status-alpha-orange)

## Concept

Autocade connects to your Autodarts Board Manager and displays live dart detection data with a clean, arcade-inspired UI. Perfect for displaying on a secondary screen or tablet near your dartboard.

**Features:**
- Real-time connection to Autodarts Board Manager
- Live score tracking
- Last throw display
- Arcade-style dark theme

## Requirements

- **Node.js** 18+ ([Download](https://nodejs.org))
- **Autodarts Board Manager** running on your network (e.g., `192.168.1.45:3181`)

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

3. **Configure the Board Manager address**
   
   Edit `server.js` and update the `UPSTREAM_URL` to match your Board Manager's IP:
   ```javascript
   const UPSTREAM_URL = 'wss://YOUR_BOARD_MANAGER_IP:3181/api/events';
   ```

4. **Start the app**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to [http://localhost:5173](http://localhost:5173)

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- WebSocket (native)

## License

MIT
