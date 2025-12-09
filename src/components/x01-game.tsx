import { useEffect, useState, useRef } from "react";
import type { AutodartsState } from "../types/autodarts";
import { getCheckoutSuggestions, formatCheckout } from "../utils/checkouts";

interface X01GameProps {
    state: AutodartsState | null;
    baseScore: number;
}

const MAX_THROWS_PER_TURN = 3;

export function X01Game({ state, baseScore }: X01GameProps) {
    const [remainingScore, setRemainingScore] = useState(baseScore);
    const [turnScore, setTurnScore] = useState(0);
    const [lastThrow, setLastThrow] = useState("-");
    const [isBust, setIsBust] = useState(false);

    // Track previous state
    const prevThrowsRef = useRef<string[]>([]);
    const scoreAtTurnStartRef = useRef(baseScore);

    useEffect(() => {
        if (!state) return;

        const currentThrows = state.throws || [];
        const currentNames = currentThrows.map(t => t.segment.name);
        const prevNames = prevThrowsRef.current;

        // Check event types
        const isSimulatorUndo = state.event === 'Throw removed';
        const isTurnEnd = state.status === 'Takeout' ||
            state.status === 'Takeout in progress' ||
            state.status === 'Takeout finished' ||
            state.event === 'Takeout finished' ||
            state.event === 'Reset';

        // CASE 1: Turn ended (takeout or Next button)
        if (isTurnEnd && currentNames.length === 0 && prevNames.length > 0) {
            if (isBust) {
                // Bust - revert to start-of-turn score
                setRemainingScore(scoreAtTurnStartRef.current);
            } else {
                // Apply turn score
                setRemainingScore(prev => prev - turnScore);
            }
            // Reset for next turn
            setTurnScore(0);
            setLastThrow("-");
            setIsBust(false);
            scoreAtTurnStartRef.current = isBust ? scoreAtTurnStartRef.current : remainingScore - turnScore;
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
            // Clear bust if we undo
            setIsBust(false);
        }
        // CASE 3: Physical takeout in progress
        else if (isTurnEnd && currentNames.length < prevNames.length) {
            // Don't change anything during physical takeout
        }
        // CASE 4: New throw
        else if (currentNames.length > prevNames.length && !isBust) {
            for (let i = prevNames.length; i < Math.min(currentThrows.length, MAX_THROWS_PER_TURN); i++) {
                const t = currentThrows[i];
                const points = t.segment.number * t.segment.multiplier;

                // Check for bust (would go below 0 or to 1)
                const newTurnScore = turnScore + points;
                const projectedRemaining = remainingScore - newTurnScore;

                if (projectedRemaining < 0 || projectedRemaining === 1) {
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
    }, [state, turnScore, remainingScore, isBust]);

    // Calculate projected score
    const projectedScore = isBust ? remainingScore : remainingScore - turnScore;

    // Get checkout suggestions if score is 180 or less
    const dartsRemaining = MAX_THROWS_PER_TURN - (state?.throws?.length || 0);
    const checkoutSuggestions = projectedScore <= 170 && projectedScore >= 2 && !isBust
        ? getCheckoutSuggestions(projectedScore, Math.max(1, dartsRemaining))
        : [];

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-8">
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
                    Score will revert to {scoreAtTurnStartRef.current} on next turn
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
