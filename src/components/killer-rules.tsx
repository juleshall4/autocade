import { useState, useEffect } from 'react';

export type ZoneType = 'full' | 'outer-single' | 'single' | 'double' | 'triple';
export type StartingOrder = 'listed' | 'random';

export interface KillerSettings {
    startingLives: number;
    activationZone: ZoneType;
    killZone: ZoneType;
    multiplier: boolean;
    suicide: boolean;
    startingOrder: StartingOrder;
}

interface KillerRulesProps {
    onSettingsChange: (settings: KillerSettings) => void;
    initialSettings?: KillerSettings;
    accentClass?: string;
    accentBorderClass?: string;
}

const LIVES_OPTIONS = [3, 5, 7];
const ZONE_OPTIONS: { id: ZoneType; name: string }[] = [
    { id: 'full', name: 'Full' },
    { id: 'outer-single', name: 'Outer Single' },
    { id: 'single', name: 'Single' },
    { id: 'double', name: 'Double' },
    { id: 'triple', name: 'Triple' },
];

export function KillerRules({ onSettingsChange, initialSettings, accentClass = 'bg-blue-500/80', accentBorderClass = 'border-blue-400/50' }: KillerRulesProps) {
    const [startingLives, setStartingLives] = useState(initialSettings?.startingLives ?? 3);
    const [customLives, setCustomLives] = useState<number | null>(null);
    const [activationZone, setActivationZone] = useState<ZoneType>(initialSettings?.activationZone ?? 'full');
    const [killZone, setKillZone] = useState<ZoneType>(initialSettings?.killZone ?? 'full');
    const [multiplier, setMultiplier] = useState(initialSettings?.multiplier ?? false);
    const [suicide, setSuicide] = useState(initialSettings?.suicide ?? false);

    const effectiveLives = customLives !== null ? customLives : startingLives;

    // Notify parent of settings changes
    useEffect(() => {
        onSettingsChange({
            startingLives: effectiveLives,
            activationZone,
            killZone,
            multiplier,
            suicide,
            startingOrder: 'listed',
        });
    }, [effectiveLives, activationZone, killZone, multiplier, suicide, onSettingsChange]);

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
                <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ opacity: 0, animation: 'fadeIn 0.5s ease-out forwards' }}>
                    🗡️ Killer
                </h1>

                {/* Starting Lives */}
                <div style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out 0.1s forwards' }}>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Player Hearts
                    </label>
                    <div className="flex flex-wrap gap-2 items-center">
                        {LIVES_OPTIONS.map(lives => (
                            <button
                                key={lives}
                                onClick={() => {
                                    setStartingLives(lives);
                                    setCustomLives(null);
                                }}
                                className={optionBtn(startingLives === lives && customLives === null)}
                            >
                                {lives}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Activation Zone */}
                <div style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out 0.15s forwards' }}>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Health Zone
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {ZONE_OPTIONS.map(zone => (
                            <button
                                key={zone.id}
                                onClick={() => setActivationZone(zone.id)}
                                className={optionBtn(activationZone === zone.id)}
                            >
                                {zone.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Kill Zone */}
                <div style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out 0.2s forwards' }}>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Kill Zone
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {ZONE_OPTIONS.map(zone => (
                            <button
                                key={zone.id}
                                onClick={() => setKillZone(zone.id)}
                                className={optionBtn(killZone === zone.id)}
                            >
                                {zone.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Multiplier */}
                <div style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out 0.25s forwards' }}>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Multiplier
                    </label>
                    <div className="flex gap-2">
                        <button onClick={() => setMultiplier(false)} className={toggleBtn(!multiplier)}>
                            Off
                        </button>
                        <button onClick={() => setMultiplier(true)} className={toggleBtn(multiplier)}>
                            On
                        </button>
                    </div>
                </div>

                {/* Suicide */}
                <div style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out 0.3s forwards' }}>
                    <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                        Suicide
                    </label>
                    <div className="flex gap-2">
                        <button onClick={() => setSuicide(false)} className={toggleBtn(!suicide)}>
                            Off
                        </button>
                        <button onClick={() => setSuicide(true)} className={toggleBtn(suicide)}>
                            On
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
