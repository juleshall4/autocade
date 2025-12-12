import { useEffect, useState, useRef, useCallback } from "react";
import type { AutodartsState } from "../types/autodarts";
import type { Player } from "../types/player";
import type { AroundTheClockSettings, ATCOrder } from "./around-the-clock-rules";
import { VictoryOverlay } from "./victory-overlay";
import { Dartboard } from "./Dartboard";

interface AroundTheClockGameProps {
    state: AutodartsState | null;
    settings: AroundTheClockSettings;
    players: Player[];
    onPlayAgain: () => void;
    themeGlow?: string;
    gameViewScale?: number;
}

interface PlayerGameData {
    playerId: string;
    currentTarget: number; // 1-20, 25 for bull
    currentTargetHits: number; // Hits on current target (for hitsRequired > 1)
    targetsHit: number[];  // Numbers already completed
    totalDarts: number;
    hits: number;
    misses: number;
    isWinner: boolean;
}

const MAX_THROWS_PER_TURN = 3;

// Generate the sequence based on order setting and bullFinish
function generateSequence(order: ATCOrder, bullFinish: boolean): number[] {
    const bull = bullFinish ? [25] : [];
    if (order === '1-20-bull') {
        return [...Array.from({ length: 20 }, (_, i) => i + 1), ...bull];
    } else if (order === '20-1-bull') {
        return [...Array.from({ length: 20 }, (_, i) => 20 - i), ...bull];
    } else {
        // Random order, shuffle 1-20, then bull at end if enabled
        const nums = Array.from({ length: 20 }, (_, i) => i + 1);
        for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        return [...nums, ...bull];
    }
}

function createPlayerData(playerId: string, sequence: number[]): PlayerGameData {
    return {
        playerId,
        currentTarget: sequence[0],
        currentTargetHits: 0,
        targetsHit: [],
        totalDarts: 0,
        hits: 0,
        misses: 0,
        isWinner: false,
    };
}

