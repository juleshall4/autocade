interface GameSelectorProps {
    onSelectGame: (game: string) => void;
}

const GAMES = [
    { id: 'x01', name: '🎯 X01', description: '501, 301, etc.' },
    { id: 'cricket', name: '🏏 Cricket', description: 'Hit 15-20 and bulls' },
    { id: 'around-the-clock', name: '⏱️ Around the Clock', description: 'Hit 1-20 in order' },
    { id: 'killer', name: '💀 Killer', description: 'Eliminate other players' },
    { id: 'gotcha', name: '🏁 Gotcha', description: 'Race to a specific score' },
    { id: 'countup', name: '⬆️ Count Up', description: 'Get the highest score possible' },
];

export function GameSelector({ onSelectGame }: GameSelectorProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-xl">
            <h1 style={{ fontFamily: "'Jersey 10', cursive" }} className="self-start text-5xl leading-none text-white -mt-1 pb-8">
                autocade
            </h1>

            <div className="grid grid-cols-2 gap-3">
                {GAMES.map(game => (
                    <button
                        key={game.id}
                        onClick={() => onSelectGame(game.id)}
                        className="w-full p-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg hover:border-white/30 hover:bg-white/20 transition-all text-left"
                    >
                        <div className="text-lg font-bold text-white">{game.name}</div>
                        <div className="text-md font-light text-zinc-400">{game.description}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}
