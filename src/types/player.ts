// Player types - shared across all game modes

export interface PlayerStats {
    gamesPlayed: number;
    gamesWon: number;
    legsWon: number;
    setsWon: number;
    totalDarts: number;
    highestTurn: number;
}

export interface Player {
    id: string;
    name: string;
    isActive: boolean;
    photo?: string;        // Base64 encoded photo
    victoryVideo?: string; // Base64 encoded video
    stats: PlayerStats;
}

export const defaultStats: PlayerStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    legsWon: 0,
    setsWon: 0,
    totalDarts: 0,
    highestTurn: 0,
};

export interface PlayerGameState {
    playerId: string;
    score: number;
}
