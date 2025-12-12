import { useState } from 'react';

export type X01Mode = 'single' | 'double';
export type MatchMode = 'off' | 'legs' | 'sets';
export type StartingOrder = 'random' | 'bull-off';

export interface X01Settings {
    baseScore: number;
    inMode: X01Mode;
    outMode: X01Mode;
    matchMode: MatchMode;
    legsToWin: number;
    setsToWin: number;
    startingOrder: StartingOrder;
}

interface X01RulesProps {
    onNext: (settings: X01Settings) => void;
    onBack: () => void;
    accentClass?: string;
    accentBorderClass?: string;
}

const BASE_SCORES = [121, 170, 301, 501, 701, 901];
const LEGS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const SETS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export function X01Rules({ onNext, onBack, accentClass = 'bg-blue-500/80', accentBorderClass = 'border-blue-400/50' }: X01RulesProps) {
    const [baseScore, setBaseScore] = useState(501);
    const [inMode, setInMode] = useState<X01Mode>('single');
    const [outMode, setOutMode] = useState<X01Mode>('double');
    const [matchMode, setMatchMode] = useState<MatchMode>('off');
    const [legsToWin, setLegsToWin] = useState(3);
    const [setsToWin, setSetsToWin] = useState(3);
    const [startingOrder, setStartingOrder] = useState<StartingOrder>('random');

    const handleNext = () => {
        onNext({ baseScore, inMode, outMode, matchMode, legsToWin, setsToWin, startingOrder });
    };

    // Glassy button style with theme-aware accent
    const optionBtn = (active: boolean) =>
        `btn-scale-lg px-3 py-2 rounded-lg font-bold text-sm transition-all backdrop-blur-md border ${active
            ? `${accentClass} ${accentBorderClass} text-white`
            : 'bg-white/10 border-white/10 text-zinc-300 hover:bg-white/20'
        }`;

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-xl">
            {/* Rules List */}
            <div className="w-full max-w-sm space-y-6 mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    🎯 X01
                </h1>

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
                                className={optionBtn(baseScore === score)}
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
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setInMode('single')} className={optionBtn(inMode === 'single')}>
                            Single
                        </button>
                        <button onClick={() => setInMode('double')} className={optionBtn(inMode === 'double')}>
                            Double
                        </button>
                    </div>
                </div>

                {/* Out Mode */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Out Mode
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setOutMode('single')} className={optionBtn(outMode === 'single')}>
                            Single
                        </button>
                        <button onClick={() => setOutMode('double')} className={optionBtn(outMode === 'double')}>
                            Double
                        </button>
                    </div>
                </div>

                {/* Match Mode */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Match Mode
                    </label>
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* Button group */}
                        <div className="flex gap-2">
                            <button onClick={() => setMatchMode('off')} className={optionBtn(matchMode === 'off')}>
                                Off
                            </button>
                            <button onClick={() => setMatchMode('legs')} className={optionBtn(matchMode === 'legs')}>
                                Legs
                            </button>
                            <button onClick={() => setMatchMode('sets')} className={optionBtn(matchMode === 'sets')}>
                                Sets
                            </button>
                        </div>

                        {/* Selectors to the right */}
                        {matchMode === 'legs' && (
                            <select
                                value={legsToWin}
                                onChange={e => setLegsToWin(Number(e.target.value))}
                                className="bg-white/10 backdrop-blur-md text-white px-3 py-2 rounded font-bold border border-white/10 focus:border-white/30 outline-none text-sm"
                            >
                                {LEGS_OPTIONS.map(n => (
                                    <option key={n} value={n} className="bg-zinc-900">First to {n}</option>
                                ))}
                            </select>
                        )}
                        {matchMode === 'sets' && (
                            <>
                                <select
                                    value={legsToWin}
                                    onChange={e => setLegsToWin(Number(e.target.value))}
                                    className="bg-white/10 backdrop-blur-md text-white px-3 py-2 rounded font-bold border border-white/10 focus:border-white/30 outline-none text-sm"
                                >
                                    {LEGS_OPTIONS.map(n => (
                                        <option key={n} value={n} className="bg-zinc-900">{n} legs/set</option>
                                    ))}
                                </select>
                                <select
                                    value={setsToWin}
                                    onChange={e => setSetsToWin(Number(e.target.value))}
                                    className="bg-white/10 backdrop-blur-md text-white px-3 py-2 rounded font-bold border border-white/10 focus:border-white/30 outline-none text-sm"
                                >
                                    {SETS_OPTIONS.map(n => (
                                        <option key={n} value={n} className="bg-zinc-900">First to {n}</option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>
                </div>

                {/* Starting Order */}
                <div>
                    <label className="text-zinc-400 uppercase tracking-widest text-xs block mb-2">
                        Starting Order
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setStartingOrder('random')} className={optionBtn(startingOrder === 'random')}>
                            Random
                        </button>
                        <button onClick={() => setStartingOrder('bull-off')} className={optionBtn(startingOrder === 'bull-off')}>
                            Bull Off
                        </button>
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex w-full justify-between gap-4">
                <button
                    onClick={onBack}
                    className="px-6 py-3 text-sm text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/10"
                >
                    ← Back
                </button>
                <button
                    onClick={handleNext}
                    className={`px-6 py-3 ${accentClass} ${accentBorderClass} text-white font-bold rounded-lg hover:brightness-110 transition-all text-sm backdrop-blur-md border`}
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
