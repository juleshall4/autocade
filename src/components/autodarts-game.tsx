import { useEffect, useState, useRef } from "react";
import type { AutodartsState } from "../types/autodarts";
import { getStatusEmoji } from "../types/autodarts";

interface AutodartsGameProps {
    state: AutodartsState | null;
}

export function AutodartsGame({ state }: AutodartsGameProps) {
    const [totalScore, setTotalScore] = useState(0);
    const [lastThrow, setLastThrow] = useState("-");

    // Track previous throws to detect changes
    const prevThrowsRef = useRef<string[]>([]);

    useEffect(() => {
        if (!state) return;

        const currentThrows = state.throws || [];
        const currentNames = currentThrows.map(t => t.segment.name);
        const prevNames = prevThrowsRef.current;

        // Check for undo (array shrunk)
        if (currentNames.length < prevNames.length) {
            // Find what was removed and subtract its points
            const removedThrowName = prevNames[prevNames.length - 1];
            const removedThrow = findThrowByName(removedThrowName);
            if (removedThrow) {
                setTotalScore(prev => Math.max(0, prev - removedThrow.points));
            }
            // Update last throw to the new last one
            if (currentThrows.length > 0) {
                setLastThrow(currentThrows[currentThrows.length - 1].segment.name);
            } else {
                setLastThrow("-");
            }
        }
        // Check for new throw (array grew)
        else if (currentNames.length > prevNames.length) {
            // Process only the new throws
            for (let i = prevNames.length; i < currentThrows.length; i++) {
                const t = currentThrows[i];
                const points = t.segment.number * t.segment.multiplier;
                setTotalScore(prev => prev + points);
                setLastThrow(t.segment.name);
            }
        }
        // Check for turn reset (takeout finished - array cleared)
        else if (currentNames.length === 0 && prevNames.length > 0 && state.status === 'Takeout finished') {
            // Don't reset score on takeout, just update last throw
            setLastThrow("-");
        }

        // Store current state for next comparison
        prevThrowsRef.current = currentNames;
    }, [state]);

    const statusEmoji = state ? getStatusEmoji(state.status) : "⏳";
    const statusText = state?.status || "Waiting...";

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-16">
            {/* Score */}
            <div className="flex flex-col items-center">
                <h3 className="text-zinc-500 uppercase tracking-widest text-sm mb-4">Total Score</h3>
                <div className="text-9xl font-bold text-white tabular-nums leading-none">
                    {totalScore}
                </div>
            </div>

            {/* Last Throw */}
            <div className="flex flex-col items-center">
                <h3 className="text-zinc-500 uppercase tracking-widest text-sm mb-4">Last Throw</h3>
                <div className="text-6xl font-bold text-zinc-300 tabular-nums">
                    {lastThrow}
                </div>
            </div>

            {/* Status */}
            <div className="flex flex-col items-center">
                <h3 className="text-zinc-500 uppercase tracking-widest text-sm mb-4">Status</h3>
                <div className="text-6xl">
                    {statusEmoji}
                </div>
                <div className="text-zinc-500 text-sm mt-2">
                    {statusText}
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
