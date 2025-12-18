import { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { Player } from '../types/player';

interface VictoryOverlayProps {
    winner: Player;
    onComplete: () => void;
}

const DISPLAY_DURATION = 3000; // 3 seconds

export function VictoryOverlay({ winner, onComplete }: VictoryOverlayProps) {
    const [countdown, setCountdown] = useState(3);
    const onCompleteRef = useRef(onComplete);

    // Update ref when prop changes
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Auto-dismiss after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onCompleteRef.current();
        }, DISPLAY_DURATION);
        return () => clearTimeout(timer);
    }, []);

    // Countdown display
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Confetti effect
    useEffect(() => {
        // Initial burst
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        // Continuous smaller bursts
        const interval = setInterval(() => {
            confetti({
                particleCount: 30,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            confetti({
                particleCount: 30,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center cursor-pointer"
            onClick={onComplete}
        >
            {winner.victoryVideo ? (
                // Fullscreen video
                <video
                    src={winner.victoryVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                />
            ) : (
                // Fallback if no video - show photo and celebration
                <div className="flex flex-col items-center justify-center space-y-8">
                    {/* Winner photo */}
                    <div className="w-48 h-48 rounded-full overflow-hidden ring-4 ring-yellow-400 animate-pulse">
                        {winner.photo ? (
                            <img
                                src={winner.photo}
                                alt={winner.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                <span className="text-6xl font-bold text-zinc-500">
                                    {winner.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Winner text */}
                    <div className="text-center">
                        <div className="text-6xl mb-4">🏆</div>
                        <div className="text-5xl font-bold text-yellow-400 animate-bounce">
                            {winner.name}
                        </div>
                        <div className="text-3xl text-white mt-2">WINS!</div>
                    </div>
                </div>
            )}

            {/* Countdown in corner */}
            <div className="absolute bottom-4 right-4 text-white/50 text-sm">
                {countdown}s
            </div>
        </div>
    );
}