export function AroundTheClockGame({
    state,
    settings,
    players,
    onPlayAgain,
    themeGlow,
    gameViewScale = 100,
}: AroundTheClockGameProps) {
    // Generate sequence once on mount
    const [sequence] = useState<number[]>(() => generateSequence(settings.order, settings.bullFinish));

    // Player data
    const [playerData, setPlayerData] = useState<PlayerGameData[]>(() =>
        players.map(p => createPlayerData(p.id, sequence))
    );
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [winnerId, setWinnerId] = useState<string | null>(null);

    // Turn tracking
    const [turnThrows, setTurnThrows] = useState<string[]>([]);

    // Victory overlay
    const [showVictoryOverlay, setShowVictoryOverlay] = useState(false);

    // Track previous state
    const prevThrowsRef = useRef<string[]>([]);

    const currentPlayer = players[currentPlayerIndex];
    const currentPlayerData = playerData.find(pd => pd.playerId === currentPlayer?.id);

    // Reinitialize on player/settings change
    useEffect(() => {
        const newSequence = generateSequence(settings.order, settings.bullFinish);
        setPlayerData(players.map(p => createPlayerData(p.id, newSequence)));
        setCurrentPlayerIndex(0);
        setWinnerId(null);
        setTurnThrows([]);
        prevThrowsRef.current = [];
    }, [players.length, settings.order, settings.bullFinish]);

    // Get next target index for a player
    const getNextTarget = useCallback((targetsHit: number[]): number | null => {
        const nextIndex = targetsHit.length;
        if (nextIndex >= sequence.length) return null;
        return sequence[nextIndex];
    }, [sequence]);

    // Check if a throw hits the target and return multiplier (0 = miss, 1 = single, 2 = double, 3 = triple)
    const getHitMultiplier = useCallback((throwName: string, target: number): number => {
        // Parse the throw name (e.g., "S20", "D25", "T19")
        if (throwName === 'Miss') return 0;

        const match = throwName.match(/^([STD])(\d+)$/);
        if (!match) return 0;

        const [, prefix, numStr] = match;
        const num = parseInt(numStr, 10);

        // Must hit the correct number
        if (num !== target) return 0;

        // For "full" mode, any hit on the number counts with multiplier
        if (settings.mode === 'full') {
            if (prefix === 'T') return 3;
            if (prefix === 'D') return 2;
            return 1;
        }

        // For specific modes, check the segment type
        if (settings.mode === 'single' && prefix === 'S') return 1;
        if (settings.mode === 'outer-single' && prefix === 'S') return 1;
        if (settings.mode === 'double' && prefix === 'D') return 1; // Only counts as 1 in double mode
        if (settings.mode === 'triple' && prefix === 'T') return 1; // Only counts as 1 in triple mode

        return 0;
    }, [settings.mode]);

    // Legacy helper for hit detection
    const isHit = useCallback((throwName: string, target: number): boolean => {
        return getHitMultiplier(throwName, target) > 0;
    }, [getHitMultiplier]);

    // Main game logic
    useEffect(() => {
        if (!state || !currentPlayer || winnerId) return;

        const currentThrows = state.throws || [];
        const currentNames = currentThrows.map(t => t.segment.name);
        const prevNames = prevThrowsRef.current;

        const isTurnEnd = state.status === 'Takeout' ||
            state.status === 'Takeout in progress' ||
            state.status === 'Takeout finished' ||
            state.event === 'Takeout finished' ||
            state.event === 'Reset';

        // Turn ended - move to next player
        if (isTurnEnd && currentNames.length === 0 && prevNames.length > 0) {
            setCurrentPlayerIndex(prev => (prev + 1) % players.length);
            setTurnThrows([]);
        }
        // New throw
        else if (currentNames.length > prevNames.length && currentPlayerData) {
            for (let i = prevNames.length; i < Math.min(currentThrows.length, MAX_THROWS_PER_TURN); i++) {
                const t = currentThrows[i];
                const throwName = t.segment.name;
                const target = currentPlayerData.currentTarget;

                const multiplier = getHitMultiplier(throwName, target);
                const hitTarget = multiplier > 0;

                setPlayerData(prev => prev.map(pd => {
                    if (pd.playerId !== currentPlayer.id) return pd;

                    // Track hits on current target
                    let newCurrentTargetHits = pd.currentTargetHits;
                    let newTargetsHit = pd.targetsHit;
                    let newCurrentTarget = pd.currentTarget;

                    if (hitTarget) {
                        // In full mode with multiplier enabled, multiplier skips targets
                        if (settings.mode === 'full' && settings.multiplier) {
                            // Add targets based on multiplier (T = 3 targets, D = 2, S = 1)
                            // But DON'T skip past bull - multiplier only applies to numbered targets
                            const currentIndex = pd.targetsHit.length;
                            let targetsToAdd = multiplier;

                            // Cap at remaining targets, but don't skip bull if present
                            for (let j = 0; j < targetsToAdd && (currentIndex + j) < sequence.length; j++) {
                                const targetToAdd = sequence[currentIndex + j];
                                // If we hit bull (25), stop adding - bull must be hit separately
                                if (targetToAdd === 25 && j > 0) {
                                    break;
                                }
                                newTargetsHit = [...newTargetsHit, targetToAdd];
                            }
                            newCurrentTargetHits = 0; // Reset for next target
                        } else {
                            // Normal mode: count hits towards hitsRequired
                            newCurrentTargetHits = pd.currentTargetHits + 1;

                            // Check if we've hit enough times to advance
                            if (newCurrentTargetHits >= settings.hitsRequired) {
                                newTargetsHit = [...pd.targetsHit, pd.currentTarget];
                                newCurrentTargetHits = 0; // Reset for next target
                            }
                        }
                    }

                    const nextIndex = newTargetsHit.length;
                    const nextTarget = nextIndex >= sequence.length ? null : sequence[nextIndex];
                    const hasWon = nextTarget === null;
                    newCurrentTarget = nextTarget ?? 25;

                    if (hasWon) {
                        setWinnerId(currentPlayer.id);
                        setShowVictoryOverlay(true);
                    }

                    return {
                        ...pd,
                        currentTarget: newCurrentTarget,
                        currentTargetHits: newCurrentTargetHits,
                        targetsHit: newTargetsHit,
                        totalDarts: pd.totalDarts + 1,
                        hits: hitTarget ? pd.hits + 1 : pd.hits,
                        misses: hitTarget ? pd.misses : pd.misses + 1,
                        isWinner: hasWon,
                    };
                }));

                setTurnThrows(prev => [...prev, throwName].slice(0, 3));
            }
        }

        prevThrowsRef.current = currentNames;
    }, [state, currentPlayer, currentPlayerData, winnerId, players.length, getHitMultiplier, getNextTarget, sequence]);

    // Victory overlay
    if (winnerId && showVictoryOverlay) {
        const winner = players.find(p => p.id === winnerId);
        if (winner) {
            return (
                <VictoryOverlay
                    winner={winner}
                    onComplete={() => setShowVictoryOverlay(false)}
                />
            );
        }
    }

    // Winner screen (after overlay)
    if (winnerId) {
        const winner = players.find(p => p.id === winnerId);
        const winnerData = playerData.find(pd => pd.playerId === winnerId);

        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6">
                <div className="text-6xl">🏆</div>
                <div className="text-4xl font-bold text-green-400 animate-pulse text-center">
                    {winner?.name || 'Player'} WINS!
                </div>
                <div className="text-xl text-zinc-400">
                    Completed in {winnerData?.totalDarts} darts
                </div>

                {/* Per-player stats */}
                <div className="flex gap-4 w-full max-w-3xl">
                    {players.map(player => {
                        const pd = playerData.find(d => d.playerId === player.id);
                        if (!pd) return null;
                        const accuracy = pd.totalDarts > 0 ? Math.round((pd.hits / pd.totalDarts) * 100) : 0;
                        const isWinner = player.id === winnerId;

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
                                        {isWinner && <div className="text-xs text-green-400">🏆 Winner</div>}
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-zinc-500">Progress</span><span className="text-white font-bold">{pd.targetsHit.length}/21</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-500">Darts</span><span className="text-white font-bold">{pd.totalDarts}</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-500">Accuracy</span><span className="text-white font-bold">{accuracy}%</span></div>
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

    // Main game view
    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 gap-6">
            {/* Player scores */}
            <div className="flex items-center gap-4">
                {players.map((player, idx) => {
                    const pd = playerData.find(d => d.playerId === player.id);
                    const isActive = idx === currentPlayerIndex;
                    return (
                        <div key={player.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all backdrop-blur-md border-2 ${isActive ? 'bg-white/15 text-white scale-110 border-white' : 'bg-white/10 text-zinc-300 border-white/10'}`}>
                            <div className="w-10 h-10 rounded-full bg-zinc-700/50 overflow-hidden shrink-0">
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
                                </div>
                                <div className="text-2xl font-bold tabular-nums">
                                    {pd?.currentTarget === 25 ? 'BULL' : pd?.currentTarget}
                                    {settings.hitsRequired > 1 && (
                                        <span className="text-lg opacity-60"> {pd?.currentTargetHits || 0}/{settings.hitsRequired}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main game area */}
            <div style={{ zoom: gameViewScale / 100 }}>
                <div className="flex items-center justify-center gap-12">
                    {/* Dartboard with target highlighted based on mode */}
                    <Dartboard
                        size={300}
                        glowColor={themeGlow}
                        highlightSegment={currentPlayerData ? (() => {
                            const target = currentPlayerData.currentTarget;
                            // For bull, highlight based on mode
                            if (target === 25) {
                                if (settings.mode === 'double') return 'D25';
                                if (settings.mode === 'full') return 'full25';
                                return 'S25';
                            }
                            // For regular numbers
                            if (settings.mode === 'full') return `full${target}`;
                            if (settings.mode === 'double') return `D${target}`;
                            if (settings.mode === 'triple') return `T${target}`;
                            if (settings.mode === 'outer-single') return `OS${target}`;
                            return `S${target}`; // single mode - both singles
                        })() : undefined}
                    />

                    {/* Current target display */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-9xl font-bold tabular-nums leading-none text-white">
                            {currentPlayerData?.currentTarget === 25 ? 'BULL' : currentPlayerData?.currentTarget}
                        </div>

                        {/* 3-Box Throw Display */}
                        <div className="flex items-center justify-center gap-4">
                            {[0, 1, 2].map(idx => {
                                const throwName = turnThrows[idx];
                                const wasHit = throwName && currentPlayerData &&
                                    isHit(throwName, sequence[currentPlayerData.targetsHit.length - (turnThrows.length - idx)] || 0);

                                return (
                                    <div
                                        key={idx}
                                        className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center transition-all backdrop-blur-md ${throwName
                                            ? wasHit
                                                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                                : 'bg-white/15 border-white/30 text-white'
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

                    </div>
                </div>
            </div>
        </div>
    );
}
