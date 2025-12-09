import { useEffect, useState, useRef } from "react";
import type { AutodartsState } from "../types/autodarts";

interface AutodartsGameProps {
    state: AutodartsState | null;
}

const MAX_THROWS_PER_TURN = 3;

export function AutodartsGame({ state }: AutodartsGameProps) {
    const [turnScore, setTurnScore] = useState(0);
    const [lastThrow, setLastThrow] = useState("-");

    // Track previous throws to detect changes
    const prevThrowsRef = useRef<string[]>([]);

    useEffect(() => {
        if (!state) return;

        const currentThrows = state.throws || [];
        const currentNames = currentThrows.map(t => t.segment.name);
        const prevNames = prevThrowsRef.current;

        // Check if this is a simulator undo specifically
        const isSimulatorUndo = state.event === 'Throw removed';

        // Check if this is any kind of takeout or turn end
        const isTurnEnd = state.status === 'Takeout' ||
            state.status === 'Takeout in progress' ||
            state.status === 'Takeout finished' ||
            state.event === 'Takeout finished' ||
            state.event === 'Reset';

        // CASE 1: Turn ended (takeout or Next button) - reset score
        if (isTurnEnd && currentNames.length === 0 && prevNames.length > 0) {
            setTurnScore(0);
            setLastThrow("-");
        }
        // CASE 2: Simulator Undo (specific event from simulator)
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
        }
        // CASE 3: Physical takeout in progress (darts being removed one by one)
        else if (isTurnEnd && currentNames.length < prevNames.length) {
            // Don't subtract points during physical takeout
            // Score stays until all darts removed
        }
        // CASE 4: New throw (array grew) - only count up to 3
        else if (currentNames.length > prevNames.length) {
            // Only process throws within the limit
            for (let i = prevNames.length; i < Math.min(currentThrows.length, MAX_THROWS_PER_TURN); i++) {
                const t = currentThrows[i];
                const points = t.segment.number * t.segment.multiplier;
                setTurnScore(prev => prev + points);
                setLastThrow(t.segment.name);
            }
        }

        // Store current state for next comparison
        prevThrowsRef.current = currentNames;
    }, [state]);

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-16">
            {/* Turn Score */}
            <div className="flex flex-col items-center">
                <h3 className="text-zinc-500 uppercase tracking-widest text-sm mb-4">Turn Score</h3>
                <div className="text-9xl font-bold text-white tabular-nums leading-none">
                    {turnScore}
                </div>
            </div>

            {/* Last Throw */}
            <div className="flex flex-col items-center">
                <h3 className="text-zinc-500 uppercase tracking-widest text-sm mb-4">Last Throw</h3>
                <div className="text-6xl font-bold text-zinc-300 tabular-nums">
                    {lastThrow}
                </div>
            </div>
        </div>
    );
}

// Helper to parse throw name back to points (for undo)
function findThrowByName(name: string): { points: number } | null {
    if (name === 'Miss') return { points: 0 };

    const match = name.match(/^([STD])(\d+)$/);
    if (!match) return null;

    const [, prefix, numStr] = match;
    const num = parseInt(numStr, 10);
    const multiplier = prefix === 'T' ? 3 : prefix === 'D' ? 2 : 1;

    return { points: num * multiplier };
}
