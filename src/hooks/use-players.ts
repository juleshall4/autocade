import { useState, useCallback, useEffect } from 'react';
import type { Player } from '../types/player';
import { defaultStats } from '../types/player';
import { videoStorage } from '../services/video-storage';

const STORAGE_KEY = 'autocade-players';

// Generate unique ID
function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

// Migrate old player data to include stats (without victoryVideo - loaded separately)
function migratePlayer(player: Partial<Player>): Player {
    return {
        id: player.id || generateId(),
        name: player.name || 'Player',
        isActive: player.isActive ?? true,
        photo: player.photo,
        // Don't include victoryVideo here - it's loaded from IndexedDB
        stats: player.stats || { ...defaultStats },
    };
}

// Load players from localStorage (without videos)
function loadPlayersFromStorage(): Player[] {
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

// Save players to localStorage (without videos to avoid size issues)
function savePlayersToStorage(players: Player[]): void {
    try {
        // Strip victoryVideo before saving to localStorage
        const playersWithoutVideos = players.map(p => {
            const { victoryVideo, ...rest } = p;
            // Track if player has a video (boolean flag, not the data)
            return { ...rest, hasVictoryVideo: !!victoryVideo };
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(playersWithoutVideos));
    } catch (e) {
        console.error('Failed to save players to storage:', e);
    }
}

export function usePlayers() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load: get players from localStorage, then hydrate with videos from IndexedDB
    useEffect(() => {
        async function loadPlayersWithVideos() {
            const storedPlayers = loadPlayersFromStorage();

            try {
                // Load all videos from IndexedDB
                const videos = await videoStorage.loadAll();

                // Hydrate players with their videos
                const hydratedPlayers = storedPlayers.map(player => ({
                    ...player,
                    victoryVideo: videos.get(player.id) || undefined,
                }));

                setPlayers(hydratedPlayers);
            } catch (error) {
                console.error('Failed to load videos:', error);
                setPlayers(storedPlayers);
            }

            setIsLoading(false);
        }

        loadPlayersWithVideos();
    }, []);

    // Save to localStorage whenever players change (but not on initial load)
    useEffect(() => {
        if (!isLoading && players.length > 0) {
            savePlayersToStorage(players);
        }
    }, [players, isLoading]);

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
        // Also delete their video from IndexedDB
        videoStorage.delete(id).catch(console.error);
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

    // Update player victory video (saves to IndexedDB)
    const updateVictoryVideo = useCallback((id: string, victoryVideo: string) => {
        if (victoryVideo) {
            // Save to IndexedDB
            videoStorage.save(id, victoryVideo).then(() => {
                setPlayers(prev =>
                    prev.map(p => (p.id === id ? { ...p, victoryVideo } : p))
                );
            }).catch((error) => {
                console.error('Failed to save video:', error);
            });
        } else {
            // Delete from IndexedDB
            videoStorage.delete(id).then(() => {
                setPlayers(prev =>
                    prev.map(p => (p.id === id ? { ...p, victoryVideo: undefined } : p))
                );
            }).catch((error) => {
                console.error('Failed to delete video:', error);
            });
        }
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
        isLoading,
        addPlayer,
        removePlayer,
        updatePlayerName,
        updatePlayerPhoto,
        updateVictoryVideo,
        togglePlayerActive,
        reorderPlayers,
    };
}
