import { useState, useEffect, useRef, useCallback } from 'react';
import type { KillerSettings } from './killer-rules';
import { assignKillerNumbers, processKillerThrow, type KillerGameState } from '../logic/killer';
import type { AutodartsState } from '../types/autodarts';
import type { Player } from '../types/player';
import { Skull, Heart, Sword } from 'lucide-react';
import { Dartboard } from './Dartboard';
import { VictoryOverlay } from './victory-overlay';
import { NextPlayerOverlay } from './next-player-overlay';
import wled from '../services/wled';

interface KillerGameProps {
    state: AutodartsState | null;
    settings: KillerSettings;
    players: Player[];
    onPlayAgain: () => void;
    gameViewScale?: number;
    themeGlow?: string;
}

export function KillerGame({ state, settings, players, onPlayAgain, gameViewScale = 100, themeGlow }: KillerGameProps) {
    const [gameState, setGameState] = useState<KillerGameState>({
        players: [],
        turnIndex: 0,
        winner: null,
        log: [],
    });

    // History for undo functionality
    const [, setHistory] = useState<KillerGameState[]>([]);

    const [initialized, setInitialized] = useState(false);
    const lastThrowRef = useRef<number>(0);
    const soundPlayedForThrowRef = useRef<number>(-1); // Track which throw count we played sound for
    const lastTurnIndexRef = useRef<number>(0);

    // Overlays
    const [showNextPlayerOverlay, setShowNextPlayerOverlay] = useState(false);
    const [nextPlayerToShow, setNextPlayerToShow] = useState<Player | null>(null);

    // Initialize
    useEffect(() => {
        if (!initialized && players.length > 0) {
            const assigned = assignKillerNumbers(players, settings);
            setGameState(prev => ({
                ...prev,
                players: assigned,
                turnIndex: 0,
                winner: null,
                log: []
            }));
            setHistory([]); // Reset history
            setInitialized(true);
            lastTurnIndexRef.current = 0;
            // Reset throw tracker when game inits/resets
            lastThrowRef.current = state?.throws?.length || 0;
        }
    }, [players, settings, initialized, state?.throws?.length]);

    // Play "Game On" sound on game start (with ref guard for StrictMode)
    const gameOnPlayedRef = useRef(false);
    useEffect(() => {
        if (!gameOnPlayedRef.current && initialized) {
            gameOnPlayedRef.current = true;
            const soundNum = Math.floor(Math.random() * 4); // 0-3
            const suffix = soundNum === 0 ? '' : soundNum.toString();
            new Audio(`/sounds/Northern_Terry/phrases/Game_on${suffix}.mp3`).play().catch(() => { });
        }
    }, [initialized]);

    // Unified Game Update Logic (handles both Live and Manual events)
    const handleGameUpdate = useCallback((incomingState: AutodartsState) => {
        if (!initialized) return;

        // 1. Handle Turn Change (Takeout)
        if (incomingState.event === 'Takeout finished') {
            setGameState(prev => {
                if (prev.winner) return prev;

                let nextIndex = (prev.turnIndex + 1) % prev.players.length;
                const aliveCount = prev.players.filter(p => p.lives > 0).length;
                if (aliveCount <= 1 && prev.players.length > 1) return prev;

                // Skip eliminated players (lives <= 0)
                while (prev.players[nextIndex].lives <= 0) {
                    nextIndex = (nextIndex + 1) % prev.players.length;
                }

                // Trigger overlay if player changed
                if (nextIndex !== prev.turnIndex && players.length > 1) {
                    const nextPlayer = players.find(p => p.id === prev.players[nextIndex].id);
                    if (nextPlayer) {
                        setNextPlayerToShow(nextPlayer);
                        setShowNextPlayerOverlay(true);
                    }
                }

                return { ...prev, turnIndex: nextIndex };
            });
            setHistory([]); // Clear undo history for new turn
            lastThrowRef.current = 0;
            return;
        }

        // 2. Handle Throws
        const currentThrows = incomingState.throws || [];
        const currentThrowCount = currentThrows.length;

        // Detect New Throw
        if (currentThrowCount > lastThrowRef.current) {
            const newDart = currentThrows[currentThrowCount - 1];

            let eventsToProcess: string[] = [];

            setGameState(prev => {
                if (prev.winner) return prev;

                // Save current state to history before update
                setHistory(h => [...h, prev]);

                const { newState, events } = processKillerThrow(newDart.segment, prev, settings);
                eventsToProcess = events;

                return newState;
            });

            // Play sounds outside of setState to avoid React StrictMode double-firing
            if (soundPlayedForThrowRef.current !== currentThrowCount) {
                soundPlayedForThrowRef.current = currentThrowCount;
                if (eventsToProcess.some(e => e.includes('Eliminated'))) {
                    const soundNum = Math.floor(Math.random() * 7); // 0-6
                    const suffix = soundNum === 0 ? '' : soundNum.toString();
                    new Audio(`/sounds/Northern_Terry/killer/dead${suffix}.mp3`).play().catch(() => { });
                    wled.elimination();
                } else if (eventsToProcess.some(e => e.includes('Became KILLER'))) {
                    const soundNum = Math.floor(Math.random() * 5); // 0-4
                    const suffixes = ['', '1', '2', '3', '5'];
                    new Audio(`/sounds/Northern_Terry/killer/killer${suffixes[soundNum]}.mp3`).play().catch(() => { });
                    wled.killerActivation();
                } else if (eventsToProcess.some(e => e.includes('Hit') && e.includes('-'))) {
                    // Life taken but not eliminated
                    wled.killerLifeTaken();
                }
                // Check for winner
                if (eventsToProcess.some(e => e.includes('wins'))) {
                    wled.killerWin();
                }
            }

            lastThrowRef.current = currentThrowCount;
        }
        // Detect Undo (Throw Removed)
        else if (currentThrowCount < lastThrowRef.current) {
            // Restore from history
            setHistory(prevHistory => {
                if (prevHistory.length === 0) return prevHistory;

                const newHistory = [...prevHistory];
                const previousState = newHistory.pop(); // Remove last state

                if (previousState) {
                    setGameState(previousState);
                }

                return newHistory;
            });

            lastThrowRef.current = currentThrowCount;
        }
    }, [initialized, settings, players]);


    // Effect for Live State Updates
    useEffect(() => {
        if (state) {
            handleGameUpdate(state);
        }
    }, [state, handleGameUpdate]);


    if (!initialized) return <div>Initializing...</div>;

    const currentPlayer = gameState.players[gameState.turnIndex];

    // Calculate partial scale for player list (dampened effect)
    // e.g. if scale is 1.5, player scale is 1 + (0.5 * 0.35) = 1.175
    const playerLimitScale = 1 + ((gameViewScale - 100) / 100) * 0.35;

    // Victory Overlay
    if (gameState.winner) {
        const winner = players.find(p => p.id === gameState.winner?.id);
        if (winner) {
            return (
                <VictoryOverlay
                    winner={winner}
                    onComplete={onPlayAgain}
                // X01 shows overlay then summary.
                />
            );
        }
    }

    // Next Player Overlay
    if (showNextPlayerOverlay && nextPlayerToShow) {
        return (
            <NextPlayerOverlay
                player={nextPlayerToShow}
                onComplete={() => {
                    setShowNextPlayerOverlay(false);
                    setNextPlayerToShow(null);
                }}
            />
        );
    }

    return (
        <div className="h-full w-full flex items-center justify-center p-8 gap-20 relative">

            {/* Left: Main Game Area (Board) */}
            <div className="flex flex-col items-center gap-6" style={{ zoom: gameViewScale / 100 }}>
                {/* Dartboard */}
                <Dartboard
                    size={300}
                    glowColor={themeGlow}
                    highlightSegments={(() => {
                        if (!currentPlayer || currentPlayer.lives <= 0) return [];

                        // Map zone type to prefix
                        const zoneToPrefix = (zone: string) => {
                            if (zone === 'full') return 'full';
                            if (zone === 'double') return 'D';
                            if (zone === 'triple') return 'T';
                            if (zone === 'outer-single') return 'OS';
                            return 'S'; // single
                        };

                        const prefix = zoneToPrefix(settings.mode);

                        if (currentPlayer.isKiller) {
                            // Highlight all alive opponents' numbers
                            return gameState.players
                                .filter(p => p.id !== currentPlayer.id && p.lives > 0)
                                .map(p => `${prefix}${p.number}`);
                        } else {
                            // Highlight own number
                            return [`${prefix}${currentPlayer.number}`];
                        }
                    })()}
                />
            </div>

            {/* Right: Player List (Vertical Stack) */}
            <div className="flex flex-col gap-3 min-w-[300px]" style={{ zoom: playerLimitScale }}>
                {gameState.players.map((p, idx) => {
                    const realPlayer = players.find(rp => rp.id === p.id);
                    const isActive = idx === gameState.turnIndex;
                    const isDead = p.lives <= 0;

                    return (
                        <div
                            key={p.id}
                            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all backdrop-blur-md border-2
                                ${isActive ? 'bg-white/15 text-white border-white animate-glow-pulse z-10' :
                                    isDead ? 'bg-red-900/10 border-red-900/20 opacity-40 grayscale' :
                                        p.isKiller ? 'bg-white/5 text-white border-red-500' :
                                            'bg-white/5 text-zinc-400 border-white/5'}`}
                        >
                            {/* Left: Photo and Info */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-zinc-700/50 overflow-hidden shrink-0 relative">
                                    {realPlayer?.photo ? (
                                        <img src={realPlayer.photo} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg font-bold opacity-50">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {isDead && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Skull size={24} className="text-white" /></div>}
                                </div>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="text-base font-bold uppercase tracking-wider opacity-90 flex items-center gap-2">
                                        {p.name}
                                        {p.isKiller && <Sword size={16} className="text-red-400" />}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: settings.startingLives }).map((_, heartIdx) => (
                                            <Heart
                                                key={heartIdx}
                                                size={16}
                                                className={heartIdx < p.lives
                                                    ? "fill-red-600 text-red-600 border-none"
                                                    : "fill-transparent text-white"
                                                }
                                            />
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-1 mt-1">
                                        {[0, 1, 2].map(idx => (
                                            <div
                                                key={idx}
                                                className={`h-1.5 w-6 rounded-full transition-all ${idx < (p.charge || 0)
                                                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                                    : 'bg-white/10'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Big Target Number */}
                            <div className="text-3xl font-bold font-mono opacity-50 pl-4 border-l border-white/10 ml-auto">
                                #{p.number}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
