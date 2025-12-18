import type { KillerSettings, ZoneType } from '../components/killer-rules';

export interface KillerPlayerState {
    id: string;
    name: string;
    number: number;
    lives: number;
    charge: number;
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

export function assignKillerNumbers(players: any[], settings: KillerSettings): KillerPlayerState[] {
    // Available numbers 1-20
    const available = [...Array(20)].map((_, i) => i + 1);
    const assigned: KillerPlayerState[] = [];

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
            for (let minOffset = 4; minOffset >= 0; minOffset--) {
                const candidate = available.find(n => {
                    return pickedNumbers.every(existing => getDistance(n, existing) >= minOffset);
                });
                if (candidate) {
                    bestNumber = candidate;
                    break;
                }
            }
            if (bestNumber === -1) bestNumber = available[0];
        }

        const idx = available.indexOf(bestNumber);
        if (idx > -1) available.splice(idx, 1);
        pickedNumbers.push(bestNumber);

        assigned.push({
            id: p.id,
            name: p.name,
            number: bestNumber,
            lives: settings.startingLives, // Start with N hearts
            charge: 0, // Start with 0 charge
            isKiller: false,
            rank: null,
        });
    }

    return assigned;
}

export function getHitValue(segment: { number: number; multiplier: number }, zone: ZoneType): number {
    if (segment.number === 25) return 0;
    const { multiplier } = segment;

    let isValid = false;
    if (zone === 'full') isValid = true;
    else if (zone === 'single' && multiplier === 1) isValid = true;
    else if (zone === 'double' && multiplier === 2) isValid = true;
    else if (zone === 'triple' && multiplier === 3) isValid = true;
    else if (zone === 'outer-single' && multiplier === 1) isValid = true;

    if (!isValid) return 0;
    return multiplier;
}

export const processKillerThrow = (
    currentThrow: { number: number; multiplier: number },
    gameState: KillerGameState,
    settings: KillerSettings
): { newState: KillerGameState; events: string[] } => {
    const newState = {
        ...gameState,
        players: gameState.players.map(p => ({ ...p }))
    };
    const events: string[] = [];

    const currentPlayer = newState.players[newState.turnIndex];
    if (currentPlayer.lives <= 0) return { newState, events }; // Eliminated players skipped

    const hitNumber = currentThrow.number;
    const hitMultiplier = currentThrow.multiplier;
    const KILLER_ACTIVATION_HITS = 3;

    // Find owner - anyone who is not eliminated
    const ownerIndex = newState.players.findIndex(p => p.number === hitNumber && p.lives > 0);
    const owner = newState.players[ownerIndex];

    if (!owner) {
        events.push('Miss');
        return { newState, events };
    }

    const damage = settings.multiplier ? hitMultiplier : 1;

    // Case 1: Hit Own Number
    if (owner.id === currentPlayer.id) {
        const validHit = getHitValue(currentThrow, settings.mode) > 0;

        if (validHit) {
            if (currentPlayer.isKiller && settings.suicide) {
                // Suicide logic if enabled
                currentPlayer.lives -= damage;
                events.push(`Suicide! -${damage}`);
                if (currentPlayer.lives <= 0) {
                    currentPlayer.isKiller = false; // Dead
                    events.push('Suicide Elimination!');
                }
            } else if (!currentPlayer.isKiller) {
                // Charge Up
                currentPlayer.charge += damage;
                if (currentPlayer.charge >= KILLER_ACTIVATION_HITS) {
                    currentPlayer.charge = KILLER_ACTIVATION_HITS;
                    currentPlayer.isKiller = true;
                    events.push(`Became KILLER!`);
                } else {
                    events.push(`Charge +${damage} (${currentPlayer.charge}/${KILLER_ACTIVATION_HITS})`);
                }
            } else {
                events.push('Already Killer');
            }
        } else {
            events.push('Invalid Zone');
        }
    }
    // Case 2: Hit Opponent
    else {
        if (currentPlayer.isKiller) {
            const validHit = getHitValue(currentThrow, settings.mode) > 0;

            if (validHit) {
                // Check if target is also a Killer (Killer vs Killer)
                if (owner.isKiller) {
                    // Apply killerVsKiller logic
                    if (settings.killerVsKiller === 'life' || settings.killerVsKiller === 'both') {
                        owner.lives -= damage;
                        events.push(`Hit Killer ${owner.name}! -${damage}`);
                    }
                    if (settings.killerVsKiller === 'status' || settings.killerVsKiller === 'both') {
                        // Only reduce charge by damage amount, not all at once
                        owner.charge = Math.max(0, owner.charge - damage);
                        if (owner.charge <= 0) {
                            owner.isKiller = false;
                            events.push(`${owner.name} lost Killer status!`);
                        } else {
                            events.push(`${owner.name} charge -${damage} (${owner.charge}/3)`);
                        }
                    }
                } else {
                    // Normal hit on non-killer
                    owner.lives -= damage;
                    events.push(`Hit ${owner.name}! -${damage}`);
                }

                // Elimination Check
                if (owner.lives <= 0) {
                    owner.lives = 0; // Mark as dead (0 lives)
                    owner.isKiller = false;
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
    if (active.length === 1 && newState.players.length > 1) {
        newState.winner = active[0];
        active[0].rank = 1;
        events.push(`${active[0].name} Wins!`);
    }

    return { newState, events };
};
