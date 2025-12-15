import { useState, useEffect, useRef, useCallback } from 'react';
import type { KillerSettings } from './killer-rules';
import { assignKillerNumbers, processKillerThrow, type KillerGameState } from '../logic/killer';
import type { AutodartsState } from '../types/autodarts';
import type { Player } from '../types/player';
import { Skull, Heart, Sword } from 'lucide-react';
import { Dartboard } from './Dartboard';
import { VictoryOverlay } from './victory-overlay';
import { NextPlayerOverlay } from './next-player-overlay';

interface KillerGameProps {
    state: AutodartsState | null;
    settings: KillerSettings;
    players: Player[];
    onPlayAgain: () => void;
    gameViewScale?: number;
}

export function KillerGame({ state, settings, players, onPlayAgain, gameViewScale = 100 }: KillerGameProps) {
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
    const lastTurnIndexRef = useRef<number>(0);

    // Overlays
    const [showNextPlayerOverlay, setShowNextPlayerOverlay] = useState(false);
    const [nextPlayerToShow, setNextPlayerToShow] = useState<Player | null>(null);

    // Initialize
    useEffect(() => {
        if (!initialized && players.length > 0) {
            const initialPlayers = assignKillerNumbers(players);
            initialPlayers.forEach(p => p.lives = settings.startingLives);

            const initialState = {
                players: initialPlayers,
                turnIndex: 0,
                winner: null,
                log: [],
            };

            setGameState(initialState);
            setHistory([]); // Reset history
            setInitialized(true);
            lastTurnIndexRef.current = 0;
            // Reset throw tracker when game inits/resets
            lastThrowRef.current = state?.throws?.length || 0;
        }
    }, [players, settings, initialized, state?.throws?.length]);

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

            setGameState(prev => {
                if (prev.winner) return prev;

                // Save current state to history before update
                setHistory(h => [...h, prev]);

                const { newState } = processKillerThrow(newDart.segment, prev, settings);
                return newState;
            });

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
    // Use state.throws directly from props as App.tsx handles the state source of truth
    const turnThrows = state?.throws || [];

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
        <div className="h-full w-full flex flex-col items-center justify-center p-8 gap-6 relative">

            {/* Player List (Horizontal) */}
            <div className="flex items-center gap-4 flex-wrap justify-center" style={{ zoom: playerLimitScale }}>
                {gameState.players.map((p, idx) => {
                    const realPlayer = players.find(rp => rp.id === p.id);
                    const isActive = idx === gameState.turnIndex;
                    const isDead = p.lives <= 0;

                    return (
                        <div
                            key={p.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all backdrop-blur-md border-2
                                ${isActive ? 'bg-white/15 text-white scale-110 border-white z-10' :
                                    isDead ? 'bg-red-900/10 border-red-900/20 opacity-50 grayscale' :
                                        'bg-white/10 text-zinc-300 border-white/10'}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-zinc-700/50 overflow-hidden shrink-0 relative">
                                {realPlayer?.photo ? (
                                    <img src={realPlayer.photo} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg font-bold opacity-50">
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                {isDead && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Skull size={20} className="text-zinc-400" /></div>}
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wider opacity-75 flex items-center gap-2">
                                    {p.name}
                                    {p.isKiller && <Sword size={12} className="text-red-400" />}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl font-bold tabular-nums flex items-center gap-1">
                                        <Heart size={16} className={isActive ? "fill-red-500 text-red-500" : "text-zinc-500"} />
                                        {p.lives}
                                    </div>
                                    <div className="text-lg font-mono opacity-50">#{p.number}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Game Area */}
            <div style={{ zoom: gameViewScale / 100 }}>
                <div className="flex items-center justify-center gap-12">
                    {/* Dartboard */}
                    <Dartboard
                        size={300}
                        highlightSegment={currentPlayer ? `S${currentPlayer.number}` : undefined}
                    // Note: S{number} highlights standard single.
                    // Ideally we highlight base on "Charging" logic (e.g. Double if activation is Double)
                    // But simple highlight is better for now.
                    />

                    {/* Info Panel */}
                    <div className="flex flex-col items-center gap-4">
                        {/* Big Status Text */}
                        <div className="text-center">
                            {currentPlayer?.isKiller ? (
                                <div className="text-5xl font-black text-red-500 tracking-wider flex items-center gap-2 animate-pulse">
                                    <Sword size={48} /> KILLER
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="text-zinc-400 uppercase text-sm tracking-widest mb-1">Target</div>
                                    <div className="text-7xl font-bold text-white">#{currentPlayer?.number}</div>
                                </div>
                            )}
                        </div>

                        {/* Throw Boxes */}
                        <div className="flex items-center justify-center gap-4 mt-4">
                            {[0, 1, 2].map(idx => {
                                const throwName = turnThrows[idx]?.segment?.name;
                                return (
                                    <div
                                        key={idx}
                                        className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center transition-all backdrop-blur-md ${throwName
                                            ? 'bg-white/15 border-white/30 text-white'
                                            : 'bg-white/5 border-white/10 text-zinc-600'
                                            }`}
                                    >
                                        <span className="text-2xl font-bold">
                                            {throwName || ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Instruction / Context */}
                        <div className="text-zinc-500 text-sm font-medium mt-2">
                            {currentPlayer?.isKiller
                                ? "Hit opponents' numbers to eliminate them!"
                                : `Hit your number to gain lives & activate Killer!`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
