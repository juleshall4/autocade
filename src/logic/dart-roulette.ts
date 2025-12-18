/**
 * Dart Roulette - A drinking game where players take turns
 * throwing at random targets to make other players drink.
 * Win condition: First to 10 points wins.
 */

export interface RoulettePlayer {
    id: string;
    name: string;
    timesTargeted: number;
    score: number;
}

export type RoulettePhase = 'lobby' | 'spin' | 'aim' | 'result';

export type HitType = 'miss' | 'single' | 'double' | 'triple' | 'bullseye';

export interface RouletteResult {
    hitType: HitType;
    shooterId: string;
    shooterName: string;
    victimName: string;
    targetNumber: number;
    penalty: string;
    isJailbreak: boolean;
    isBackfire: boolean;
    pointsScored: number;
}

export interface RouletteState {
    players: RoulettePlayer[];
    shooterIndex: number;
    targetNumber: number | null;
    victimId: string | null;
    phase: RoulettePhase;
    lastResult: RouletteResult | null;
    winnerId: string | null;
}

export interface RouletteSettings {
    singleSips: number;
    doubleSips: number;
    tripleAction: 'down-it' | 'sips';
    tripleSips: number;
    backfireSips: number;
}

const WIN_SCORE = 10;

/**
 * Initialize a new Dart Roulette game
 */
export function initializeRoulette(players: { id: string; name: string }[]): RouletteState {
    return {
        players: players.map(p => ({
            id: p.id,
            name: p.name,
            timesTargeted: 0,
            score: 0,
        })),
        shooterIndex: 0,
        targetNumber: null,
        victimId: null,
        phase: 'lobby',
        lastResult: null,
        winnerId: null,
    };
}

/**
 * Spin the roulette - pick a random shooter, target number, and victim
 * Fairness: victims are picked from players who have been targeted the least
 */
export function spinRoulette(state: RouletteState): RouletteState {
    // Pick random shooter
    const shooterIndex = Math.floor(Math.random() * state.players.length);
    const shooter = state.players[shooterIndex];

    // Pick random target number (1-20)
    const targetNumber = Math.floor(Math.random() * 20) + 1;

    // Find eligible victims (everyone except shooter)
    const eligiblePlayers = state.players.filter(p => p.id !== shooter.id);

    if (eligiblePlayers.length === 0) {
        // Edge case: only one player (shouldn't happen in real game)
        return { ...state, shooterIndex, targetNumber, victimId: null, phase: 'spin' };
    }

    // Fairness: find minimum times targeted among eligible players
    const minTargeted = Math.min(...eligiblePlayers.map(p => p.timesTargeted));

    // Pick randomly from those with minimum targeting
    const leastTargeted = eligiblePlayers.filter(p => p.timesTargeted === minTargeted);
    const victimIdx = Math.floor(Math.random() * leastTargeted.length);
    const victim = leastTargeted[victimIdx];

    return {
        ...state,
        shooterIndex,
        targetNumber,
        victimId: victim.id,
        phase: 'spin', // Will transition to 'aim' after animation
    };
}

/**
 * Transition from spin to aim phase
 */
export function startAimPhase(state: RouletteState): RouletteState {
    return { ...state, phase: 'aim' };
}

/**
 * Judge a dart throw and calculate the result
 */
export function judgeThrow(
    state: RouletteState,
    segment: { number: number; multiplier: number },
    settings: RouletteSettings
): RouletteState {
    const shooter = state.players[state.shooterIndex];
    const victim = state.players.find(p => p.id === state.victimId);
    const targetNumber = state.targetNumber!;

    let hitType: HitType;
    let penalty: string;
    let isJailbreak = false;
    let isBackfire = false;
    let pointsScored = 0;

    // Check for bullseye (jailbreak)
    if (segment.number === 25) {
        hitType = 'bullseye';
        penalty = '🎉 JAILBREAK! Everyone finishes their drink!';
        isJailbreak = true;
        // Bullseye doesn't score points
    }
    // Check if hit the target number
    else if (segment.number === targetNumber) {
        pointsScored = segment.multiplier; // 1, 2, or 3 points

        if (segment.multiplier === 3) {
            hitType = 'triple';
            if (settings.tripleAction === 'down-it') {
                penalty = `🍺 ${victim?.name || 'Victim'} has to DOWN IT!`;
            } else {
                penalty = `🍺 ${victim?.name || 'Victim'} takes ${settings.tripleSips} sips!`;
            }
        } else if (segment.multiplier === 2) {
            hitType = 'double';
            penalty = `🍺 ${victim?.name || 'Victim'} takes ${settings.doubleSips} sips!`;
        } else {
            hitType = 'single';
            penalty = `🍺 ${victim?.name || 'Victim'} takes ${settings.singleSips} sip${settings.singleSips > 1 ? 's' : ''}!`;
        }
    }
    // Miss - backfire
    else {
        hitType = 'miss';
        penalty = `💥 BACKFIRE! ${shooter.name} takes ${settings.backfireSips} sip${settings.backfireSips > 1 ? 's' : ''}!`;
        isBackfire = true;
    }

    // Update players: victim's times targeted + shooter's score
    const newPlayers = state.players.map(p => {
        // Update shooter's score
        if (p.id === shooter.id && pointsScored > 0) {
            return { ...p, score: p.score + pointsScored };
        }
        // Update victim's times targeted
        if (p.id === state.victimId && !isBackfire && !isJailbreak) {
            return { ...p, timesTargeted: p.timesTargeted + 1 };
        }
        return p;
    });

    // Check for winner
    const updatedShooter = newPlayers.find(p => p.id === shooter.id)!;
    const winnerId = updatedShooter.score >= WIN_SCORE ? updatedShooter.id : null;

    const result: RouletteResult = {
        hitType,
        shooterId: shooter.id,
        shooterName: shooter.name,
        victimName: victim?.name || '',
        targetNumber,
        penalty,
        isJailbreak,
        isBackfire,
        pointsScored,
    };

    return {
        ...state,
        players: newPlayers,
        phase: 'result',
        lastResult: result,
        winnerId,
    };
}

/**
 * Advance to next round (shooter is picked randomly on spin)
 */
export function nextRound(state: RouletteState): RouletteState {
    return {
        ...state,
        targetNumber: null,
        victimId: null,
        phase: 'lobby',
        lastResult: null,
    };
}

/**
 * Get the current shooter
 */
export function getCurrentShooter(state: RouletteState): RoulettePlayer {
    return state.players[state.shooterIndex];
}

/**
 * Get the current victim
 */
export function getCurrentVictim(state: RouletteState): RoulettePlayer | null {
    if (!state.victimId) return null;
    return state.players.find(p => p.id === state.victimId) || null;
}

/**
 * Get sorted player standings by score
 */
export function getStandings(state: RouletteState): RoulettePlayer[] {
    return [...state.players].sort((a, b) => b.score - a.score);
}
