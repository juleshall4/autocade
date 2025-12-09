import { useEffect, useState, useRef } from "react";
import type { AutodartsState } from "../types/autodarts";

interface AutodartsGameProps {
    state: AutodartsState | null;
}

export function AutodartsGame({ state }: AutodartsGameProps) {
    const [totalScore, setTotalScore] = useState(0);
    const [lastThrow, setLastThrow] = useState("-");

    // Track how many throws we've processed for the current turn
    const processedThrowsRef = useRef(0);

    useEffect(() => {
        if (!state) return;

        const currentThrows = state.throws || [];
        const numCurrentThrows = currentThrows.length;
        const prevNum = processedThrowsRef.current;

        // Detect new turn (throws array cleared or smaller than before)
        if (numCurrentThrows < prevNum) {
            processedThrowsRef.current = 0;
            // We could process new throws immediately if numCurrentThrows > 0 (unlikely on reset, but possible)
            // For safety, let's just reset and wait for next update or process if there are already throws
        }

        // Process new throws
        if (currentThrows.length > processedThrowsRef.current) {
            let newPoints = 0;
            let lastThrowLabel = lastThrow;

            for (let i = processedThrowsRef.current; i < currentThrows.length; i++) {
                const t = currentThrows[i];
                const points = t.segment.number * t.segment.multiplier;
                newPoints += points;
                lastThrowLabel = t.segment.name;
            }

            setTotalScore(prev => prev + newPoints);
            setLastThrow(lastThrowLabel);
            processedThrowsRef.current = currentThrows.length;
        }
    }, [state]);

    // Handle manual reset? Maybe simpler for now.

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

            {/* Debug Info (Optional, user wanted bare bones but good for verification) 
      <div className="text-xs text-zinc-700 absolute bottom-4">
        {state ? state.status : 'Waiting...'}
      </div>
      */}
        </div>
    );
}
