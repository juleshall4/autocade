import { useEffect, useState, useRef, useCallback } from "react";
import type { AutodartsState } from "../types/autodarts";
import type { Player } from "../types/player";
import type { X01Settings } from "./x01-rules";
import { getCheckoutSuggestions, formatCheckout } from "../utils/checkouts";

interface X01GameProps {
    state: AutodartsState | null;
    settings: X01Settings;
    players: Player[];
    onPlayAgain: () => void;
}

interface PlayerLegData {
    playerId: string;
    remaining: number;
    isWinner: boolean;
    hasStarted: boolean;
    totalDarts: number;
    hits: number;
    misses: number;
    singles: number;
    doubles: number;
    triples: number;
    busts: number;
    turns: number;
    highestTurn: number;
}

interface PlayerMatchData {
    playerId: string;
    legsWon: number;
    setsWon: number;
    // Accumulated stats across all legs
    totalDarts: number;
    hits: number;
    misses: number;
    singles: number;
    doubles: number;
    triples: number;
    busts: number;
    turns: number;
    highestTurn: number;
}

const MAX_THROWS_PER_TURN = 3;

function createLegData(playerId: string, baseScore: number, autoStart: boolean): PlayerLegData {
    return {
        playerId,
        remaining: baseScore,
        isWinner: false,
        hasStarted: autoStart,
        totalDarts: 0, hits: 0, misses: 0, singles: 0, doubles: 0, triples: 0, busts: 0, turns: 0, highestTurn: 0,
    };
}

function createMatchData(playerId: string): PlayerMatchData {
    return {
        playerId,
        legsWon: 0,
        setsWon: 0,
        totalDarts: 0, hits: 0, misses: 0, singles: 0, doubles: 0, triples: 0, busts: 0, turns: 0, highestTurn: 0,
    };
}

