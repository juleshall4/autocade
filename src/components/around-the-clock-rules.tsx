import { useState } from 'react';

export type ATCMode = 'full' | 'outer-single' | 'single' | 'double' | 'triple';
export type ATCOrder = '1-20-bull' | '20-1-bull' | 'random-bull';

export interface AroundTheClockSettings {
    mode: ATCMode;
    order: ATCOrder;
    multiplier: boolean;
    hitsRequired: number;
    bullFinish: boolean;
}

interface AroundTheClockRulesProps {
    onNext: (settings: AroundTheClockSettings) => void;
    onBack: () => void;
    accentClass?: string;
    accentBorderClass?: string;
}

export function AroundTheClockRules({ onNext, onBack, accentClass = 'bg-blue-500/80', accentBorderClass = 'border-blue-400/50' }: AroundTheClockRulesProps) {
    const [mode, setMode] = useState<ATCMode>('full');
    const [order, setOrder] = useState<ATCOrder>('1-20-bull');
    const [multiplier, setMultiplier] = useState(false);
    const [hitsRequired, setHitsRequired] = useState(1);
    const [bullFinish, setBullFinish] = useState(true);

    const handleNext = () => {
        onNext({ mode, order, multiplier, hitsRequired, bullFinish });
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
            <div className="w-full max-w-lg space-y-6 mb-8">
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

                {/* Bull Finish */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Bull Finish
                    </label>
                    <div className="flex gap-2">
                        <button onClick={() => setBullFinish(true)} className={optionBtn(bullFinish)}>
                            On
                        </button>
                        <button onClick={() => setBullFinish(false)} className={optionBtn(!bullFinish)}>
                            Off
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
