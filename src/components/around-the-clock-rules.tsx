import { useState, useEffect } from 'react';

export type ATCMode = 'full' | 'outer-single' | 'single' | 'double' | 'triple';
export type ATCOrder = '1-20-bull' | '20-1-bull' | 'random-bull';
export type ATCBullMode = 'both' | 'inner';
export type ATCStartingOrder = 'listed' | 'random';

export interface AroundTheClockSettings {
    mode: ATCMode;
    order: ATCOrder;
    multiplier: boolean;
    hitsRequired: number;
    bullMode: ATCBullMode;
    startingOrder: ATCStartingOrder;
}

interface AroundTheClockRulesProps {
    onSettingsChange: (settings: AroundTheClockSettings) => void;
    accentClass?: string;
    accentBorderClass?: string;
}

export function AroundTheClockRules({ onSettingsChange, accentClass = 'bg-blue-500/80', accentBorderClass = 'border-blue-400/50' }: AroundTheClockRulesProps) {
    const [mode, setMode] = useState<ATCMode>('full');
    const [order, setOrder] = useState<ATCOrder>('1-20-bull');
    const [multiplier, setMultiplier] = useState(false);
    const [hitsRequired, setHitsRequired] = useState(1);
    const [bullMode, setBullMode] = useState<ATCBullMode>('both');
    const [startingOrder, setStartingOrder] = useState<ATCStartingOrder>('listed');

    // Notify parent of settings changes
    useEffect(() => {
        onSettingsChange({ mode, order, multiplier, hitsRequired, bullMode, startingOrder });
    }, [mode, order, multiplier, hitsRequired, bullMode, startingOrder, onSettingsChange]);

    // Glassy button style with theme-aware accent
    const optionBtn = (active: boolean) =>
        `btn-scale-lg px-3 py-2 rounded-lg font-bold text-sm transition-all backdrop-blur-md border ${active
            ? `${accentClass} ${accentBorderClass} text-white`
            : 'bg-white/10 border-white/10 text-zinc-300 hover:bg-white/20'
        }`;

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-xl">
            {/* Rules List */}
            <div className="w-full max-w-lg space-y-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    ⏱️ Around the Clock
                </h1>

                {/* Mode */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Mode
                    </label>
                    <div className="flex gap-2">
                        <button onClick={() => setMode('full')} className={optionBtn(mode === 'full')}>
                            Full
                        </button>
                        <button onClick={() => setMode('outer-single')} className={optionBtn(mode === 'outer-single')}>
                            Outer Single
                        </button>
                        <button onClick={() => setMode('single')} className={optionBtn(mode === 'single')}>
                            Single
                        </button>
                        <button onClick={() => setMode('double')} className={optionBtn(mode === 'double')}>
                            Double
                        </button>
                        <button onClick={() => setMode('triple')} className={optionBtn(mode === 'triple')}>
                            Triple
                        </button>
                    </div>
                </div>

                {/* Order */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Order
                    </label>
                    <div className="flex gap-2">
                        <button onClick={() => setOrder('1-20-bull')} className={optionBtn(order === '1-20-bull')}>
                            1 → 20 → Bull
                        </button>
                        <button onClick={() => setOrder('20-1-bull')} className={optionBtn(order === '20-1-bull')}>
                            20 → 1 → Bull
                        </button>
                        <button onClick={() => setOrder('random-bull')} className={optionBtn(order === 'random-bull')}>
                            Random → Bull
                        </button>
                    </div>
                </div>

                {/* Multiplier */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Multiplier
                    </label>
                    <div className="flex gap-2">
                        <button onClick={() => setMultiplier(false)} className={optionBtn(!multiplier)}>
                            Off
                        </button>
                        <button onClick={() => setMultiplier(true)} className={optionBtn(multiplier)}>
                            On
                        </button>
                    </div>
                </div>

                {/* Hits Required */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Hits Required
                    </label>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(n => (
                            <button
                                key={n}
                                onClick={() => setHitsRequired(n)}
                                className={optionBtn(hitsRequired === n)}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Finish Settings */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Finish Settings
                    </label>
                    <div className="flex gap-2">
                        <button onClick={() => setBullMode('both')} className={optionBtn(bullMode === 'both')}>
                            Outer & Inner
                        </button>
                        <button onClick={() => setBullMode('inner')} className={optionBtn(bullMode === 'inner')}>
                            Inner Only
                        </button>
                    </div>
                </div>

                {/* Starting Order */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Starting Order
                    </label>
                    <div className="flex gap-2">
                        <button onClick={() => setStartingOrder('listed')} className={optionBtn(startingOrder === 'listed')}>
                            Listed
                        </button>
                        <button onClick={() => setStartingOrder('random')} className={optionBtn(startingOrder === 'random')}>
                            Random
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
