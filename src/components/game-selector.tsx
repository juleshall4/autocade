

interface GameSelectorProps {
    onSelectGame: (game: string) => void;
}

const GAMES = [
    { id: 'x01', name: 'X01', description: '501, 301, etc.' },
    { id: 'cricket', name: 'Cricket', description: 'Hit 15-20 and bulls' },
    { id: 'around-the-clock', name: 'Around the Clock', description: 'Hit 1-20 in order' },
    { id: 'killer', name: 'Killer', description: 'Eliminate other players' },
];

export function GameSelector({ onSelectGame }: GameSelectorProps) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8">

            <div className="w-full max-w-md space-y-3">
                {GAMES.map(game => (
                    <button
                        key={game.id}
                        onClick={() => onSelectGame(game.id)}
                        className="w-full p-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg hover:border-white/30 hover:bg-white/20 transition-all text-left"
                    >
                        <div className="text-lg font-bold text-white">{game.name}</div>
                        <div className="text-md text-zinc-400">{game.description}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}
