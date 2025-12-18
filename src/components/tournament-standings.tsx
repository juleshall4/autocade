import { useEffect, useState, useRef } from 'react';
import type { PlayerStanding } from '../logic/round-robin';

interface TournamentStandingsProps {
    standings: PlayerStanding[];
    currentMatchNumber: number;
    totalMatches: number;
    isComplete: boolean;
    onNextMatch: () => void;
    onEndTournament: () => void;
    playerPhotos?: Map<string, string>;
}

export function TournamentStandings({
    standings,
    currentMatchNumber,
    totalMatches,
    isComplete,
    onNextMatch,
    onEndTournament,
    playerPhotos,
}: TournamentStandingsProps) {
    const winner = isComplete && standings.length > 0 ? standings[0] : null;
    const [countdown, setCountdown] = useState(5);

    // Use ref for callback to prevent effect restart
    const onNextMatchRef = useRef(onNextMatch);
    onNextMatchRef.current = onNextMatch;

    // Auto-countdown for next match (only if not complete)
    useEffect(() => {
        if (isComplete) return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            onNextMatchRef.current();
        }
    }, [countdown, isComplete]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900/95 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-6">
                    {isComplete ? (
                        <>
                            <div className="text-4xl mb-2">🏆</div>
                            <h2 className="text-2xl font-bold text-white">Tournament Complete!</h2>
                            <p className="text-zinc-400 mt-1">
                                {winner?.playerName} wins with {winner?.points} points!
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-white">Match {currentMatchNumber} Complete</h2>
                            <p className="text-zinc-400 text-sm">
                                {totalMatches - currentMatchNumber} matches remaining
                            </p>
                        </>
                    )}
                </div>

                {/* Standings Table */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden mb-6">
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2 bg-white/5 text-xs text-zinc-500 uppercase tracking-widest">
                        <div>#</div>
                        <div>Player</div>
                        <div className="text-center">W-L</div>
                        <div className="text-center">Pts</div>
                    </div>

                    {standings.map((standing, index) => (
                        <div
                            key={standing.playerId}
                            className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 items-center border-t border-white/5 ${index === 0 && isComplete ? 'bg-yellow-500/10' : ''
                                }`}
                        >
                            <div className={`font-bold ${index === 0 ? 'text-yellow-400' : 'text-zinc-500'}`}>
                                {index + 1}
                            </div>
                            <div className="flex items-center gap-3">
                                {playerPhotos?.get(standing.playerId) ? (
                                    <img
                                        src={playerPhotos.get(standing.playerId)}
                                        alt=""
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-sm">
                                        {standing.playerName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="text-white font-medium">{standing.playerName}</span>
                            </div>
                            <div className="text-center text-zinc-400">
                                {standing.wins}-{standing.losses}
                            </div>
                            <div className={`text-center font-bold ${index === 0 ? 'text-yellow-400' : 'text-white'
                                }`}>
                                {standing.points}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {isComplete ? (
                        <button
                            onClick={onEndTournament}
                            className="flex-1 px-6 py-3 bg-yellow-500/80 text-white font-bold rounded-lg hover:brightness-110 transition-all"
                        >
                            Back to Menu
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onEndTournament}
                                className="px-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                            >
                                Abort Tournament
                            </button>
                            <button
                                onClick={onNextMatch}
                                className="flex-1 px-6 py-3 bg-yellow-500/80 text-white font-bold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                            >
                                <span>Next Match</span>
                                <span className="w-6 h-6 rounded-full bg-white/20 text-sm flex items-center justify-center">
                                    {countdown}
                                </span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
