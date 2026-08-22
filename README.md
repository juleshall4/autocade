<p align="center">
  <img src="screenshots/x01-game-view.png" alt="Autocade showing a live X01 dart game" width="100%">
</p>

<h1 align="center">Autocade</h1>

<p align="center">
  <strong>Make darts feel like an arcade game.</strong>
</p>

<p align="center">
  A flashy scoreboard and game manager for <a href="https://autodarts.io">Autodarts</a> that turns live throws into glowing boards, dramatic turn changes, and extremely serious arguments about who is actually the best.
</p>

<p align="center">
  <code>React 19</code> · <code>TypeScript</code> · <code>Vite</code> · <code>Tailwind CSS</code> · <code>WebSocket</code>
</p>

<p align="center">
  <a href="#quick-start"><strong>Quick Start</strong></a> ·
  <a href="#game-modes"><strong>Game Modes</strong></a> ·
  <a href="#board-setup"><strong>Board Setup</strong></a> ·
  <a href="#scripts"><strong>Scripts</strong></a>
</p>

## What It Does

- Receives live dart throws from the Autodarts Board Manager through a WebSocket, a live connection that pushes updates as they happen.
- Turns those throws into full-screen scoreboards with animated dartboards, player cards, checkout suggestions, and victory celebrations.
- Supports X01, Around the Clock, and Killer, with more game cabinets waiting in the wings.
- Keeps your players, photos, voice settings, themes, and other preferences in your browser so game night remembers who you are.
- Gives you a manual entry drawer when you want to test a game, recover from a missed throw, or run a completely fake 180.

<p align="center">
  <img src="screenshots/game-selector.png" alt="Autocade game selector with X01, Around the Clock, and Killer" width="100%">
</p>

## Why It Exists

Autodarts already knows where the dart landed. Autocade decides how that should feel.

A normal scoreboard quietly changes a number. Autocade gives the moment a little more theatre: the board glows, the next player gets an entrance, the caller announces the score, and a checkout can trigger a full celebration. It is a side project for turning a smart dartboard into the centre of the room.

## Game Modes

### X01

The familiar race from 301, 501, or any of the other classic starting scores down to zero. Choose single or double in, single or double out, play individual legs or a match, and get live checkout suggestions when the finish is on.

<p align="center">
  <img src="screenshots/x01-game-view.png" alt="X01 live game view" width="24%">
  <img src="screenshots/x01-scoring.png" alt="X01 scoring view" width="24%">
  <img src="screenshots/x01-checkout.png" alt="X01 checkout suggestion" width="24%">
  <img src="screenshots/x01-rules.png" alt="X01 rules screen" width="24%">
</p>

### Around the Clock

Hit every target from 1 to 20, then finish on the Bull. Reverse the order, shuffle the numbers, require multiple hits, choose the exact scoring zone, or turn on multiplier mode and make the board move faster than anyone asked it to.

<p align="center">
  <img src="screenshots/atc-game-view.png" alt="Around the Clock live game view" width="32%">
  <img src="screenshots/atc-scoring.png" alt="Around the Clock scoring view" width="32%">
  <img src="screenshots/atc-rules.png" alt="Around the Clock rules screen" width="32%">
</p>

### Killer

The friendship simulator. Each player gets a number. Hit your own number three times to become a Killer, then hunt down everybody else's hearts until only one player is standing.

Configure starting hearts, hit zones, multiplier damage, suicide rules, and what happens when one Killer hits another Killer. It is not available in the standard Autodarts interface, which is exactly why it is here.

<p align="center">
  <img src="screenshots/killer-game-view.png" alt="Killer live game view" width="24%">
  <img src="screenshots/killer-activated.png" alt="Killer activation state" width="24%">
  <img src="screenshots/killer-elimination.png" alt="Killer elimination state" width="24%">
  <img src="screenshots/killer-rules.png" alt="Killer rules screen" width="24%">
</p>

## Make It Yours

### Players

- Add, rename, reorder, activate, or bench players.
- Take player photos directly in the browser.
- Record a victory video for the winner screen.
- Keep player data between sessions with browser storage.

### Sound and spectacle

- Announce scores, round totals, checkouts, busts, and game starts with the built-in caller.
- Adjust voice and sound volume, then let the board do the talking.
- Celebrate wins with animated overlays and confetti.
- Use fullscreen mode and adjust the game view scale for a television, monitor, or tiny laptop screen.

