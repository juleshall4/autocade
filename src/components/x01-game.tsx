import { useEffect, useState, useRef, useCallback } from "react";
import type { AutodartsState } from "../types/autodarts";
import type { Player } from "../types/player";
import type { X01Settings } from "./x01-rules";
import { getCheckoutSuggestions } from "../utils/checkouts";
import { VictoryOverlay } from "./victory-overlay";
import { NextPlayerOverlay } from "./next-player-overlay";
import { Dartboard } from "./Dartboard";
import { useCaller } from "../hooks/use-caller";
import wled from "../services/wled";

interface X01GameProps {
    state: AutodartsState | null;
    settings: X01Settings;
    players: Player[];
    onPlayAgain: () => void;
    onLegStart: () => void;
    themeGlow?: string;
    gameViewScale?: number;
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

export function X01Game({ state, settings, players, onPlayAgain, onLegStart, themeGlow, gameViewScale = 100 }: X01GameProps) {
    const { baseScore, inMode, outMode, matchMode, legsToWin, setsToWin } = settings;

    // Caller for score announcements
    const caller = useCaller();

    // Match-level tracking
    const [matchData, setMatchData] = useState<PlayerMatchData[]>(() =>
        players.map(p => createMatchData(p.id))
    );
    const [currentLeg, setCurrentLeg] = useState(1);
    const [currentSet, setCurrentSet] = useState(1);
    const [matchWinnerId, setMatchWinnerId] = useState<string | null>(null);

    const [setStarterIndex, setSetStarterIndex] = useState(0); // Track who starts the current set

    // Leg-level tracking
    const [legData, setLegData] = useState<PlayerLegData[]>(() =>
        players.map(p => createLegData(p.id, baseScore, inMode === 'single'))
    );
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [legStarterIndex, setLegStarterIndex] = useState(0); // Track who starts the current leg
    const [turnScore, setTurnScore] = useState(0);
    const [turnThrows, setTurnThrows] = useState<string[]>([]);
    const [isBust, setIsBust] = useState(false);
    const [legWinnerId, setLegWinnerId] = useState<string | null>(null);

    // For "continue" prompt between legs
    const [showLegSummary, setShowLegSummary] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    // Victory overlay (shows before match summary)
    const [showVictoryOverlay, setShowVictoryOverlay] = useState(false);

    // Next player overlay
    const [showNextPlayerOverlay, setShowNextPlayerOverlay] = useState(false);
    const [nextPlayerToShow, setNextPlayerToShow] = useState<Player | null>(null);

    // Track previous state
    const prevThrowsRef = useRef<string[]>([]);
    const scoreAtTurnStartRef = useRef<number>(baseScore);

    const currentPlayer = players[currentPlayerIndex];
    const currentPlayerLegData = legData.find(ld => ld.playerId === currentPlayer?.id);

    // Reset for new leg
    const startNewLeg = useCallback(() => {
        // Reset simulator/autodarts state first
        onLegStart();

        setLegData(players.map(p => createLegData(p.id, baseScore, inMode === 'single')));
        setCurrentPlayerIndex(legStarterIndex); // Start with the determined starter
        setTurnScore(0);
        setTurnThrows([]);
        setIsBust(false);
        setLegWinnerId(null);
        setShowLegSummary(false);
        setCountdown(null);
        prevThrowsRef.current = [];
        scoreAtTurnStartRef.current = baseScore;
    }, [players, baseScore, inMode, onLegStart, legStarterIndex]);

    // Play "Game On" sound on game start (with ref guard for StrictMode)
    const gameOnPlayedRef = useRef(false);
    useEffect(() => {
        if (!gameOnPlayedRef.current) {
            gameOnPlayedRef.current = true;
            caller.callGameOn();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Countdown timer between legs
    useEffect(() => {
        if (showLegSummary && matchMode !== 'off' && countdown === null) {
            setCountdown(3);
        }
    }, [showLegSummary, matchMode, countdown]);

    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            startNewLeg();
        }
    }, [countdown, startNewLeg]);

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
            // Single game - show victory overlay then summary
            setMatchWinnerId(winnerId);
            setShowVictoryOverlay(true);
        } else if (matchMode === 'legs') {
            // Rotate starter for next leg
            setLegStarterIndex(prev => (prev + 1) % players.length);

            // Check if legs won
            if (newLegsWon >= legsToWin) {
                setMatchWinnerId(winnerId);
                setShowVictoryOverlay(true);
            } else {
                setCurrentLeg(prev => prev + 1);
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
                    setShowVictoryOverlay(true);
                } else {
                    // New Set
                    setCurrentSet(prev => prev + 1);
                    setCurrentLeg(1);
                    setShowLegSummary(true);

                    // Rotate for new SET
                    const nextSetStarter = (setStarterIndex + 1) % players.length;
                    setSetStarterIndex(nextSetStarter);
                    setLegStarterIndex(nextSetStarter);
                }
            } else {
                // Leg won, set continues
                setCurrentLeg(prev => prev + 1);
                setShowLegSummary(true);
                // Rotate for next LEG
                setLegStarterIndex(prev => (prev + 1) % players.length);
            }
        }
    }, [legData, matchData, matchMode, legsToWin, setsToWin, setStarterIndex, players.length]);

    // Update score at turn start ref and announce checkout if in range
    useEffect(() => {
        if (currentPlayerLegData) {
            scoreAtTurnStartRef.current = currentPlayerLegData.remaining;
            // If player is in checkout range at start of turn, announce "you need X"
            if (currentPlayerLegData.remaining <= 170 && currentPlayerLegData.remaining >= 2 && !legWinnerId) {
                caller.callRemaining(currentPlayerLegData.remaining);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPlayerIndex]);

    // Reinitialize on player/settings change
    const hasCalledGameOnRef = useRef(false);
    useEffect(() => {
        setLegData(players.map(p => createLegData(p.id, baseScore, inMode === 'single')));
        setMatchData(players.map(p => createMatchData(p.id)));
        setCurrentPlayerIndex(0);
        setCurrentLeg(1);
        setCurrentSet(1);
        setMatchWinnerId(null);
        setLegWinnerId(null);
        // Call "Game on!" when match starts (only once per reinit)
        if (!hasCalledGameOnRef.current) {
            hasCalledGameOnRef.current = true;
            caller.callGameOn();
            // If starting score is in checkout range, also announce "you need X" after delay
            if (baseScore <= 170 && baseScore >= 2) {
                setTimeout(() => {
                    caller.callRemaining(baseScore);
                }, 3000);
            }
        }
        // Reset on next reinit
        return () => { hasCalledGameOnRef.current = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Skip if this is a fresh leg (player remaining == baseScore and no throws processed yet)
        const isFreshLeg = currentPlayerLegData?.remaining === baseScore && turnScore === 0;
        if (isTurnEnd && currentNames.length === 0 && prevNames.length > 0 && !isFreshLeg) {
            // Show next player overlay (only for multiplayer games)
            const nextIndex = (currentPlayerIndex + 1) % players.length;
            if (players.length > 1) {
                setNextPlayerToShow(players[nextIndex]);
                setShowNextPlayerOverlay(true);
            }

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

            // Announce round total if turn ends early (before 3rd dart) and score > 0
            if (!isBust && turnScore > 0 && prevNames.length < 3 && caller.settings.announceRoundTotal) {
                caller.callScore(turnScore);
            } else if (!isBust && turnScore === 0 && caller.settings.announceBusts) {
                caller.callNoScore();
            }

            setCurrentPlayerIndex(nextIndex);
            setTurnScore(0);
            setTurnThrows([]);
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
            setTurnThrows(currentNames.slice(0, Math.min(currentNames.length, 3)));
            setIsBust(false);
        }
        // CASE 3: Physical takeout - ignore
        else if (isTurnEnd && currentNames.length < prevNames.length) {
            // Do nothing
        }
        // CASE 4: New throw
        else if (currentNames.length > prevNames.length && !isBust && currentPlayerLegData) {
            // Track accumulated score within the loop (React state doesn't update mid-loop)
            let accumulatedScore = turnScore;

            for (let i = prevNames.length; i < Math.min(currentThrows.length, MAX_THROWS_PER_TURN); i++) {
                const t = currentThrows[i];
                const points = t.segment.number * t.segment.multiplier;
                // Inner bull (D25 / Bull) is multiplier=2, number=25 - valid double finish
                const isDouble = t.segment.multiplier === 2;
                const isTriple = t.segment.multiplier === 3;
                const isSingle = t.segment.multiplier === 1 && points > 0;
                const isMiss = points === 0;
                const isThirdDart = i === 2; // 0-indexed, so 2 is the 3rd dart

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
                        setTurnThrows(prev => [...prev, t.segment.name].slice(0, 3));
                        continue;
                    }
                    setLegData(prev => prev.map(ld =>
                        ld.playerId === currentPlayer.id ? { ...ld, hasStarted: true } : ld
                    ));
                }

                // Use accumulated score, not React state
                accumulatedScore += points;
                const projectedRemaining = currentPlayerLegData.remaining - accumulatedScore;

                if (projectedRemaining === 0) {
                    if (outMode === 'double' && !isDouble) {
                        // Bust on checkout attempt
                        setIsBust(true);
                        setTurnScore(accumulatedScore);
                        setTurnThrows(prev => [...prev, t.segment.name].slice(0, 3));
                        if (caller.settings.announceBusts) {
                            caller.callNoScore();
                        }
                    } else {
                        // LEG WIN! - call "game shot" (no score announcement)
                        setTurnScore(accumulatedScore);
                        setTurnThrows(prev => [...prev, t.segment.name].slice(0, 3));
                        setLegData(prev => prev.map(ld =>
                            ld.playerId === currentPlayer.id
                                ? { ...ld, remaining: 0, isWinner: true }
                                : ld
                        ));
                        caller.callGameShot();
                        wled.checkout();
                        handleLegWin(currentPlayer.id);
                    }
                } else if (projectedRemaining < 0 || (outMode === 'double' && projectedRemaining === 1)) {
                    // Bust
                    setIsBust(true);
                    wled.bust();
                    setTurnScore(accumulatedScore);
                    setTurnThrows(prev => [...prev, t.segment.name].slice(0, 3));
                    // Only call "no score" if busts announcement is enabled
                    if (caller.settings.announceBusts) {
                        caller.callNoScore();
                    }
                } else {
                    setTurnScore(accumulatedScore);
                    setTurnThrows(prev => [...prev, t.segment.name].slice(0, 3));

                    // Call individual dart score if announceAllDarts is enabled
                    if (caller.settings.announceAllDarts) {
                        caller.callScore(points);
                    }

                    // Call round total after 3rd dart
                    if (isThirdDart) {
                        // If all 3 darts missed (score is 0), call "no score" (if busts enabled)
                        if (accumulatedScore === 0) {
                            if (caller.settings.announceBusts) {
                                caller.callNoScore();
                            }
                        } else if (caller.settings.announceRoundTotal) {
                            // Only announce round total if setting is enabled
                            caller.callScore(accumulatedScore);
                        }
                    }
                }
            }
        }

        prevThrowsRef.current = currentNames;
    }, [state, turnScore, currentPlayer, currentPlayerLegData, isBust, legWinnerId, matchWinnerId, players.length, inMode, outMode, handleLegWin, caller]);

    const projectedScore = currentPlayerLegData
        ? (isBust ? currentPlayerLegData.remaining : currentPlayerLegData.remaining - turnScore)
        : 0;

    // Calculate checkout based on current remaining score and darts left in turn
    const dartsThrown = turnThrows.length;
    const dartsRemaining = MAX_THROWS_PER_TURN - dartsThrown;
    const doubleOut = outMode === 'double';
    const checkoutSuggestions = projectedScore <= 170 && projectedScore >= (doubleOut ? 2 : 1) &&
        !isBust && !legWinnerId && currentPlayerLegData?.hasStarted && dartsRemaining > 0
        ? getCheckoutSuggestions(projectedScore, dartsRemaining, doubleOut)
        : [];

    // Next player overlay (shows between turns)
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

    // Victory overlay (shows first when match is won)
    if (matchWinnerId && showVictoryOverlay) {
        const winner = players.find(p => p.id === matchWinnerId);
        if (winner) {
            return (
                <VictoryOverlay
                    winner={winner}
                    onComplete={() => setShowVictoryOverlay(false)}
                />
            );
        }
    }

    // Match winner screen (after overlay dismisses)
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

                {/* Countdown for match modes, button for single game */}
                {matchMode !== 'off' ? (
                    <div className="text-6xl font-bold text-blue-400 animate-pulse">
                        {countdown}
                    </div>
                ) : (
                    <>
                        <button
                            onClick={startNewLeg}
                            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors text-lg"
                        >
                            Play Again
                        </button>
                        <button onClick={onPlayAgain} className="text-zinc-500 hover:text-white transition-colors">
                            Back to Rules
                        </button>
                    </>
                )}
            </div>
        );
    }

    // Partial scaling for player list (scales less than the board)
    const playerListScale = 1 + ((gameViewScale / 100) - 1) * 0.35;

    // Main game view
    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 gap-12">
            {/* Player leg scores */}
            <div className="flex items-center gap-6" style={{ zoom: playerListScale }}>
                {/* Rotate visual order based on leg starter */}
                {[...players.slice(legStarterIndex), ...players.slice(0, legStarterIndex)].map((player) => {
                    const ld = legData.find(d => d.playerId === player.id);
                    const md = matchData.find(m => m.playerId === player.id);
                    // Active check must compare IDs since list is rotated
                    const isActive = player.id === players[currentPlayerIndex]?.id;
                    return (
                        <div key={player.id} className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all backdrop-blur-md border-2 ${isActive ? 'bg-white/15 text-white border-white animate-glow-pulse z-10' : 'bg-white/10 text-zinc-300 border-white/10'}`}>
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-zinc-700/50 overflow-hidden shrink-0">
                                {player.photo ? (
                                    <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg font-bold opacity-50">
                                        {player.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div>
                                <div className="text-xs uppercase tracking-wider opacity-75 mb-0.5">
                                    {player.name}
                                    {!ld?.hasStarted && inMode === 'double' && <span className="ml-1 text-yellow-400">(waiting)</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl font-bold tabular-nums leading-none">{ld?.remaining ?? baseScore}</div>

                                    {/* Match Stats */}
                                    {matchMode !== 'off' && (
                                        <div className="flex items-center gap-1.5 ml-1">
                                            {/* Sets (Yellow) */}
                                            {matchMode === 'sets' && (
                                                <div className="w-6 h-6 flex items-center justify-center rounded bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-sm font-bold shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                                    {md?.setsWon ?? 0}
                                                </div>
                                            )}
                                            {/* Legs (Green) */}
                                            <div className="w-6 h-6 flex items-center justify-center rounded bg-green-500/20 border border-green-500/40 text-green-400 text-sm font-bold shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                                {md?.legsWon ?? 0}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main game area - Dartboard and Score side by side */}
            <div style={{ zoom: gameViewScale / 100 }}>
                <div className="flex items-center justify-center gap-12">
                    {/* Dartboard */}
                    <Dartboard
                        size={300}
                        glowColor={themeGlow}
                        highlightSegment={checkoutSuggestions.length > 0 ? checkoutSuggestions[0][0] : undefined}
                    />

                    {/* Score and throw boxes */}
                    <div className="flex flex-col items-center gap-4">
                        <div className={`text-9xl font-bold tabular-nums leading-none ${isBust ? 'text-red-500' : 'text-white'}`}>
                            {isBust ? 'BUST' : projectedScore}
                        </div>

                        {/* 3-Box Throw Display */}
                        <div className="flex items-center justify-center gap-4">
                            {[0, 1, 2].map(idx => {
                                const throwName = turnThrows[idx];
                                const checkoutThrow = checkoutSuggestions.length > 0 && !throwName ? checkoutSuggestions[0][idx - turnThrows.length] : null;

                                return (
                                    <div
                                        key={idx}
                                        className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center transition-all backdrop-blur-md ${throwName
                                            ? 'bg-white/15 border-white/30 text-white'
                                            : checkoutThrow
                                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                                : 'bg-white/5 border-white/10 text-zinc-600'
                                            }`}
                                    >
                                        <span className="text-2xl font-bold">
                                            {throwName || checkoutThrow || ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Turn score */}
                        <div className={`text-3xl font-bold tabular-nums ${isBust ? 'text-red-400' : 'text-zinc-400'}`}>
                            {turnScore > 0 ? `+${turnScore}` : ''}
                        </div>

                        {isBust && (
                            <div className="text-red-400 text-sm">
                                {outMode === 'double' ? 'Must finish on a double! ' : ''}Reverts to {scoreAtTurnStartRef.current}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
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
