import { useEffect, useState } from "react";
import type { DartsCallerEvent } from "../types/darts-caller";

interface GameDisplayProps {
    lastMessage: DartsCallerEvent | null;
}

export function GameDisplay({ lastMessage }: GameDisplayProps) {
    const [score, setScore] = useState(0);
    const [lastThrow, setLastThrow] = useState<string>("-");

    const getThrowLabel = (type: string, number: string | number) => {
        let prefix = "";
        const lowerType = type.toLowerCase();

        if (lowerType.includes("single")) prefix = "S";
        else if (lowerType.includes("double")) prefix = "D";
        else if (lowerType.includes("triple")) prefix = "T";
        else if (lowerType === "outside") return "Miss"; // Or handle as miss

        return `${prefix}${number}`;
    };

    useEffect(() => {
        if (!lastMessage || !lastMessage.game) return;

        if (
            lastMessage.event === "dart1-thrown" ||
            lastMessage.event === "dart2-thrown" ||
            lastMessage.event === "dart3-thrown"
        ) {
            const { dartValue, type, fieldNumber } = lastMessage.game;

            // Update Score
            const points = parseInt(dartValue, 10);
            if (!isNaN(points)) {
                setScore((prev) => prev + points);
            }

            // Update Last Throw
            if (type && fieldNumber) {
                setLastThrow(getThrowLabel(type, fieldNumber));
            }
        } else if (lastMessage.event === "match-started") {
            setScore(0);
            setLastThrow("-");
        }
    }, [lastMessage]);

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-16">
            {/* Score */}
            <div className="flex flex-col items-center">
                <h3 className="text-zinc-500 uppercase tracking-widest text-sm mb-4">Total Score</h3>
                <div className="text-9xl font-bold text-white tabular-nums leading-none">
                    {score}
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
