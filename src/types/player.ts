// Player types - shared across all game modes

export interface Player {
    id: string;
    name: string;
    isActive: boolean;
    photo?: string; // Base64 encoded photo
}

export interface PlayerGameState {
    playerId: string;
    score: number;  // Current score (remaining in X01, or points in Cricket)
    // Add more game-specific state as needed
}
