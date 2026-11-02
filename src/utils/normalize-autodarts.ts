import type { AutodartsState, AutodartsThrow } from '../types/autodarts';

const statusNames: Record<string, string> = {
    throw: 'Throw',
    takeout: 'Takeout',
    takeoutInProgress: 'Takeout in progress',
    takeoutFinished: 'Takeout finished',
};
const eventNames: Record<string, string> = {
    throwDetected: 'Throw detected',
    throwRemoved: 'Throw removed',
    takeoutStarted: 'Takeout in progress',
    takeoutFinished: 'Takeout finished',
    reset: 'Reset',
};

function record(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown> : null;
}
function finite(value: unknown, fallback = 0): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

// Board Manager 2.x flattened the segment and coordinates of each throw.
// Keep the original nested format compatible for older managers and simulations.
export function normalizeAutodartsState(value: unknown): AutodartsState | null {
    const state = record(value);
    if (!state || !Array.isArray(state.throws)) return null;
    const throws: AutodartsThrow[] = [];
    for (const item of state.throws) {
        const dart = record(item);
        if (!dart) return null;
        const segment = record(dart.segment) ?? dart;
        const name = segment.name ?? segment.segmentName;
        const number = segment.number ?? segment.segmentNumber;
        const multiplier = segment.multiplier;
        if (typeof name !== 'string' || typeof number !== 'number' ||
            !Number.isFinite(number) || typeof multiplier !== 'number' ||
            !Number.isFinite(multiplier)) return null;
        const coords = record(dart.coords);
        throws.push({
            segment: {
                name, number, multiplier,
                bed: typeof segment.bed === 'string' ? segment.bed : '',
            },
            coords: { x: finite(coords?.x ?? dart.coordsX), y: finite(coords?.y ?? dart.coordsY) },
        });
    }
    const status = typeof state.status === 'string' ? state.status : '';
    const event = typeof state.event === 'string' ? state.event : '';
    return {
        connected: state.connected === true,
        running: state.running === true,
        status: statusNames[status] ?? status,
        event: eventNames[event] ?? event,
        numThrows: throws.length,
        throws,
    };
}
