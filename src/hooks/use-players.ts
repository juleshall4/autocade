import { useState, useCallback, useEffect } from 'react';
import type { Player } from '../types/player';
import { defaultStats } from '../types/player';

const STORAGE_KEY = 'autocade-players';

// Generate unique ID
function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

// Migrate old player data to include stats
function migratePlayer(player: Partial<Player>): Player {
    return {
        id: player.id || generateId(),
        name: player.name || 'Player',
        isActive: player.isActive ?? true,
        photo: player.photo,
        victoryVideo: player.victoryVideo,
        stats: player.stats || { ...defaultStats },
    };
}

// Load players from localStorage
function loadPlayers(): Player[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Migrate old data format
            return parsed.map(migratePlayer);
        }
    } catch (e) {
        console.error('Failed to load players from storage:', e);
    }
    // Default player if nothing saved
    return [{ id: generateId(), name: 'Player 1', isActive: true, stats: { ...defaultStats } }];
}

// Save players to localStorage
function savePlayers(players: Player[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    } catch (e) {
        console.error('Failed to save players to storage:', e);
    }
}

export function usePlayers() {
    const [players, setPlayers] = useState<Player[]>(loadPlayers);

    // Save to localStorage whenever players change
    useEffect(() => {
        savePlayers(players);
    }, [players]);

    // Add a new player
    const addPlayer = useCallback(() => {
        const newPlayer: Player = {
            id: generateId(),
            name: `Player ${players.length + 1}`,
            isActive: true,
            stats: { ...defaultStats },
        };
        setPlayers(prev => [...prev, newPlayer]);
    }, [players.length]);

    // Remove a player by ID
    const removePlayer = useCallback((id: string) => {
        setPlayers(prev => prev.filter(p => p.id !== id));
    }, []);

    // Update player name
    const updatePlayerName = useCallback((id: string, name: string) => {
        setPlayers(prev =>
            prev.map(p => (p.id === id ? { ...p, name } : p))
        );
    }, []);

    // Update player photo
    const updatePlayerPhoto = useCallback((id: string, photo: string) => {
        setPlayers(prev =>
            prev.map(p => (p.id === id ? { ...p, photo } : p))
        );
    }, []);

    // Update player victory video
    const updateVictoryVideo = useCallback((id: string, victoryVideo: string) => {
        setPlayers(prev =>
            prev.map(p => (p.id === id ? { ...p, victoryVideo } : p))
        );
    }, []);

    // Toggle player active state
    const togglePlayerActive = useCallback((id: string) => {
        setPlayers(prev =>
            prev.map(p => (p.id === id ? { ...p, isActive: !p.isActive } : p))
        );
    }, []);

    // Reorder players (move from one index to another)
    const reorderPlayers = useCallback((fromIndex: number, toIndex: number) => {
        setPlayers(prev => {
            const result = [...prev];
            const [removed] = result.splice(fromIndex, 1);
            result.splice(toIndex, 0, removed);
            return result;
        });
    }, []);

    // Get only active players
    const activePlayers = players.filter(p => p.isActive);

    return {
        players,
        activePlayers,
        addPlayer,
        removePlayer,
        updatePlayerName,
        updatePlayerPhoto,
        updateVictoryVideo,
        togglePlayerActive,
        reorderPlayers,
    };
}
