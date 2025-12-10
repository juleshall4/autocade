import type { Player } from '../types/player';

interface PlayerListProps {
    players: Player[];
    currentPlayerId?: string;
}

export function PlayerList({ players, currentPlayerId }: PlayerListProps) {
    if (players.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center justify-center gap-4 mb-8">
            {players.map(player => (
                <div
                    key={player.id}
                    className={`px-4 py-2 rounded-lg transition-all backdrop-blur-md border-2 ${player.id === currentPlayerId
                        ? 'bg-white/15 text-white border-white scale-110 font-bold'
                        : 'bg-white/10 text-zinc-300 border-white/10'
                        }`}
                >
                    <span className="font-medium">{player.name}</span>
                </div>
            ))}
        </div>
    );
}
