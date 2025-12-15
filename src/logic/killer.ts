import type { KillerSettings, ZoneType } from '../components/killer-rules';

export interface KillerPlayerState {
    id: string;
    name: string;
    number: number;
    lives: number;
    isKiller: boolean;
    rank: number | null;
}

export type KillerGameState = {
    players: KillerPlayerState[];
    turnIndex: number; // Index in the players array
    winner: KillerPlayerState | null;
    log: string[];
};

// Logical order of numbers on a dartboard to calculate distance
const BOARD_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

function getDistance(n1: number, n2: number): number {
    const i1 = BOARD_ORDER.indexOf(n1);
    const i2 = BOARD_ORDER.indexOf(n2);
    if (i1 === -1 || i2 === -1) return 0;

    const diff = Math.abs(i1 - i2);
    return Math.min(diff, 20 - diff);
}

export function assignKillerNumbers(players: any[]): KillerPlayerState[] {
    // Available numbers 1-20
    const available = [...Array(20)].map((_, i) => i + 1);
    const assigned: KillerPlayerState[] = [];

    // Simple greedy approach to maximize distance for first few, then random
    // Actually, simple random with checks is robust enough for small player counts
    // But user asked for "spread out".

    // First player gets a random number
    // Subsequent players try to find a number that maximizes min-distance to existing numbers?
    // Or just pick random, check min distance > 2, else retry.

    // Shuffle available to randomize start
    for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
    }

    const pickedNumbers: number[] = [];

    for (const p of players) {
        let bestNumber = -1;

        if (pickedNumbers.length === 0) {
            bestNumber = available[0];
        } else {
            // Find a number from available that has good distance to all picked
            // Try to find one with min distance >= 3
            // If fail, try >= 2, then >= 1
            for (let minOffset = 4; minOffset >= 0; minOffset--) {
                const candidate = available.find(n => {
                    return pickedNumbers.every(existing => getDistance(n, existing) >= minOffset);
                });
                if (candidate) {
                    bestNumber = candidate;
                    break;
                }
            }
            // Fallback if somehow nothing found (shouldn't happen with 20 nums & usually <4 players)
            if (bestNumber === -1) bestNumber = available[0];
        }

        // Remove from available
        const idx = available.indexOf(bestNumber);
        if (idx > -1) available.splice(idx, 1);

        pickedNumbers.push(bestNumber);

        assigned.push({
            id: p.id,
            name: p.name,
            number: bestNumber,
            lives: 3, // Default, will be overridden by settings
            isKiller: false,
            rank: null,
        });
    }

    return assigned;
}

export function getHitValue(segment: { number: number; multiplier: number }, zone: ZoneType): number {
    // Returns the point value (usually 1, 2, 3 for lives) if valid, 0 if not valid in zone
    // Standard map: Single=1, Double=2, Triple=3

    if (segment.number === 25) {
        // Bull logic? Usually Killer uses 1-20. 
        // If someone hits bull? Usually miss unless bull is assigned (rare).
        // Ignoring bull for assignment means it's a miss.
        return 0;
    }

    const { multiplier } = segment;

    // Validate Zone
    // full: Any part
    // outer-single: Outer single only (mult 1) - Wait, usually 'single' means any single
    // single: Any single? Or just single? Standard usually distinguishes inner/outer.
    // Let's interpret rigid zones:

    // 'full' -> Any multiplier 1,2,3 valid.
    // 'outer-single' -> Only outer single valid? Autodarts usually sends single for both.
    // 'single' -> mult 1.
    // 'double' -> mult 2.
    // 'triple' -> mult 3.

    // Valid check:
    let isValid = false;
    if (zone === 'full') isValid = true;
    else if (zone === 'single' && multiplier === 1) isValid = true;
    else if (zone === 'double' && multiplier === 2) isValid = true;
    else if (zone === 'triple' && multiplier === 3) isValid = true;
    else if (zone === 'outer-single') {
        // Autodarts segment doesn't easily distinguish inner/outer single without more data usually?
        // Actually segment name might say '1' or 'S1' vs '1' etc.
        // For now treat 'outer-single' same as 'single' unless we check structure.
        // Simplification: treat as single (multiplier 1).
        if (multiplier === 1) isValid = true;
    }

    if (!isValid) return 0;

    return multiplier; // Return the multiplier as the "damage/heal" amount
}

export const processKillerThrow = (
    currentThrow: { number: number; multiplier: number },
    gameState: KillerGameState,
    settings: KillerSettings
): { newState: KillerGameState; events: string[] } => {
    // Clone state
    const newState = {
        ...gameState,
        players: gameState.players.map(p => ({ ...p }))
    };
    const events: string[] = [];

    const currentPlayer = newState.players[newState.turnIndex];
    if (currentPlayer.lives <= 0) return { newState, events }; // Should be skipped already

    const hitNumber = currentThrow.number;
    const hitMultiplier = currentThrow.multiplier;

    // Find owner
    const ownerIndex = newState.players.findIndex(p => p.number === hitNumber && p.lives > 0);
    const owner = newState.players[ownerIndex];

    if (!owner) {
        events.push('Miss');
        return { newState, events };
    }

    const damage = settings.multiplier ? hitMultiplier : 1;

    // Case 1: Hit Own Number
    if (owner.id === currentPlayer.id) {
        // Check Health Zone validity
        // Note: Rules UI calls it "Health Zone" (was Activation Zone) now.
        // Re-using activationZone setting for this.
        const validHit = getHitValue(currentThrow, settings.activationZone) > 0;

        if (validHit) {
            if (currentPlayer.isKiller && settings.suicide) {
                // Suicide
                currentPlayer.lives -= damage;
                events.push(`Suicide! -${damage}`);
                if (currentPlayer.lives <= 0) {
                    currentPlayer.lives = 0;
                    currentPlayer.rank = newState.players.filter(p => p.lives > 0).length + 1;
                    events.push(`${currentPlayer.name} is Out!`);
                }
            } else {
                // Heal / Activate
                // If healing is allowed (always?)
                const gained = damage;
                currentPlayer.lives += gained;

                if (!currentPlayer.isKiller) {
                    currentPlayer.isKiller = true;
                    events.push(`Became KILLER! +${gained}`);
                } else {
                    events.push(`Healed +${gained}`);
                }
            }
        } else {
            events.push('Invalid Zone');
        }
    }
    // Case 2: Hit Opponent
    else {
        // Must be Killer to kill
        if (currentPlayer.isKiller) {
            // Check Kill Zone validity
            const validHit = getHitValue(currentThrow, settings.killZone) > 0;

            if (validHit) {
                owner.lives -= damage;
                events.push(`Hit ${owner.name}! -${damage}`);
                if (owner.lives <= 0) {
                    owner.lives = 0;
                    owner.rank = newState.players.filter(p => p.lives > 0).length + 1;
                    events.push(`${owner.name} Eliminated!`);
                }
            } else {
                events.push('Safe (Zone)');
            }
        } else {
            events.push('Must be Killer');
        }
    }

    // Check Winner
    const active = newState.players.filter(p => p.lives > 0);
    if (active.length === 1 && newState.players.length > 1) { // Ensure >1 starter so solo play doesn't instant win
        newState.winner = active[0];
        active[0].rank = 1;
        events.push(`${active[0].name} Wins!`);
    }

    return { newState, events };
};
