import { useEffect, useState, useRef } from 'react';
import type { Player } from '../types/player';

interface TournamentIntroProps {
    players: Player[];
    totalMatches: number;
    onComplete: () => void;
}

export function TournamentIntro({ players, totalMatches, onComplete }: TournamentIntroProps) {
    const [showPlayers, setShowPlayers] = useState(false);

    // Use ref to prevent effect from restarting when onComplete changes
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        // Fade in players
        const timer1 = setTimeout(() => setShowPlayers(true), 300);
        // Auto-dismiss after showing
        const timer2 = setTimeout(() => onCompleteRef.current(), 3500);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []); // Empty deps - only run once on mount

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="text-center max-w-3xl">
                {/* Tournament Title */}
                <div className="mb-10">
                    <div className="text-7xl mb-4">🏆</div>
                    <h1 className="text-5xl font-bold text-white mb-3">Round Robin Tournament</h1>
                    <p className="text-xl text-yellow-400 font-medium">
                        {players.length} Players • {totalMatches} Matches
                    </p>
                </div>

                {/* Players Grid */}
                <div
                    className={`flex flex-wrap justify-center gap-4 transition-all duration-700 ${showPlayers ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                >
                    {players.map((player, index) => (
                        <div
                            key={player.id}
                            className="flex flex-col items-center p-4 bg-white/5 border border-yellow-500/20 rounded-xl backdrop-blur-md"
                            style={{
                                opacity: 0,
                                animation: showPlayers ? `fadeInUp 0.5s ease-out ${index * 0.1}s forwards` : 'none'
                            }}
                        >
                            {player.photo ? (
                                <img
                                    src={player.photo}
                                    alt={player.name}
                                    className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-yellow-500/30"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center text-2xl text-yellow-400 mb-2 border-2 border-yellow-500/30">
                                    {player.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="text-white font-medium">{player.name}</span>
                        </div>
                    ))}
                </div>

                {/* Starting hint */}
                <p className="mt-10 text-zinc-500 text-sm animate-pulse">
                    Tournament starting...
                </p>
            </div>
        </div>
    );
}
