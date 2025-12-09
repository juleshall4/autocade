import { useEffect, useState, useRef } from "react";
import type { AutodartsState } from "../types/autodarts";
import type { Player } from "../types/player";
import { getCheckoutSuggestions, formatCheckout } from "../utils/checkouts";

interface X01GameProps {
    state: AutodartsState | null;
    baseScore: number;
    players: Player[];
}

interface PlayerScore {
    playerId: string;
    remaining: number;
    isWinner: boolean;
}

const MAX_THROWS_PER_TURN = 3;

export function X01Game({ state, baseScore, players }: X01GameProps) {
    // Initialize player scores
    const [playerScores, setPlayerScores] = useState<PlayerScore[]>(() =>
        players.map(p => ({ playerId: p.id, remaining: baseScore, isWinner: false }))
    );
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [turnScore, setTurnScore] = useState(0);
    const [lastThrow, setLastThrow] = useState("-");
    const [isBust, setIsBust] = useState(false);
    const [winnerId, setWinnerId] = useState<string | null>(null);

    // Track previous state
    const prevThrowsRef = useRef<string[]>([]);
    const scoreAtTurnStartRef = useRef<number>(baseScore);

    // Get current player
    const currentPlayer = players[currentPlayerIndex];
    const currentPlayerScore = playerScores.find(ps => ps.playerId === currentPlayer?.id);

    // Update score at turn start ref when player changes
    useEffect(() => {
        if (currentPlayerScore) {
            scoreAtTurnStartRef.current = currentPlayerScore.remaining;
        }
    }, [currentPlayerIndex, currentPlayerScore]);

    // Reinitialize scores when players change
    useEffect(() => {
        setPlayerScores(players.map(p => ({ playerId: p.id, remaining: baseScore, isWinner: false })));
        setCurrentPlayerIndex(0);
    }, [players.length, baseScore]);

    useEffect(() => {
        if (!state || !currentPlayer) return;

        const currentThrows = state.throws || [];
        const currentNames = currentThrows.map(t => t.segment.name);
        const prevNames = prevThrowsRef.current;

        const isSimulatorUndo = state.event === 'Throw removed';
        const isTurnEnd = state.status === 'Takeout' ||
            state.status === 'Takeout in progress' ||
            state.status === 'Takeout finished' ||
            state.event === 'Takeout finished' ||
            state.event === 'Reset';

        // CASE 1: Turn ended - apply score and move to next player
        if (isTurnEnd && currentNames.length === 0 && prevNames.length > 0) {
            if (!isBust && !winnerId) {
                // Apply turn score to current player
                setPlayerScores(prev => prev.map(ps =>
                    ps.playerId === currentPlayer.id
                        ? { ...ps, remaining: ps.remaining - turnScore }
                        : ps
                ));
            }

            // Move to next player
            if (!winnerId) {
                setCurrentPlayerIndex(prev => (prev + 1) % players.length);
            }

            // Reset turn state
            setTurnScore(0);
            setLastThrow("-");
            setIsBust(false);
        }
        // CASE 2: Simulator Undo
        else if (isSimulatorUndo && currentNames.length < prevNames.length) {
            const removedThrowName = prevNames[prevNames.length - 1];
            const removedThrow = findThrowByName(removedThrowName);
            if (removedThrow) {
                setTurnScore(prev => Math.max(0, prev - removedThrow.points));
            }
            if (currentNames.length > 0) {
                setLastThrow(currentThrows[currentThrows.length - 1].segment.name);
            } else {
                setLastThrow("-");
            }
            setIsBust(false);
        }
        // CASE 3: Physical takeout in progress - ignore
        else if (isTurnEnd && currentNames.length < prevNames.length) {
            // Do nothing
        }
        // CASE 4: New throw
        else if (currentNames.length > prevNames.length && !isBust && !winnerId && currentPlayerScore) {
            for (let i = prevNames.length; i < Math.min(currentThrows.length, MAX_THROWS_PER_TURN); i++) {
                const t = currentThrows[i];
                const points = t.segment.number * t.segment.multiplier;

                const newTurnScore = turnScore + points;
                const projectedRemaining = currentPlayerScore.remaining - newTurnScore;

                if (projectedRemaining === 0) {
                    // WINNER!
                    setWinnerId(currentPlayer.id);
                    setTurnScore(newTurnScore);
                    setLastThrow(t.segment.name);
                    setPlayerScores(prev => prev.map(ps =>
                        ps.playerId === currentPlayer.id
                            ? { ...ps, remaining: 0, isWinner: true }
                            : ps
                    ));
                } else if (projectedRemaining < 0 || projectedRemaining === 1) {
                    // BUST!
                    setIsBust(true);
                    setTurnScore(newTurnScore);
                    setLastThrow(t.segment.name);
                } else {
                    setTurnScore(newTurnScore);
                    setLastThrow(t.segment.name);
                }
            }
        }

        prevThrowsRef.current = currentNames;
    }, [state, turnScore, currentPlayer, currentPlayerScore, isBust, winnerId, players.length]);

    // Calculate projected score for current player
    const projectedScore = currentPlayerScore
        ? (isBust ? currentPlayerScore.remaining : currentPlayerScore.remaining - turnScore)
        : 0;

    // Get checkout suggestions
    const dartsRemaining = MAX_THROWS_PER_TURN - (state?.throws?.length || 0);
    const checkoutSuggestions = projectedScore <= 170 && projectedScore >= 2 && !isBust && !winnerId
        ? getCheckoutSuggestions(projectedScore, Math.max(1, dartsRemaining))
        : [];

    // Winner display
    if (winnerId) {
        const winner = players.find(p => p.id === winnerId);
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-8">
                <div className="text-8xl">🎯</div>
                <div className="text-6xl font-bold text-green-400 animate-pulse">
                    {winner?.name || 'Player'} WINS!
                </div>
                <div className="text-2xl text-zinc-400">
                    Game finished with {lastThrow}
                </div>
                <div className="text-zinc-500 mt-4">
                    Press Reset to play again
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
            {/* Player Scores */}
            <div className="flex items-center gap-4 mb-4">
                {players.map((player, idx) => {
                    const ps = playerScores.find(s => s.playerId === player.id);
                    const isActive = idx === currentPlayerIndex;
                    return (
                        <div
                            key={player.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? 'bg-blue-600 text-white scale-110 ring-2 ring-blue-400'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                        >
                            {/* Player Photo */}
                            <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                                {player.photo ? (
                                    <img
                                        src={player.photo}
                                        alt={player.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg font-bold opacity-50">
                                        {player.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            {/* Player Info */}
                            <div>
                                <div className="text-xs uppercase tracking-wider opacity-75">{player.name}</div>
                                <div className="text-2xl font-bold tabular-nums">{ps?.remaining ?? baseScore}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Current Player Turn */}
            <div className="text-zinc-500 text-sm">
                {currentPlayer?.name}'s Turn
            </div>

            {/* Remaining Score (main display) */}
            <div className="flex flex-col items-center">
                <h3 className="text-zinc-500 uppercase tracking-widest text-sm mb-4">Remaining</h3>
                <div className={`text-9xl font-bold tabular-nums leading-none ${isBust ? 'text-red-500' : 'text-white'
                    }`}>
                    {isBust ? 'BUST' : projectedScore}
                </div>
            </div>

            {/* Bust indicator */}
            {isBust && (
                <div className="text-red-400 text-lg animate-pulse">
                    Score will revert to {scoreAtTurnStartRef.current}
                </div>
            )}

            {/* Checkout Suggestions */}
            {checkoutSuggestions.length > 0 && (
                <div className="flex flex-col items-center">
                    <h3 className="text-zinc-500 uppercase tracking-widest text-xs mb-2">Checkout</h3>
                    <div className="text-xl font-bold text-green-400">
                        {formatCheckout(checkoutSuggestions[0])}
                    </div>
                </div>
            )}

            {/* Turn Score */}
            <div className="flex flex-col items-center">
                <h3 className="text-zinc-500 uppercase tracking-widest text-sm mb-2">This Turn</h3>
                <div className={`text-5xl font-bold tabular-nums ${isBust ? 'text-red-400' : 'text-zinc-400'}`}>
                    {turnScore}
                </div>
            </div>

            {/* Last Throw */}
            <div className="flex flex-col items-center">
                <h3 className="text-zinc-500 uppercase tracking-widest text-sm mb-2">Last Throw</h3>
                <div className="text-4xl font-bold text-zinc-500 tabular-nums">
                    {lastThrow}
                </div>
            </div>
        </div>
    );
}

// Helper to parse throw name back to points
function findThrowByName(name: string): { points: number } | null {
    if (name === 'Miss') return { points: 0 };

    const match = name.match(/^([STD])(\d+)$/);
    if (!match) return null;

    const [, prefix, numStr] = match;
    const num = parseInt(numStr, 10);
    const multiplier = prefix === 'T' ? 3 : prefix === 'D' ? 2 : 1;

    return { points: num * multiplier };
}
