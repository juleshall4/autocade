/**
 * Round Robin Tournament Logic
 * 
 * Generates a round-robin schedule where each player plays every other player exactly once.
 * Uses the circle method to optimize scheduling so that no player plays twice in a row when possible.
 */

export interface TournamentMatch {
    id: string;
    player1Id: string;
    player2Id: string;
    winnerId: string | null;
    played: boolean;
    round: number;
}

export interface PlayerStanding {
    playerId: string;
    playerName: string;
    points: number;
    wins: number;
    losses: number;
    matchesPlayed: number;
}

export interface RoundRobinTournament {
    matches: TournamentMatch[];
    currentMatchIndex: number;
    standings: Map<string, PlayerStanding>;
    isComplete: boolean;
}

/**
 * Generate a round-robin schedule using the circle method.
 * This ensures no player plays twice in a row when possible.
 * 
 * @param players Array of player objects with id and name
 * @returns Array of matches in optimized order
 */
export function generateRoundRobinSchedule(
    players: { id: string; name: string }[]
): TournamentMatch[] {
    const n = players.length;

    if (n < 2) {
        return [];
    }

    // Shuffle players for random seeding
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    // If odd number of players, add a "bye" placeholder
    const playerList = n % 2 === 1
        ? [...shuffledPlayers, { id: 'BYE', name: 'BYE' }]
        : shuffledPlayers;

    const numPlayers = playerList.length;
    const numRounds = numPlayers - 1;
    const matchesPerRound = numPlayers / 2;

    const matches: TournamentMatch[] = [];

    // Circle method: fix first player, rotate others
    // This generates rounds where no player plays twice in a row
    for (let round = 0; round < numRounds; round++) {
        const roundMatches: TournamentMatch[] = [];

        for (let match = 0; match < matchesPerRound; match++) {
            let player1Index: number;
            let player2Index: number;

            if (match === 0) {
                // First match: fixed player vs rotating player
                player1Index = 0;
                player2Index = numPlayers - 1 - round;
                if (player2Index === 0) player2Index = numPlayers - 1;
            } else {
                // Calculate rotating positions
                player1Index = (round + match) % (numPlayers - 1);
                if (player1Index === 0) player1Index = numPlayers - 1;

                player2Index = (round + numPlayers - 1 - match) % (numPlayers - 1);
                if (player2Index === 0) player2Index = numPlayers - 1;
            }

            // Skip bye matches
            if (playerList[player1Index].id === 'BYE' || playerList[player2Index].id === 'BYE') {
                continue;
            }

            roundMatches.push({
                id: `match-${round}-${match}`,
                player1Id: playerList[player1Index].id,
                player2Id: playerList[player2Index].id,
                winnerId: null,
                played: false,
                round: round + 1,
            });
        }

        matches.push(...roundMatches);
    }

    // Reorder matches to minimize back-to-back play
    return optimizeMatchOrder(matches);
}

/**
 * Reorder matches to ensure no player plays twice in a row when possible.
 */
function optimizeMatchOrder(matches: TournamentMatch[]): TournamentMatch[] {
    if (matches.length <= 1) return matches;

    const result: TournamentMatch[] = [];
    const remaining = [...matches];

    // Start with first match
    result.push(remaining.shift()!);

    while (remaining.length > 0) {
        const lastMatch = result[result.length - 1];
        const lastPlayers = new Set([lastMatch.player1Id, lastMatch.player2Id]);

        // Find a match where neither player played in the last match
        let bestIndex = -1;
        for (let i = 0; i < remaining.length; i++) {
            const match = remaining[i];
            if (!lastPlayers.has(match.player1Id) && !lastPlayers.has(match.player2Id)) {
                bestIndex = i;
                break;
            }
        }

        // If no ideal match found, just take the first available
        if (bestIndex === -1) {
            bestIndex = 0;
        }

        result.push(remaining.splice(bestIndex, 1)[0]);
    }

    return result;
}

/**
 * Initialize a new round-robin tournament.
 */
export function initializeTournament(
    players: { id: string; name: string }[]
): RoundRobinTournament {
    const matches = generateRoundRobinSchedule(players);
    const standings = new Map<string, PlayerStanding>();

    // Initialize standings for each player
    for (const player of players) {
        standings.set(player.id, {
            playerId: player.id,
            playerName: player.name,
            points: 0,
            wins: 0,
            losses: 0,
            matchesPlayed: 0,
        });
    }

    return {
        matches,
        currentMatchIndex: 0,
        standings,
        isComplete: matches.length === 0,
    };
}

/**
 * Record the result of a match and update standings.
 */
export function recordMatchResult(
    tournament: RoundRobinTournament,
    winnerId: string
): RoundRobinTournament {
    const currentMatch = tournament.matches[tournament.currentMatchIndex];

    if (!currentMatch || currentMatch.played) {
        return tournament;
    }

    // Determine loser
    const loserId = winnerId === currentMatch.player1Id
        ? currentMatch.player2Id
        : currentMatch.player1Id;

    // Update match
    const updatedMatches = [...tournament.matches];
    updatedMatches[tournament.currentMatchIndex] = {
        ...currentMatch,
        winnerId,
        played: true,
    };

    // Update standings
    const newStandings = new Map(tournament.standings);

    const winnerStanding = newStandings.get(winnerId);
    if (winnerStanding) {
        newStandings.set(winnerId, {
            ...winnerStanding,
            points: winnerStanding.points + 1,
            wins: winnerStanding.wins + 1,
            matchesPlayed: winnerStanding.matchesPlayed + 1,
        });
    }

    const loserStanding = newStandings.get(loserId);
    if (loserStanding) {
        newStandings.set(loserId, {
            ...loserStanding,
            losses: loserStanding.losses + 1,
            matchesPlayed: loserStanding.matchesPlayed + 1,
        });
    }

    const nextMatchIndex = tournament.currentMatchIndex + 1;
    const isComplete = nextMatchIndex >= updatedMatches.length;

    return {
        matches: updatedMatches,
        currentMatchIndex: nextMatchIndex,
        standings: newStandings,
        isComplete,
    };
}

/**
 * Get sorted standings (by points, then by wins).
 */
export function getSortedStandings(tournament: RoundRobinTournament): PlayerStanding[] {
    const standings = Array.from(tournament.standings.values());

    return standings.sort((a, b) => {
        // Sort by points first (descending)
        if (b.points !== a.points) {
            return b.points - a.points;
        }
        // Then by wins (descending)
        return b.wins - a.wins;
    });
}

/**
 * Get the current match to be played.
 */
export function getCurrentMatch(tournament: RoundRobinTournament): TournamentMatch | null {
    if (tournament.isComplete || tournament.currentMatchIndex >= tournament.matches.length) {
        return null;
    }
    return tournament.matches[tournament.currentMatchIndex];
}

/**
 * Get the players for the current match.
 */
export function getCurrentMatchPlayers(
    tournament: RoundRobinTournament,
    allPlayers: { id: string; name: string }[]
): { player1: typeof allPlayers[0], player2: typeof allPlayers[0] } | null {
    const match = getCurrentMatch(tournament);
    if (!match) return null;

    const player1 = allPlayers.find(p => p.id === match.player1Id);
    const player2 = allPlayers.find(p => p.id === match.player2Id);

    if (!player1 || !player2) return null;

    return { player1, player2 };
}
