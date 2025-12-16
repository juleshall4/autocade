/**
 * WLED Service for triggering light effects via presets
 * 
 * WLED API:
 * - http://<IP>/json/state - POST to set state
 * - http://<IP>/presets.json - GET to fetch presets
 * - State: { ps: <preset_id> } - Activate a preset
 */

import type { WledSettings } from '../components/settings';

// Get WLED settings from localStorage
function getWledSettings(): WledSettings | null {
    try {
        const saved = localStorage.getItem('autocade-wled');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load WLED settings:', e);
    }
    return null;
}

// Send state to a single WLED device
async function sendToDevice(ip: string, state: object): Promise<boolean> {
    if (!ip) return false;

    try {
        const response = await fetch(`http://${ip}/json/state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state),
        });
        return response.ok;
    } catch (e) {
        console.error(`WLED request failed for ${ip}:`, e);
        return false;
    }
}

// Send to specific channel (1 = ip, 2 = ip2)
async function sendToChannel(channel: 1 | 2, state: object): Promise<void> {
    const settings = getWledSettings();
    if (!settings?.enabled) return;

    const ip = channel === 1 ? settings.ip : settings.ip2;
    if (ip) await sendToDevice(ip, state);
}

// Send to all configured channels
async function sendToAll(state: object): Promise<void> {
    const settings = getWledSettings();
    if (!settings?.enabled) return;

    const promises: Promise<boolean>[] = [];
    if (settings.ip) promises.push(sendToDevice(settings.ip, state));
    if (settings.ip2) promises.push(sendToDevice(settings.ip2, state));

    await Promise.allSettled(promises);
}

// ============ PRESET-BASED TRIGGERS ============

/**
 * Trigger a preset by ID
 * @param presetId - The WLED preset ID to activate
 * @param channel - 1 for dartboard, 2 for TV, undefined for both
 * @param duration - How long before reverting to default (0 = no revert)
 */
export async function triggerPreset(presetId: number, channel?: 1 | 2, duration = 3000): Promise<void> {
    const state = { ps: presetId };

    if (channel) {
        await sendToChannel(channel, state);
    } else {
        await sendToAll(state);
    }

    // Revert to default after duration (if set)
    if (duration > 0) {
        setTimeout(() => revertToDefault(channel), duration);
    }
}

/**
 * Revert to default lighting preset
 */
export async function revertToDefault(channel?: 1 | 2): Promise<void> {
    const settings = getWledSettings();
    if (!settings?.enabled) return;

    const defaultPreset = settings.presets?.default;
    if (defaultPreset !== null && defaultPreset !== undefined) {
        const state = { ps: defaultPreset };
        if (channel) {
            await sendToChannel(channel, state);
        } else {
            await sendToAll(state);
        }
    }
}

// ============ FALLBACK EFFECTS (when no preset configured) ============

async function triggerFallbackRainbow(channel?: 1 | 2, durationMs = 3000): Promise<void> {
    const state = {
        on: true,
        bri: 255,
        seg: [{ fx: 9, sx: 128, ix: 128 }] // fx: 9 = Rainbow
    };

    if (channel) {
        await sendToChannel(channel, state);
    } else {
        await sendToAll(state);
    }

    setTimeout(() => revertToDefault(channel), durationMs);
}

async function triggerFallbackColor(color: [number, number, number], channel?: 1 | 2, durationMs = 2000): Promise<void> {
    const state = {
        on: true,
        bri: 255,
        seg: [{ fx: 0, col: [color] }]
    };

    if (channel) {
        await sendToChannel(channel, state);
    } else {
        await sendToAll(state);
    }

    setTimeout(() => revertToDefault(channel), durationMs);
}

// ============ GAME EVENT HELPERS ============

// Helper to trigger preset or fallback (reads duration from settings)
function createEventTrigger(
    presetKey: keyof NonNullable<WledSettings['presets']>,
    durationKey: keyof NonNullable<WledSettings['durations']> | null,
    fallbackFn: (durationMs: number) => Promise<void>,
    defaultDurationMs = 3000
) {
    return async () => {
        const settings = getWledSettings();
        if (!settings?.enabled) return;

        // Get duration from settings (stored in seconds, convert to ms)
        const durationMs = durationKey && settings.durations?.[durationKey]
            ? settings.durations[durationKey] * 1000
            : defaultDurationMs;

        const presetId = settings.presets?.[presetKey];
        if (presetId !== null && presetId !== undefined) {
            await triggerPreset(presetId, 1, durationMs); // Channel 1 = dartboard
        } else {
            await fallbackFn(durationMs);
        }
    };
}

export const wled = {
    // General
    gameOn: createEventTrigger('gameOn', 'gameOn', (d) => triggerFallbackColor([0, 255, 0], 1, d), 3000),

    // X01
    checkout: createEventTrigger('x01Checkout', 'x01Checkout', (d) => triggerFallbackRainbow(1, d), 5000),
    bust: createEventTrigger('x01Bust', 'x01Bust', (d) => triggerFallbackColor([255, 0, 0], 1, d), 2000),
    oneEighty: createEventTrigger('x01OneEighty', 'x01OneEighty', (d) => triggerFallbackRainbow(1, d), 4000),

    // Killer
    killerActivation: createEventTrigger('killerActivation', 'killerActivation', (d) => triggerFallbackColor([255, 0, 0], 1, d), 3000),
    killerLifeTaken: createEventTrigger('killerLifeTaken', 'killerLifeTaken', (d) => triggerFallbackColor([255, 50, 0], 1, d), 2000),
    elimination: createEventTrigger('killerElimination', 'killerElimination', (d) => triggerFallbackColor([255, 100, 0], 1, d), 3000),
    killerWin: createEventTrigger('killerWin', 'killerWin', (d) => triggerFallbackRainbow(1, d), 5000),

    // Around The Clock
    targetHit: createEventTrigger('atcTargetHit', 'atcTargetHit', (d) => triggerFallbackColor([0, 255, 0], 1, d), 500),
    atcWin: createEventTrigger('atcWin', 'atcWin', (d) => triggerFallbackRainbow(1, d), 5000),

    // Generic (legacy)
    gameStart: () => triggerFallbackColor([0, 255, 0], 1, 2000),
    gameWin: () => triggerFallbackRainbow(1, 5000),

    // Manual controls
    preset: triggerPreset,
    reset: revertToDefault,
};

export default wled;
