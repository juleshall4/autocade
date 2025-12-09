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
                    className={`px-4 py-2 rounded-lg transition-all ${player.id === currentPlayerId
                            ? 'bg-blue-600 text-white scale-110'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                >
                    <span className="font-medium">{player.name}</span>
                </div>
            ))}
        </div>
    );
}
