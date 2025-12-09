import { Gamepad } from 'lucide-react';

interface GameSelectorProps {
    onSelectGame: (game: string) => void;
    onBack: () => void;
}

const GAMES = [
    { id: 'x01', name: 'X01', description: '501, 301, etc.' },
    { id: 'cricket', name: 'Cricket', description: 'Hit 15-20 and bulls' },
    { id: 'around-the-clock', name: 'Around the Clock', description: 'Hit 1-20 in order' },
    { id: 'killer', name: 'Killer', description: 'Eliminate other players' },
];

export function GameSelector({ onSelectGame, onBack }: GameSelectorProps) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <Gamepad className="w-8 h-8" />
                Select Game
            </h1>

            <div className="w-full max-w-md space-y-3">
                {GAMES.map(game => (
                    <button
                        key={game.id}
                        onClick={() => onSelectGame(game.id)}
                        className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-800 transition-all text-left"
                    >
                        <div className="text-xl font-bold text-white">{game.name}</div>
                        <div className="text-sm text-zinc-500">{game.description}</div>
                    </button>
                ))}
            </div>

            <button
                onClick={onBack}
                className="mt-8 px-4 py-2 text-sm text-zinc-500 hover:text-white transition-colors"
            >
                ← Back
            </button>
        </div>
    );
}
