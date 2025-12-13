import { useEffect, useState, useRef } from 'react';
import type { Player } from '../types/player';

interface NextPlayerOverlayProps {
    player: Player;
    onComplete: () => void;
}

const DISPLAY_DURATION = 2000; // 2 seconds

export function NextPlayerOverlay({ player, onComplete }: NextPlayerOverlayProps) {
    const [isVisible, setIsVisible] = useState(false);
    const onCompleteRef = useRef(onComplete);

    // Update ref when prop changes
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Animate in
    useEffect(() => {
        const showTimer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(showTimer);
    }, []);

    // Auto-dismiss after duration
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onCompleteRef.current(), 500);
        }, DISPLAY_DURATION);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[90] pointer-events-none">
            {/* Sliding Panel - extends from right edge to center */}
            <div
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-1/2 flex items-center justify-center gap-6 pl-10 pr-10 py-8 rounded-l-2xl border-l border-t border-b border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl transition-all duration-500 ease-out pointer-events-auto ${isVisible
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 translate-x-full'
                    }`}
                style={{
                    transitionTimingFunction: isVisible ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'ease-in',
                    boxShadow: isVisible ? '-10px 0 40px -10px rgba(0, 0, 0, 0.4), 0 0 60px -15px rgba(59, 130, 246, 0.2)' : 'none'
                }}
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => onCompleteRef.current(), 500);
                }}
            >
                {/* Accent line on the left */}
                <div className="absolute left-0 top-6 bottom-6 w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 rounded-full" />

                {/* Player photo */}
                <div className={`w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/30 shadow-xl transition-all duration-500 delay-100 ${isVisible ? 'scale-100' : 'scale-75'
                    }`}>
                    {player.photo ? (
                        <img
                            src={player.photo}
                            alt={player.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white/80">
                                {player.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Text content */}
                <div className={`transition-all duration-500 delay-150 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                    }`}>
                    <div className="text-4xl font-bold text-white mb-1 tracking-tight">
                        {player.name}
                    </div>
                    <div className="text-xl text-blue-400 font-medium">
                        You're up!
                    </div>
                </div>
            </div>
        </div>
    );
}

