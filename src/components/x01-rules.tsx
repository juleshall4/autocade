import { useState } from 'react';
import { Target } from 'lucide-react';

export type X01Mode = 'single' | 'double';
export type MatchMode = 'off' | 'legs' | 'sets';

export interface X01Settings {
    baseScore: number;
    inMode: X01Mode;
    outMode: X01Mode;
    matchMode: MatchMode;
    legsToWin: number;
    setsToWin: number;
}

interface X01RulesProps {
    onStartGame: (settings: X01Settings) => void;
    onBack: () => void;
}

const BASE_SCORES = [121, 170, 301, 501, 701, 901];
const LEGS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const SETS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export function X01Rules({ onStartGame, onBack }: X01RulesProps) {
    const [baseScore, setBaseScore] = useState(501);
    const [inMode, setInMode] = useState<X01Mode>('single');
    const [outMode, setOutMode] = useState<X01Mode>('double');
    const [matchMode, setMatchMode] = useState<MatchMode>('off');
    const [legsToWin, setLegsToWin] = useState(3);
    const [setsToWin, setSetsToWin] = useState(3);

    const handleStart = () => {
        onStartGame({ baseScore, inMode, outMode, matchMode, legsToWin, setsToWin });
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <Target className="w-8 h-8" />
                X01
            </h1>

            {/* Rules List */}
            <div className="w-full max-w-sm space-y-6 mb-8">
                {/* Starting Score */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Starting Score
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {BASE_SCORES.map(score => (
                            <button
                                key={score}
                                onClick={() => setBaseScore(score)}
                                className={`px-3 py-2 rounded font-bold text-sm transition-all ${baseScore === score
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                {score}
                            </button>
                        ))}
                    </div>
                </div>

                {/* In Mode */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        In Mode
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setInMode('single')}
                            className={`px-4 py-2 rounded font-bold transition-all ${inMode === 'single'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            Single
                        </button>
                        <button
                            onClick={() => setInMode('double')}
                            className={`px-4 py-2 rounded font-bold transition-all ${inMode === 'double'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            Double
                        </button>
                    </div>
                </div>

                {/* Out Mode */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Out Mode
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setOutMode('single')}
                            className={`px-4 py-2 rounded font-bold transition-all ${outMode === 'single'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            Single
                        </button>
                        <button
                            onClick={() => setOutMode('double')}
                            className={`px-4 py-2 rounded font-bold transition-all ${outMode === 'double'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            Double
                        </button>
                    </div>
                </div>

                {/* Match Mode */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Match Mode
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMatchMode('off')}
                            className={`px-4 py-2 rounded font-bold transition-all ${matchMode === 'off'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            Off
                        </button>
                        <button
                            onClick={() => setMatchMode('legs')}
                            className={`px-4 py-2 rounded font-bold transition-all ${matchMode === 'legs'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            Legs
                        </button>
                        <button
                            onClick={() => setMatchMode('sets')}
                            className={`px-4 py-2 rounded font-bold transition-all ${matchMode === 'sets'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            Sets
                        </button>
                    </div>
                </div>

                {/* Legs to Win (shown for legs and sets modes) */}
                {matchMode !== 'off' && (
                    <div>
                        <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                            {matchMode === 'sets' ? 'Legs per Set' : 'First to (Legs)'}
                        </label>
                        <select
                            value={legsToWin}
                            onChange={e => setLegsToWin(Number(e.target.value))}
                            className="w-full bg-zinc-800 text-white px-4 py-2 rounded font-bold border border-zinc-700 focus:border-blue-500 outline-none"
                        >
                            {LEGS_OPTIONS.map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Sets to Win (shown only for sets mode) */}
                {matchMode === 'sets' && (
                    <div>
                        <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                            First to (Sets)
                        </label>
                        <select
                            value={setsToWin}
                            onChange={e => setSetsToWin(Number(e.target.value))}
                            className="w-full bg-zinc-800 text-white px-4 py-2 rounded font-bold border border-zinc-700 focus:border-blue-500 outline-none"
                        >
                            {SETS_OPTIONS.map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Start Button */}
            <button
                onClick={handleStart}
                className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors text-lg"
            >
                Start Game
            </button>

            <button
                onClick={onBack}
                className="mt-6 px-4 py-2 text-sm text-zinc-500 hover:text-white transition-colors"
            >
                ← Back to Games
            </button>
        </div>
    );
}
