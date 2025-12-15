import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type GameMode = 'quick-play' | 'tournament';

interface GameSelectorProps {
    onSelectGame: (game: string, mode: GameMode) => void;
}

const GAMES = [
    { id: 'x01', name: '🎯 X01', description: '501, 301, etc.' },
    { id: 'cricket', name: '🏏 Cricket', description: 'Hit 15-20 and bulls' },
    { id: 'around-the-clock', name: '⏱️ Around the Clock', description: 'Hit 1-20 in order' },
    { id: 'killer', name: '💀 Killer', description: 'Eliminate other players' },
    { id: 'gotcha', name: '🏁 Gotcha', description: 'Race to a specific score' },
    { id: 'countup', name: '⬆️ Count Up', description: 'Get the highest score possible' },
];

const GAME_MODES: { id: GameMode; name: string; description: string }[] = [
    { id: 'quick-play', name: '⚡ Quick Play', description: 'Single game' },
    { id: 'tournament', name: '🏆 Tournament', description: 'Bracket play' },
];

export function GameSelector({ onSelectGame }: GameSelectorProps) {
    const [gameMode, setGameMode] = useState<GameMode>('quick-play');
    const [showModeDropdown, setShowModeDropdown] = useState(false);

    const selectedMode = GAME_MODES.find(m => m.id === gameMode)!;

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-xl relative">
            {/* Mode Dropdown - Top Right */}
            <div className="absolute top-4 right-4" style={{ opacity: 0, animation: 'fadeIn 0.5s ease-out 0.1s forwards' }}>
                <div className="relative">
                    <button
                        onClick={() => setShowModeDropdown(!showModeDropdown)}
                        onBlur={() => setTimeout(() => setShowModeDropdown(false), 150)}
                        className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/20 transition-all text-sm"
                    >
                        <span className="text-white font-medium">{selectedMode.name}</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showModeDropdown && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                            {GAME_MODES.map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => {
                                        setGameMode(mode.id);
                                        setShowModeDropdown(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${gameMode === mode.id ? 'bg-white/5' : ''}`}
                                >
                                    <div className="text-white font-medium text-sm">{mode.name}</div>
                                    <div className="text-zinc-500 text-xs">{mode.description}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <h1 style={{ fontFamily: "'Jersey 10', cursive", opacity: 0, animation: 'fadeIn 0.5s ease-out 0.05s forwards' }} className="self-start text-5xl leading-none text-white -mt-1 pb-8">
                autocade
            </h1>

            <div className="grid grid-cols-2 gap-3">
                {GAMES.map((game, index) => (
                    <div
                        key={game.id}
                        style={{ opacity: 0, animation: `fadeInUp 0.5s ease-out ${0.2 + index * 0.06}s forwards` }}
                    >
                        <button
                            onClick={() => onSelectGame(game.id, gameMode)}
                            className="w-full p-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg hover:border-white/30 hover:bg-white/20 transition-all text-left"
                        >
                            <div className="text-lg font-bold text-white">{game.name}</div>
                            <div className="text-md font-light text-zinc-400">{game.description}</div>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