export function X01Game({ state, settings, players, onPlayAgain }: X01GameProps) {
    const { baseScore, inMode, outMode, matchMode, legsToWin, setsToWin } = settings;

    // Match-level tracking
    const [matchData, setMatchData] = useState<PlayerMatchData[]>(() =>
        players.map(p => createMatchData(p.id))
    );
    const [currentLeg, setCurrentLeg] = useState(1);
    const [currentSet, setCurrentSet] = useState(1);
    const [matchWinnerId, setMatchWinnerId] = useState<string | null>(null);

    // Leg-level tracking
    const [legData, setLegData] = useState<PlayerLegData[]>(() =>
        players.map(p => createLegData(p.id, baseScore, inMode === 'single'))
    );
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [turnScore, setTurnScore] = useState(0);
    const [lastThrow, setLastThrow] = useState("-");
    const [isBust, setIsBust] = useState(false);
    const [legWinnerId, setLegWinnerId] = useState<string | null>(null);

    // For "continue" prompt between legs
    const [showLegSummary, setShowLegSummary] = useState(false);

    // Track previous state
    const prevThrowsRef = useRef<string[]>([]);
    const scoreAtTurnStartRef = useRef<number>(baseScore);

    const currentPlayer = players[currentPlayerIndex];
    const currentPlayerLegData = legData.find(ld => ld.playerId === currentPlayer?.id);

    // Reset for new leg
    const startNewLeg = useCallback(() => {
        setLegData(players.map(p => createLegData(p.id, baseScore, inMode === 'single')));
        setCurrentPlayerIndex(0);
        setTurnScore(0);
        setLastThrow("-");
        setIsBust(false);
        setLegWinnerId(null);
        setShowLegSummary(false);
        prevThrowsRef.current = [];
    }, [players, baseScore, inMode]);

    // Handle leg win
    const handleLegWin = useCallback((winnerId: string) => {
        setLegWinnerId(winnerId);

        // Accumulate stats to match data
        setMatchData(prev => prev.map(md => {
            const ld = legData.find(l => l.playerId === md.playerId);
            if (!ld) return md;
            const isWinner = md.playerId === winnerId;
            return {
                ...md,
                legsWon: isWinner ? md.legsWon + 1 : md.legsWon,
                totalDarts: md.totalDarts + ld.totalDarts,
                hits: md.hits + ld.hits,
                misses: md.misses + ld.misses,
                singles: md.singles + ld.singles,
                doubles: md.doubles + ld.doubles,
                triples: md.triples + ld.triples,
                busts: md.busts + ld.busts,
                turns: md.turns + ld.turns,
                highestTurn: Math.max(md.highestTurn, ld.highestTurn),
            };
        }));

        // Check for set/match win
        const winnerMatchData = matchData.find(md => md.playerId === winnerId);
        const newLegsWon = (winnerMatchData?.legsWon || 0) + 1;

        if (matchMode === 'off') {
            // Single game - show summary immediately
            setShowLegSummary(true);
        } else if (matchMode === 'legs') {
            // Check if legs won
            if (newLegsWon >= legsToWin) {
                setMatchWinnerId(winnerId);
            } else {
                setShowLegSummary(true);
            }
        } else if (matchMode === 'sets') {
            // Check if set won
            if (newLegsWon >= legsToWin) {
                // Set won - update sets
                setMatchData(prev => prev.map(md => ({
                    ...md,
                    setsWon: md.playerId === winnerId ? md.setsWon + 1 : md.setsWon,
                    legsWon: 0, // Reset legs for new set
                })));
                const newSetsWon = (winnerMatchData?.setsWon || 0) + 1;
                if (newSetsWon >= setsToWin) {
                    setMatchWinnerId(winnerId);
                } else {
                    setCurrentSet(prev => prev + 1);
                    setCurrentLeg(1);
                    setShowLegSummary(true);
                }
            } else {
                setCurrentLeg(prev => prev + 1);
                setShowLegSummary(true);
            }
        }
    }, [legData, matchData, matchMode, legsToWin, setsToWin]);

    // Update score at turn start ref
    useEffect(() => {
        if (currentPlayerLegData) {
            scoreAtTurnStartRef.current = currentPlayerLegData.remaining;
        }
    }, [currentPlayerIndex, currentPlayerLegData]);

    // Reinitialize on player/settings change
    useEffect(() => {
        setLegData(players.map(p => createLegData(p.id, baseScore, inMode === 'single')));
        setMatchData(players.map(p => createMatchData(p.id)));
        setCurrentPlayerIndex(0);
        setCurrentLeg(1);
        setCurrentSet(1);
        setMatchWinnerId(null);
        setLegWinnerId(null);
    }, [players.length, baseScore, inMode]);

    // Main game logic
    useEffect(() => {
        if (!state || !currentPlayer || legWinnerId || matchWinnerId) return;

        const currentThrows = state.throws || [];
        const currentNames = currentThrows.map(t => t.segment.name);
        const prevNames = prevThrowsRef.current;

        const isSimulatorUndo = state.event === 'Throw removed';
        const isTurnEnd = state.status === 'Takeout' ||
            state.status === 'Takeout in progress' ||
            state.status === 'Takeout finished' ||
            state.event === 'Takeout finished' ||
            state.event === 'Reset';

        // CASE 1: Turn ended
        if (isTurnEnd && currentNames.length === 0 && prevNames.length > 0) {
            setLegData(prev => prev.map(ld => {
                if (ld.playerId !== currentPlayer.id) return ld;
                return {
                    ...ld,
                    remaining: isBust ? ld.remaining : ld.remaining - turnScore,
                    turns: ld.turns + 1,
                    busts: ld.busts + (isBust ? 1 : 0),
                    highestTurn: Math.max(ld.highestTurn, isBust ? 0 : turnScore),
                };
            }));

            setCurrentPlayerIndex(prev => (prev + 1) % players.length);
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
                setLegData(prev => prev.map(ld => {
                    if (ld.playerId !== currentPlayer.id) return ld;
                    return {
                        ...ld,
                        totalDarts: Math.max(0, ld.totalDarts - 1),
                        hits: removedThrow.points > 0 ? Math.max(0, ld.hits - 1) : ld.hits,
                        misses: removedThrow.points === 0 ? Math.max(0, ld.misses - 1) : ld.misses,
                    };
                }));
            }
            setLastThrow(currentNames.length > 0 ? currentThrows[currentThrows.length - 1].segment.name : "-");
            setIsBust(false);
        }
        // CASE 3: Physical takeout - ignore
        else if (isTurnEnd && currentNames.length < prevNames.length) {
            // Do nothing
        }
        // CASE 4: New throw
        else if (currentNames.length > prevNames.length && !isBust && currentPlayerLegData) {
            for (let i = prevNames.length; i < Math.min(currentThrows.length, MAX_THROWS_PER_TURN); i++) {
                const t = currentThrows[i];
                const points = t.segment.number * t.segment.multiplier;
                const isDouble = t.segment.multiplier === 2;
                const isTriple = t.segment.multiplier === 3;
                const isSingle = t.segment.multiplier === 1 && points > 0;
                const isMiss = points === 0;

                setLegData(prev => prev.map(ld => {
                    if (ld.playerId !== currentPlayer.id) return ld;
                    return {
                        ...ld,
                        totalDarts: ld.totalDarts + 1,
                        hits: isMiss ? ld.hits : ld.hits + 1,
                        misses: isMiss ? ld.misses + 1 : ld.misses,
                        singles: isSingle ? ld.singles + 1 : ld.singles,
                        doubles: isDouble ? ld.doubles + 1 : ld.doubles,
                        triples: isTriple ? ld.triples + 1 : ld.triples,
                    };
                }));

                // Check if player needs to start
                if (!currentPlayerLegData.hasStarted) {
                    if (inMode === 'double' && !isDouble) {
                        setLastThrow(t.segment.name);
                        continue;
                    }
                    setLegData(prev => prev.map(ld =>
                        ld.playerId === currentPlayer.id ? { ...ld, hasStarted: true } : ld
                    ));
                }

                const newTurnScore = turnScore + points;
                const projectedRemaining = currentPlayerLegData.remaining - newTurnScore;

                if (projectedRemaining === 0) {
                    if (outMode === 'double' && !isDouble) {
                        setIsBust(true);
                        setTurnScore(newTurnScore);
                        setLastThrow(t.segment.name);
                    } else {
                        // LEG WIN!
                        setTurnScore(newTurnScore);
                        setLastThrow(t.segment.name);
                        setLegData(prev => prev.map(ld =>
                            ld.playerId === currentPlayer.id
                                ? { ...ld, remaining: 0, isWinner: true }
                                : ld
                        ));
                        handleLegWin(currentPlayer.id);
                    }
                } else if (projectedRemaining < 0 || projectedRemaining === 1) {
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
    }, [state, turnScore, currentPlayer, currentPlayerLegData, isBust, legWinnerId, matchWinnerId, players.length, inMode, outMode, handleLegWin]);

    const projectedScore = currentPlayerLegData
        ? (isBust ? currentPlayerLegData.remaining : currentPlayerLegData.remaining - turnScore)
        : 0;

    const dartsRemaining = MAX_THROWS_PER_TURN - (state?.throws?.length || 0);
    const checkoutSuggestions = projectedScore <= 170 && projectedScore >= 2 &&
        !isBust && !legWinnerId && currentPlayerLegData?.hasStarted
        ? getCheckoutSuggestions(projectedScore, Math.max(1, dartsRemaining))
        : [];

    // Match winner screen
    if (matchWinnerId) {
        const winner = players.find(p => p.id === matchWinnerId);

        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6">
                <div className="text-6xl">🏆</div>
                <div className="text-4xl font-bold text-green-400 animate-pulse text-center">
                    {winner?.name || 'Player'} WINS THE MATCH!
                </div>
                {matchMode !== 'off' && (
                    <div className="text-xl text-zinc-400">
                        {matchMode === 'sets' && `Sets: ${matchData.find(m => m.playerId === matchWinnerId)?.setsWon}`}
                        {matchMode === 'legs' && `Legs: ${matchData.find(m => m.playerId === matchWinnerId)?.legsWon}`}
                    </div>
                )}

                {/* Per-player match stats */}
                <div className="flex gap-4 w-full max-w-3xl">
                    {players.map(player => {
                        const md = matchData.find(m => m.playerId === player.id);
                        if (!md) return null;
                        const accuracy = md.totalDarts > 0 ? Math.round((md.hits / md.totalDarts) * 100) : 0;
                        const isWinner = player.id === matchWinnerId;

                        return (
                            <div key={player.id} className={`flex-1 bg-zinc-900 rounded-lg p-4 ${isWinner ? 'ring-2 ring-green-500' : ''}`}>
                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800">
                                    <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                                        {player.photo ? (
                                            <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-lg font-bold opacity-50">
                                                {player.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{player.name}</div>
                                        {isWinner && <div className="text-xs text-green-400">🏆 Match Winner</div>}
                                        {matchMode !== 'off' && (
                                            <div className="text-xs text-zinc-500">
                                                {matchMode === 'sets' && `Sets: ${md.setsWon}`}
                                                {matchMode === 'legs' && `Legs: ${md.legsWon}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-zinc-500">Darts</span><span className="text-white font-bold">{md.totalDarts}</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-500">Accuracy</span><span className="text-white font-bold">{accuracy}%</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-500">Best Turn</span><span className="text-white font-bold">{md.highestTurn}</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-500">Busts</span><span className="text-white font-bold">{md.busts}</span></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button onClick={onPlayAgain} className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors text-lg">
                    Play Again
                </button>
            </div>
        );
    }

    // Leg summary screen (between legs)
    if (showLegSummary && legWinnerId) {
        const legWinner = players.find(p => p.id === legWinnerId);

        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6">
                <div className="text-5xl">🎯</div>
                <div className="text-3xl font-bold text-green-400">
                    {legWinner?.name} wins the leg!
                </div>

                {/* Score display for match */}
                {matchMode !== 'off' && (
                    <div className="flex gap-8">
                        {players.map(player => {
                            const md = matchData.find(m => m.playerId === player.id);
                            return (
                                <div key={player.id} className="text-center">
                                    <div className="text-zinc-400 text-sm">{player.name}</div>
                                    <div className="text-3xl font-bold text-white">
                                        {matchMode === 'sets' ? md?.setsWon : md?.legsWon}
                                    </div>
                                    {matchMode === 'sets' && (
                                        <div className="text-sm text-zinc-500">Legs: {md?.legsWon}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="text-zinc-500">
                    {matchMode === 'sets' && `Set ${currentSet} • Leg ${currentLeg}`}
                    {matchMode === 'legs' && `Leg ${currentLeg} of ${legsToWin}`}
                </div>

                <button
                    onClick={startNewLeg}
                    className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors text-lg"
                >
                    {matchMode === 'off' ? 'Play Again' : 'Next Leg'}
                </button>

                {matchMode === 'off' && (
                    <button onClick={onPlayAgain} className="text-zinc-500 hover:text-white transition-colors">
                        Back to Rules
                    </button>
                )}
            </div>
        );
    }

    // Main game view
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
            {/* Match score header */}
            {matchMode !== 'off' && (
                <div className="flex items-center gap-6 mb-2">
                    {players.map(player => {
                        const md = matchData.find(m => m.playerId === player.id);
                        return (
                            <div key={player.id} className="text-center">
                                <div className="text-zinc-500 text-xs uppercase">{player.name}</div>
                                <div className="text-2xl font-bold text-white">
                                    {matchMode === 'sets' ? md?.setsWon : md?.legsWon}
                                </div>
                                {matchMode === 'sets' && (
                                    <div className="text-xs text-zinc-600">Legs: {md?.legsWon}</div>
                                )}
                            </div>
                        );
                    })}
                    <div className="text-zinc-600 text-sm">
                        {matchMode === 'sets' && `Set ${currentSet}`}
                        {matchMode === 'legs' && `Leg ${currentLeg}`}
                    </div>
                </div>
            )}

            {/* Player leg scores */}
            <div className="flex items-center gap-4 mb-4">
                {players.map((player, idx) => {
                    const ld = legData.find(d => d.playerId === player.id);
                    const isActive = idx === currentPlayerIndex;
                    return (
                        <div key={player.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white scale-110 ring-2 ring-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                                {player.photo ? (
                                    <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg font-bold opacity-50">
                                        {player.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wider opacity-75">
                                    {player.name}
                                    {!ld?.hasStarted && inMode === 'double' && <span className="ml-1 text-yellow-400">(waiting)</span>}
                                </div>
                                <div className="text-2xl font-bold tabular-nums">{ld?.remaining ?? baseScore}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-zinc-500 text-sm">
                {currentPlayer?.name}'s Turn
                {!currentPlayerLegData?.hasStarted && inMode === 'double' && <span className="text-yellow-400 ml-2">• Hit a double to start!</span>}
            </div>

            <div className="flex flex-col items-center">
                <h3 className="text-zinc-500 uppercase tracking-widest text-sm mb-4">Remaining</h3>
                <div className={`text-9xl font-bold tabular-nums leading-none ${isBust ? 'text-red-500' : 'text-white'}`}>
                    {isBust ? 'BUST' : projectedScore}
                </div>
            </div>

            {isBust && (
                <div className="text-red-400 text-lg animate-pulse">
                    {outMode === 'double' ? 'Must finish on a double! ' : ''}Score will revert to {scoreAtTurnStartRef.current}
                </div>
            )}

            {checkoutSuggestions.length > 0 && (
                <div className="flex flex-col items-center">
                    <h3 className="text-zinc-500 uppercase tracking-widest text-xs mb-2">Checkout {outMode === 'double' ? '(Double Out)' : ''}</h3>
                    <div className="text-xl font-bold text-green-400">{formatCheckout(checkoutSuggestions[0])}</div>
                </div>
            )}

            <div className="flex flex-col items-center">
                <h3 className="text-zinc-500 uppercase tracking-widest text-sm mb-2">This Turn</h3>
                <div className={`text-5xl font-bold tabular-nums ${isBust ? 'text-red-400' : 'text-zinc-400'}`}>{turnScore}</div>
            </div>

            <div className="flex flex-col items-center">
                <h3 className="text-zinc-500 uppercase tracking-widest text-sm mb-2">Last Throw</h3>
                <div className="text-4xl font-bold text-zinc-500 tabular-nums">{lastThrow}</div>
            </div>
        </div>
    );
}

function findThrowByName(name: string): { points: number; isDouble: boolean } | null {
    if (name === 'Miss') return { points: 0, isDouble: false };
    const match = name.match(/^([STD])(\d+)$/);
    if (!match) return null;
    const [, prefix, numStr] = match;
    const num = parseInt(numStr, 10);
    const multiplier = prefix === 'T' ? 3 : prefix === 'D' ? 2 : 1;
    return { points: num * multiplier, isDouble: prefix === 'D' };
}
