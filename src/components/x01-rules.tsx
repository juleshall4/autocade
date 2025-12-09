import { Target } from 'lucide-react';

interface X01RulesProps {
    onStartGame: (baseScore: number) => void;
    onBack: () => void;
}

const BASE_SCORES = [121, 170, 301, 501, 701, 901];

export function X01Rules({ onStartGame, onBack }: X01RulesProps) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Target className="w-8 h-8" />
                X01
            </h1>
            <p className="text-zinc-500 mb-8">Select starting score</p>

            <div className="grid grid-cols-3 gap-3 max-w-md">
                {BASE_SCORES.map(score => (
                    <button
                        key={score}
                        onClick={() => onStartGame(score)}
                        className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-800 transition-all"
                    >
                        <div className="text-3xl font-bold text-white">{score}</div>
                    </button>
                ))}
            </div>

            <button
                onClick={onBack}
                className="mt-8 px-4 py-2 text-sm text-zinc-500 hover:text-white transition-colors"
            >
                ← Back to Games
            </button>
        </div>
    );
}
