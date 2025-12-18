import { useState, useEffect } from 'react';

export interface DartRouletteSettings {
    backfireSips: number;
    singleSips: number;
    doubleSips: number;
    tripleAction: 'down-it' | 'sips';
    tripleSips: number;
    jailbreakAction: 'finish' | 'sips';
}

interface DartRouletteRulesProps {
    onSettingsChange: (settings: DartRouletteSettings) => void;
    initialSettings?: DartRouletteSettings;
    accentClass?: string;
    accentBorderClass?: string;
}

const SIP_OPTIONS = [1, 2, 3, 5];

export function DartRouletteRules({
    onSettingsChange,
    initialSettings,
    accentClass = 'bg-amber-500/80',
    accentBorderClass = 'border-amber-400/50'
}: DartRouletteRulesProps) {
    const [singleSips, setSingleSips] = useState(initialSettings?.singleSips ?? 1);
    const [doubleSips, setDoubleSips] = useState(initialSettings?.doubleSips ?? 2);
    const [tripleAction, setTripleAction] = useState<'down-it' | 'sips'>(initialSettings?.tripleAction ?? 'down-it');
    const [backfireSips, setBackfireSips] = useState(initialSettings?.backfireSips ?? 1);

    // Notify parent of settings changes
    useEffect(() => {
        onSettingsChange({
            backfireSips,
            singleSips,
            doubleSips,
            tripleAction,
            tripleSips: 5, // Placeholder
            jailbreakAction: 'finish', // Placeholder
        });
    }, [backfireSips, singleSips, doubleSips, tripleAction, onSettingsChange]);

    // Glassy button style with theme-aware accent
    const optionBtn = (active: boolean) =>
        `btn-scale-lg px-3 py-2 rounded-lg font-bold text-sm transition-all backdrop-blur-md border ${active
            ? `${accentClass} ${accentBorderClass} text-white`
            : 'bg-white/10 border-white/10 text-zinc-300 hover:bg-white/20'
        }`;

    const toggleBtn = (active: boolean) =>
        `btn-scale-lg px-4 py-2 rounded-lg font-bold text-sm transition-all backdrop-blur-md border ${active
            ? `${accentClass} ${accentBorderClass} text-white`
            : 'bg-white/10 border-white/10 text-zinc-300 hover:bg-white/20'
        }`;

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-xl">
            {/* Rules List */}
            <div className="w-full max-w-md space-y-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    🎯🍺 Dart Roulette
                </h1>

                {/* Single Hit Sips */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Single Hit Sips
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {SIP_OPTIONS.map(sips => (
                            <button
                                key={sips}
                                onClick={() => setSingleSips(sips)}
                                className={optionBtn(singleSips === sips)}
                            >
                                {sips}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Double Hit Sips */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Double Hit Sips
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {SIP_OPTIONS.map(sips => (
                            <button
                                key={sips}
                                onClick={() => setDoubleSips(sips)}
                                className={optionBtn(doubleSips === sips)}
                            >
                                {sips}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Triple Hit Action */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Triple Hit
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTripleAction('down-it')}
                            className={toggleBtn(tripleAction === 'down-it')}
                        >
                            Down It! 🍺
                        </button>
                        <button
                            onClick={() => setTripleAction('sips')}
                            className={toggleBtn(tripleAction === 'sips')}
                        >
                            5 Sips
                        </button>
                    </div>
                </div>

                {/* Backfire Sips */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Backfire (Miss) Sips
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {SIP_OPTIONS.map(sips => (
                            <button
                                key={sips}
                                onClick={() => setBackfireSips(sips)}
                                className={optionBtn(backfireSips === sips)}
                            >
                                {sips}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Jailbreak Info (placeholder) */}
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="text-sm text-purple-300">
                        🎉 <strong>Bullseye = Jailbreak!</strong><br />
                        Everyone finishes their drink
                    </div>
                </div>
            </div>
        </div>
    );
}
