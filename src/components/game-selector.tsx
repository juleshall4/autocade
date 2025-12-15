import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type GameMode = 'quick-play' | 'tournament';
type TournamentFormat = 'round-robin' | 'single-bracket' | 'double-bracket';

interface GameSelectorProps {
    onSelectGame: (game: string, mode: GameMode, tournamentFormat?: TournamentFormat) => void;
    initialGameMode?: GameMode;
    onGameModeChange?: (mode: GameMode) => void;
}

const GAMES = [
    { id: 'x01', name: 'X01', description: '501, 301, etc.' },
    { id: 'around-the-clock', name: 'Around the Clock', description: 'Hit 1-20 in order' },
    { id: 'killer', name: 'Killer', description: 'Eliminate other players' },
    { id: 'cricket', name: 'Cricket', description: 'Hit 15-20 and bulls' },
    { id: 'gotcha', name: 'Gotcha', description: 'Race to a specific score' },
    { id: 'countup', name: 'Count Up', description: 'Get the highest score possible' },
];

const GAME_MODES: { id: GameMode; name: string; description: string }[] = [
    { id: 'quick-play', name: '⚡ Quick Play', description: 'Single game' },
    { id: 'tournament', name: '🏆 Tournament', description: 'Bracket play' },
];

const TOURNAMENT_FORMATS: { id: TournamentFormat; name: string }[] = [
    { id: 'round-robin', name: 'Round Robin' },
    { id: 'single-bracket', name: 'Single Bracket' },
    { id: 'double-bracket', name: 'Double Bracket' },
];

export function GameSelector({ onSelectGame, initialGameMode = 'quick-play', onGameModeChange }: GameSelectorProps) {
    const [gameMode, setGameMode] = useState<GameMode>(initialGameMode);
    const [tournamentFormat, setTournamentFormat] = useState<TournamentFormat>('round-robin');
    const [showModeDropdown, setShowModeDropdown] = useState(false);
    const [showFormatDropdown, setShowFormatDropdown] = useState(false);

    const handleGameModeChange = (mode: GameMode) => {
        setGameMode(mode);
        onGameModeChange?.(mode);
    };

    const selectedMode = GAME_MODES.find(m => m.id === gameMode)!;
    const selectedFormat = TOURNAMENT_FORMATS.find(f => f.id === tournamentFormat)!;

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-xl relative">
            <div className="flex w-full mb-8 justify-between items-center">
                <h1 style={{ fontFamily: "'Jersey 10', cursive", opacity: 0, animation: 'fadeIn 0.5s ease-out 0.05s forwards' }} className="self-start text-5xl leading-none text-white">
                    autocade
                </h1>
                <div className="flex gap-2">
                    {/* Tournament Format Dropdown - only show when tournament mode */}
                    {gameMode === 'tournament' && (
                        <div className="relative">
                            <button
                                onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                                onBlur={() => setTimeout(() => setShowFormatDropdown(false), 150)}
                                className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/20 transition-all text-sm h-10"
                            >
                                <span className="text-white font-medium">{selectedFormat.name}</span>
                                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showFormatDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showFormatDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-44 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {TOURNAMENT_FORMATS.map(format => (
                                        <button
                                            key={format.id}
                                            onClick={() => {
                                                setTournamentFormat(format.id);
                                                setShowFormatDropdown(false);
                                            }}
                                            className={`w-full px-4 py-2.5 text-left hover:bg-white/10 transition-colors ${tournamentFormat === format.id ? 'bg-white/5' : ''}`}
                                        >
                                            <div className="text-white font-medium text-sm">{format.name}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative">
                        <button
                            onClick={() => setShowModeDropdown(!showModeDropdown)}
                            onBlur={() => setTimeout(() => setShowModeDropdown(false), 150)}
                            className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/20 transition-all text-sm h-10"
                        >
                            <span className="text-white font-medium">{selectedMode.name}</span>
                            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showModeDropdown && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {GAME_MODES.map(mode => (
                                    <button
                                        key={mode.id}
                                        onClick={() => {
                                            handleGameModeChange(mode.id);
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
            </div>

            <div className="grid grid-cols-2 gap-3">
                {GAMES.map((game, index) => {
                    const isDisabled = ['cricket', 'gotcha', 'countup'].includes(game.id);
                    return (
                        <div
                            key={game.id}
                            style={{ opacity: 0, animation: `fadeInUp 0.5s ease-out ${0.2 + index * 0.06}s forwards` }}
                        >
                            <button
                                onClick={() => !isDisabled && onSelectGame(game.id, gameMode, gameMode === 'tournament' ? tournamentFormat : undefined)}
                                disabled={isDisabled}
                                className={`w-full p-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg transition-all text-left ${isDisabled
                                    ? 'opacity-30 cursor-not-allowed'
                                    : 'hover:border-white/30 hover:bg-white/20'
                                    }`}
                            >
                                <div className="text-lg font-bold text-white">{game.name}</div>
                                <div className="text-md font-light text-zinc-400">{game.description}</div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
