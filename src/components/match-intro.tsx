import { useEffect, useState, useRef } from 'react';
import type { Player } from '../types/player';

interface MatchIntroProps {
    matchNumber: number;
    totalMatches: number;
    player1: Player;
    player2: Player;
    onComplete: () => void;
}

export function MatchIntro({ matchNumber, totalMatches, player1, player2, onComplete }: MatchIntroProps) {
    const [showVs, setShowVs] = useState(false);
    const [showPlayers, setShowPlayers] = useState(false);

    // Use ref to prevent effect from restarting when onComplete changes
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        const timer1 = setTimeout(() => setShowPlayers(true), 200);
        const timer2 = setTimeout(() => setShowVs(true), 600);
        const timer3 = setTimeout(() => onCompleteRef.current(), 4000);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []); // Empty deps - only run once on mount

    const renderPlayer = (player: Player, side: 'left' | 'right') => (
        <div
            className={`flex flex-col items-center transition-all duration-500 ${showPlayers
                ? 'opacity-100 translate-x-0'
                : side === 'left' ? 'opacity-0 -translate-x-10' : 'opacity-0 translate-x-10'
                }`}
        >
            {player.photo ? (
                <img
                    src={player.photo}
                    alt={player.name}
                    className="w-28 h-28 rounded-full object-cover mb-4 border-4 border-yellow-500/30 shadow-lg shadow-yellow-500/10"
                />
            ) : (
                <div className="w-28 h-28 rounded-full bg-yellow-500/10 flex items-center justify-center text-5xl text-yellow-400 mb-4 border-4 border-yellow-500/30">
                    {player.name.charAt(0).toUpperCase()}
                </div>
            )}
            <span className="text-2xl font-bold text-white">{player.name}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="text-center">
                {/* Match Number */}
                <div className="mb-12">
                    <span className="text-yellow-400 text-xl font-bold uppercase tracking-widest">
                        Match {matchNumber} of {totalMatches}
                    </span>
                </div>

                {/* Players VS */}
                <div className="flex items-center justify-center gap-16">
                    {renderPlayer(player1, 'left')}

                    <div
                        className={`text-6xl font-black text-yellow-400 transition-all duration-300 ${showVs ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                            }`}
                        style={{ textShadow: '0 0 40px rgba(234, 179, 8, 0.3)' }}
                    >
                        VS
                    </div>

                    {renderPlayer(player2, 'right')}
                </div>

                {/* Starting hint */}
                <p className="mt-12 text-zinc-500 text-sm animate-pulse">
                    Match starting...
                </p>
            </div>
        </div>
    );
}