### Six different moods

Midnight, Ocean, Purple Haze, Forest, Crimson, and Amber. Same darts. Completely different atmosphere.

<p align="center">
  <img src="screenshots/theme-midnight.png" alt="Autocade Midnight theme" width="32%">
  <img src="screenshots/theme-ocean.png" alt="Autocade Ocean theme" width="32%">
  <img src="screenshots/theme-purple-haze.png" alt="Autocade Purple Haze theme" width="32%">
</p>
<p align="center">
  <img src="screenshots/theme-forest.png" alt="Autocade Forest theme" width="32%">
  <img src="screenshots/theme-crimson.png" alt="Autocade Crimson theme" width="32%">
  <img src="screenshots/theme-amber.png" alt="Autocade Amber theme" width="32%">
</p>

### Make the room react

Autocade can trigger WLED, a local controller for addressable LED strips, when something important happens. Map presets or fallback colours to game starts, checkouts, busts, Killer activations, eliminations, and wins. Configure one light strip, two light strips, or no light strips at all. The darts will still count.

## Quick Start

<table>
  <tr>
    <td><strong>1. Install</strong></td>
    <td>

```sh
npm install
```

  </td>
  </tr>
  <tr>
    <td><strong>2. Run</strong></td>
    <td>

```sh
npm run dev
```

  </td>
  </tr>
  <tr>
    <td><strong>3. Open</strong></td>
    <td>Open <a href="http://localhost:5173">http://localhost:5173</a> in your browser.</td>
  </tr>
</table>

## Board Setup

Autocade connects directly to the Autodarts Board Manager on your local network.

1. Start the Board Manager on the computer connected to your dartboard.
2. Run Autocade on a device on the same network.
3. On first launch, enter the Board Manager's local IP address (Internet Protocol address), such as `192.168.1.45`.
4. Autocade opens a live WebSocket connection on port `3180` and waits for the darts to start flying.

If the connection fails, check that the Board Manager is running, the IP address is correct, both devices are on the same network, and port `3180` is not blocked by a firewall.

## Using Autocade

1. Add the people who are about to become far too competitive.
2. Choose Quick Play and select X01, Around the Clock, or Killer.
3. Configure the rules and starting order.
4. Start the game and let the Board Manager feed in each throw.
5. Use the controls in the top-right corner for fullscreen, connection status, board status, settings, or aborting a game.
6. During an active game, open the Manual Entry drawer to enter singles, doubles, triples, Bulls, misses, undo actions, or the end of a turn by hand.

<p align="center">
  <strong>Tip:</strong> the manual drawer is also the fastest way to demo the app without throwing darts at 9 a.m.
</p>

## Status

Autocade is early, opinionated, and deliberately a little excessive.

- X01, Around the Clock, and Killer are the playable game modes.
- Cricket, Gotcha, and Count Up already have slots in the selector, but they are still disabled.
- Tournament mode is present in the interface while the full match flow is still being built.
- The current caller ships with the Northern Terry voice pack. More voices are waiting for their entrance.

## Project Shape

```txt
src/
  App.tsx                         app shell, navigation, and global settings
  components/                     game screens, rules, overlays, and controls
  hooks/                          Board Manager, player, and caller state
  logic/killer.ts                 Killer rules and turn processing
  services/wled.ts                WLED event triggers
  types/                          shared TypeScript types
  utils/checkouts.ts              X01 checkout suggestions
server.js                         Vite development server
screenshots/                      README gallery and project screenshots
```

## Scripts

```sh
npm run dev      # start the development server
npm run build    # type-check and build for production
npm run lint     # check the code with ESLint
npm run preview  # preview the production build
```

## Tech

<p align="center">
  <code>React 19</code>
  <code>TypeScript</code>
  <code>Vite</code>
  <code>Tailwind CSS 4</code>
  <code>Lucide React</code>
  <code>canvas-confetti</code>
  <code>WebSocket</code>
  <code>WLED</code>
</p>

## Requirements

- Node.js `20.19+` or `22.12+`.
- An Autodarts Board Manager running on your local network for live dart input.
- A browser with camera access if you want to capture player photos or victory videos.

## Notes

This is a local-first side project: it runs in your browser, keeps its settings in browser storage, and talks to the Board Manager over your own network. It is built for a real dartboard, a big screen, and the sort of victory celebration that makes the neighbours wonder what happened.

## License

MIT
