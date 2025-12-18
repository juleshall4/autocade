import { useState, useEffect } from 'react';

export type TournamentFormat = 'round-robin' | 'single-elimination' | 'double-elimination';
export type ThirdPlaceMatch = 'none' | 'play-off';

export interface TournamentSettings {
    format: TournamentFormat;
    thirdPlace: ThirdPlaceMatch;
}

interface TournamentRulesProps {
    onSettingsChange: (settings: TournamentSettings) => void;
    initialSettings?: TournamentSettings;
}

const FORMATS: { id: TournamentFormat; name: string }[] = [
    { id: 'round-robin', name: 'Round Robin' },
    { id: 'single-elimination', name: 'Single Elim' },
    { id: 'double-elimination', name: 'Double Elim' },
];

export function TournamentRules({
    onSettingsChange,
    initialSettings,
}: TournamentRulesProps) {
    const [format, setFormat] = useState<TournamentFormat>(initialSettings?.format ?? 'round-robin');
    const [thirdPlace, setThirdPlace] = useState<ThirdPlaceMatch>(initialSettings?.thirdPlace ?? 'none');

    // Notify parent of settings changes
    useEffect(() => {
        onSettingsChange({
            format,
            thirdPlace,
        });
    }, [format, thirdPlace, onSettingsChange]);

    // Button style helper - yellow warning styling
    const optionBtn = (active: boolean) =>
        `px-3 py-1.5 rounded-lg font-bold text-sm transition-all backdrop-blur-md border text-white ${active
            ? 'bg-yellow-500/30 border-yellow-500/50'
            : 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20'
        }`;

    return (
        <div className="flex flex-col p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="space-y-6">
                {/* Format Selection */}
                <div>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Format
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {FORMATS.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFormat(f.id)}
                                className={optionBtn(format === f.id)}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Third Place Match - only for elimination formats */}
                {(format === 'single-elimination' || format === 'double-elimination') && (
                    <div>
                        <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                            3rd Place
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setThirdPlace('none')}
                                className={optionBtn(thirdPlace === 'none')}
                            >
                                None
                            </button>
                            <button
                                onClick={() => setThirdPlace('play-off')}
                                className={optionBtn(thirdPlace === 'play-off')}
                            >
                                Play-off
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
