import { useState, useEffect } from 'react';

export type X01Mode = 'single' | 'double';
export type MatchMode = 'off' | 'legs' | 'sets';
export type StartingOrder = 'listed' | 'random' | 'bull-off';
export type TournamentFormat = 'round-robin' | 'single-bracket' | 'double-bracket';
export type GameMode = 'quick-play' | 'tournament';

export interface X01Settings {
    baseScore: number;
    inMode: X01Mode;
    outMode: X01Mode;
    matchMode: MatchMode;
    legsToWin: number;
    setsToWin: number;
    startingOrder: StartingOrder;
    tournamentFormat?: TournamentFormat;
    gamesPerMatch?: number;
}

interface X01RulesProps {
    onSettingsChange: (settings: X01Settings) => void;
    initialSettings?: X01Settings;
    gameMode?: GameMode;
    accentClass?: string;
    accentBorderClass?: string;
}

const BASE_SCORES = [121, 170, 301, 501, 701, 901];
const LEGS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const SETS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export function X01Rules({ onSettingsChange, initialSettings, accentClass = 'bg-blue-500/80', accentBorderClass = 'border-blue-400/50' }: X01RulesProps) {
    const [baseScore, setBaseScore] = useState(initialSettings?.baseScore ?? 501);
    const [inMode, setInMode] = useState<X01Mode>(initialSettings?.inMode ?? 'single');
    const [outMode, setOutMode] = useState<X01Mode>(initialSettings?.outMode ?? 'double');
    const [matchMode, setMatchMode] = useState<MatchMode>(initialSettings?.matchMode ?? 'off');
    const [legsToWin, setLegsToWin] = useState(initialSettings?.legsToWin ?? 3);
    const [setsToWin, setSetsToWin] = useState(initialSettings?.setsToWin ?? 3);

    // Notify parent of settings changes
    useEffect(() => {
        onSettingsChange({ baseScore, inMode, outMode, matchMode, legsToWin, setsToWin, startingOrder: 'listed' });
    }, [baseScore, inMode, outMode, matchMode, legsToWin, setsToWin, onSettingsChange]);

    // Glassy button style with theme-aware accent
    const optionBtn = (active: boolean) =>
        `btn-scale-lg px-3 py-2 rounded-lg font-bold text-sm transition-all backdrop-blur-md border ${active
            ? `${accentClass} ${accentBorderClass} text-white`
            : 'bg-white/10 border-white/10 text-zinc-300 hover:bg-white/20'
        }`;

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-xl">
            {/* Rules List */}
            <div className="w-full max-w-sm space-y-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ opacity: 0, animation: 'fadeIn 0.5s ease-out forwards' }}>
                    🎯 X01
                </h1>

                {/* Starting Score */}
                <div style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out 0.1s forwards' }}>
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
                <div style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out 0.15s forwards' }}>
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
                <div style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out 0.2s forwards' }}>
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
                <div style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out 0.25s forwards' }}>
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
                                className="bg-white/10 backdrop-blur-md text-white px-2 py-1.5 rounded-lg font-bold border border-white/10 focus:border-white/30 outline-none text-sm appearance-none cursor-pointer hover:bg-white/20 transition-colors"
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
                                    className="bg-white/10 backdrop-blur-md text-white px-2 py-1.5 rounded-lg font-bold border border-white/10 focus:border-white/30 outline-none text-sm appearance-none cursor-pointer hover:bg-white/20 transition-colors"
                                >
                                    {LEGS_OPTIONS.map(n => (
                                        <option key={n} value={n} className="bg-zinc-900">{n} legs/set</option>
                                    ))}
                                </select>
                                <select
                                    value={setsToWin}
                                    onChange={e => setSetsToWin(Number(e.target.value))}
                                    className="bg-white/10 backdrop-blur-md text-white px-2 py-1.5 rounded-lg font-bold border border-white/10 focus:border-white/30 outline-none text-sm appearance-none cursor-pointer hover:bg-white/20 transition-colors"
                                >
                                    {SETS_OPTIONS.map(n => (
                                        <option key={n} value={n} className="bg-zinc-900">First to {n}</option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
