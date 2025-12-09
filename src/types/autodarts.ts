// ============================================
// Autodarts Board Manager Data Types
// ============================================
// This file defines the data structures received from the
// Autodarts Board Manager WebSocket API (/api/events)
// ============================================

/**
 * Segment information for a dart throw
 */
export interface AutodartsSegment {
    name: string;        // e.g., "S20", "T19", "D16"
    number: number;      // The segment number (1-20, 25 for bull)
    bed: string;         // e.g., "SingleInner", "Triple", "Double"
    multiplier: number;  // 1, 2, or 3
}

/**
 * Individual dart throw data
 */
export interface AutodartsThrow {
    segment: AutodartsSegment;
    coords: { x: number; y: number };
}

/**
 * Board Manager status values
 */
export type AutodartsStatus =
    | "Throw"
    | "Takeout"
    | "Takeout in progress"
    | "Takeout finished"
    | string;  // Allow other values we haven't seen yet

/**
 * Status to emoji mapping
 */
export const STATUS_EMOJI: Record<string, string> = {
    "Throw": "🎯",
    "Takeout": "✋",
    "Takeout in progress": "✊",
    "Takeout finished": "🎯",
};

/**
 * Get emoji for a status, with fallback
 */
export function getStatusEmoji(status: string): string {
    return STATUS_EMOJI[status] || "⏳";
}

/**
 * State data from the Board Manager
 */
export interface AutodartsState {
    connected: boolean;
    running: boolean;
    status: AutodartsStatus;
    event: string;
    numThrows: number;
    throws: AutodartsThrow[];
}

/**
 * WebSocket message wrapper from Board Manager
 */
export interface AutodartsMessage {
    type: string;  // e.g., "state"
    data: AutodartsState;
}
