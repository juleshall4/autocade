import { useState, useEffect } from 'react';
import { Palette, Globe, Check, AlertCircle, Volume2, Wifi, Play, Loader2, Plus, Minus } from 'lucide-react';

export interface Theme {
    id: string;
    name: string;
    gradient: string;      // Tailwind gradient classes
    preview: string;       // CSS color for swatch preview
    accent: string;        // Tailwind bg class for selected state
    accentBorder: string;  // Tailwind border class for selected state
    glow: string;          // CSS rgba color for dartboard glow
}

export const THEMES: Theme[] = [
    { id: 'midnight', name: 'Midnight', gradient: 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950', preview: '#71717a', accent: 'bg-zinc-500/80', accentBorder: 'border-zinc-400/50', glow: 'rgba(113, 113, 122, 0.7)' },
    { id: 'ocean', name: 'Ocean', gradient: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900', preview: '#3b82f6', accent: 'bg-blue-500/80', accentBorder: 'border-blue-400/50', glow: 'rgba(59, 130, 246, 0.7)' },
    { id: 'purple', name: 'Purple Haze', gradient: 'bg-gradient-to-br from-zinc-950 via-purple-950 to-zinc-900', preview: '#a855f7', accent: 'bg-purple-500/80', accentBorder: 'border-purple-400/50', glow: 'rgba(168, 85, 247, 0.7)' },
    { id: 'forest', name: 'Forest', gradient: 'bg-gradient-to-br from-zinc-950 via-emerald-950 to-zinc-900', preview: '#10b981', accent: 'bg-emerald-500/80', accentBorder: 'border-emerald-400/50', glow: 'rgba(16, 185, 129, 0.7)' },
    { id: 'crimson', name: 'Crimson', gradient: 'bg-gradient-to-br from-zinc-950 via-rose-950 to-zinc-900', preview: '#f43f5e', accent: 'bg-rose-500/80', accentBorder: 'border-rose-400/50', glow: 'rgba(244, 63, 94, 0.7)' },
    { id: 'amber', name: 'Amber', gradient: 'bg-gradient-to-br from-zinc-950 via-amber-950 to-zinc-900', preview: '#f59e0b', accent: 'bg-amber-500/80', accentBorder: 'border-amber-400/50', glow: 'rgba(245, 158, 11, 0.7)' },
];

export interface AppearanceSettings {
    showConnectionStatus: boolean;
    showBoardStatus: boolean;
    theme: string;
    gameViewScale: number;   // 50-150
}

interface SettingsProps {
    appearance: AppearanceSettings;
    onAppearanceChange: (settings: AppearanceSettings) => void;
}

interface CallerSettings {
    enabled: boolean;
    volume: number;
    sfxVolume: number;
    voice: string;
    announceAllDarts: boolean;
    announceRoundTotal: boolean;
    announceCheckouts: boolean;
    announceBusts: boolean;
    announceGameStart: boolean;
}

interface WledEventPresets {
    // Default lighting to revert to
    default: number | null;
    // General
    gameOn: number | null;
    // X01 events
    x01Checkout: number | null;
    x01Bust: number | null;
    x01OneEighty: number | null;
    // Killer events
    killerActivation: number | null;
    killerLifeTaken: number | null;
    killerElimination: number | null;
    killerWin: number | null;
    // Around The Clock events
    atcTargetHit: number | null;
    atcWin: number | null;
}

interface WledEventDurations {
    gameOn: number;
    x01Checkout: number;
    x01Bust: number;
    x01OneEighty: number;
    killerActivation: number;
    killerLifeTaken: number;
    killerElimination: number;
    killerWin: number;
    atcTargetHit: number;
    atcWin: number;
}

export interface WledSettings {
    enabled: boolean;
    ip: string;
    ip2: string;
    presets: WledEventPresets;
    durations: WledEventDurations;
}

type SettingsTab = 'appearance' | 'audio' | 'connection' | 'wled';

export function SettingsContent({ appearance, onAppearanceChange }: SettingsProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
    const [ipAddress, setIpAddress] = useState('');
    const [ipStatus, setIpStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [ipError, setIpError] = useState('');

    // Audio settings state - load from localStorage
    const loadCallerSettings = () => {
        try {
            const saved = localStorage.getItem('autocade-caller');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load caller settings:', e);
        }
        return {
            enabled: true,
            volume: 80,
            sfxVolume: 70,
            voice: 'Northern_Terry',
            announceAllDarts: false,
            announceRoundTotal: true,
            announceCheckouts: true,
            announceBusts: true,
            announceGameStart: true,
        };
    };

    const [callerSettings, setCallerSettings] = useState<CallerSettings>(loadCallerSettings);

    // Save caller settings when they change
    useEffect(() => {
        try {
            localStorage.setItem('autocade-caller', JSON.stringify(callerSettings));
        } catch (e) {
            console.error('Failed to save caller settings:', e);
        }
    }, [callerSettings]);

    const updateCallerSetting = <K extends keyof CallerSettings>(key: K, value: CallerSettings[K]) => {
        setCallerSettings((prev: CallerSettings) => ({ ...prev, [key]: value }));
    };

    // WLED settings state
    const loadWledSettings = (): WledSettings => {
        const defaultPresets: WledEventPresets = {
            default: null,
            gameOn: null,
            x01Checkout: null,
            x01Bust: null,
            x01OneEighty: null,
            killerActivation: null,
            killerLifeTaken: null,
            killerElimination: null,
            killerWin: null,
            atcTargetHit: null,
            atcWin: null,
        };
        const defaultDurations: WledEventDurations = {
            gameOn: 3,
            x01Checkout: 5,
            x01Bust: 2,
            x01OneEighty: 4,
            killerActivation: 3,
            killerLifeTaken: 2,
            killerElimination: 3,
            killerWin: 5,
            atcTargetHit: 1,
            atcWin: 5,
        };
        const defaults: WledSettings = {
            enabled: false,
            ip: '',
            ip2: '',
            presets: defaultPresets,
            durations: defaultDurations,
        };
        try {
            const saved = localStorage.getItem('autocade-wled');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    enabled: parsed.enabled ?? defaults.enabled,
                    ip: parsed.ip ?? defaults.ip,
                    ip2: parsed.ip2 ?? defaults.ip2,
                    presets: {
                        default: parsed.presets?.default ?? defaultPresets.default,
                        gameOn: parsed.presets?.gameOn ?? defaultPresets.gameOn,
                        x01Checkout: parsed.presets?.x01Checkout ?? defaultPresets.x01Checkout,
                        x01Bust: parsed.presets?.x01Bust ?? defaultPresets.x01Bust,
                        x01OneEighty: parsed.presets?.x01OneEighty ?? defaultPresets.x01OneEighty,
                        killerActivation: parsed.presets?.killerActivation ?? defaultPresets.killerActivation,
                        killerLifeTaken: parsed.presets?.killerLifeTaken ?? defaultPresets.killerLifeTaken,
                        killerElimination: parsed.presets?.killerElimination ?? defaultPresets.killerElimination,
                        killerWin: parsed.presets?.killerWin ?? defaultPresets.killerWin,
                        atcTargetHit: parsed.presets?.atcTargetHit ?? defaultPresets.atcTargetHit,
                        atcWin: parsed.presets?.atcWin ?? defaultPresets.atcWin,
                    },
                    durations: {
                        gameOn: parsed.durations?.gameOn ?? defaultDurations.gameOn,
                        x01Checkout: parsed.durations?.x01Checkout ?? defaultDurations.x01Checkout,
                        x01Bust: parsed.durations?.x01Bust ?? defaultDurations.x01Bust,
                        x01OneEighty: parsed.durations?.x01OneEighty ?? defaultDurations.x01OneEighty,
                        killerActivation: parsed.durations?.killerActivation ?? defaultDurations.killerActivation,
                        killerLifeTaken: parsed.durations?.killerLifeTaken ?? defaultDurations.killerLifeTaken,
                        killerElimination: parsed.durations?.killerElimination ?? defaultDurations.killerElimination,
                        killerWin: parsed.durations?.killerWin ?? defaultDurations.killerWin,
                        atcTargetHit: parsed.durations?.atcTargetHit ?? defaultDurations.atcTargetHit,
                        atcWin: parsed.durations?.atcWin ?? defaultDurations.atcWin,
                    },
                };
            }
        } catch (e) {
            console.error('Failed to load wled settings:', e);
        }
        return defaults;
    };

    const [wledSettings, setWledSettings] = useState<WledSettings>(loadWledSettings);
    const [wledPresetList, setWledPresetList] = useState<{ id: number; name: string }[]>([]);
    const [presetFetchStatus, setPresetFetchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        localStorage.setItem('autocade-wled', JSON.stringify(wledSettings));
    }, [wledSettings]);

    const updateWledSetting = (key: keyof WledSettings, value: any) => {
        setWledSettings(prev => ({ ...prev, [key]: value }));
    };

    const updateWledPreset = (key: keyof WledEventPresets, value: number | null) => {
        setWledSettings(prev => ({
            ...prev,
            presets: { ...prev.presets, [key]: value }
        }));
    };

    const updateWledDuration = (key: keyof WledEventDurations, value: number) => {
        setWledSettings(prev => ({
            ...prev,
            durations: { ...prev.durations, [key]: value }
        }));
    };

    // Fetch presets from WLED device
    const fetchWledPresets = async () => {
        if (!wledSettings.ip) return;
        setPresetFetchStatus('loading');
        try {
            const response = await fetch(`http://${wledSettings.ip}/presets.json`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            // Parse presets - WLED returns object with numeric keys
            const presets: { id: number; name: string }[] = [];
            for (const key in data) {
                const id = parseInt(key);
                if (!isNaN(id) && id > 0 && data[key]?.n) {
                    presets.push({ id, name: data[key].n });
                }
            }
            presets.sort((a, b) => a.id - b.id);
            setWledPresetList(presets);
            setPresetFetchStatus('success');
        } catch (e) {
            console.error('Failed to fetch WLED presets:', e);
            setPresetFetchStatus('error');
        }
    };

    useEffect(() => {
        const savedIp = localStorage.getItem('autodartsIP');
        if (savedIp) {
            setIpAddress(savedIp);
        }
    }, []);

    const handleToggle = (key: keyof AppearanceSettings) => {
        onAppearanceChange({
            ...appearance,
            [key]: !appearance[key]
        });
    };

    const testConnection = async (ip: string): Promise<boolean> => {
        return new Promise((resolve) => {
            try {
                const ws = new WebSocket(`ws://${ip}:3180/api/events`);
                const timeout = setTimeout(() => {
                    ws.close();
                    resolve(false);
                }, 5000);

                ws.onopen = () => {
                    clearTimeout(timeout);
                    ws.close();
                    resolve(true);
                };

                ws.onerror = () => {
                    clearTimeout(timeout);
                    resolve(false);
                };
            } catch {
                resolve(false);
            }
        });
    };

    const handleSaveIp = async () => {
        // Basic validation
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ipAddress)) {
            setIpError('Invalid IP address format');
            setIpStatus('idle');
            return;
        }

        // Save the IP immediately (even if connection fails)
        localStorage.setItem('autodartsIP', ipAddress);
        setIpError('');
        setIpStatus('testing');

        // Run connection test with minimum 1 second animation
        const [connected] = await Promise.all([
            testConnection(ipAddress),
            new Promise(resolve => setTimeout(resolve, 1000))
        ]);

        if (connected) {
            setIpStatus('success');
            // Reset after 3 seconds
            setTimeout(() => setIpStatus('idle'), 3000);
        } else {
            setIpStatus('error');
            setIpError('Connection failed');
        }
    };

    return (
        <div className="w-[360px] max-h-[600px] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('appearance')}
                    className={`flex-1 px-2 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'appearance'
                        ? 'text-white border-b-2 border-blue-400 bg-white/10'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Palette className="w-4 h-4" />
                    <span className="hidden sm:inline">Look</span>
                </button>
                <button
                    onClick={() => setActiveTab('audio')}
                    className={`flex-1 px-2 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'audio'
                        ? 'text-white border-b-2 border-blue-400 bg-white/10'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Volume2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Audio</span>
                </button>
                <button
                    onClick={() => setActiveTab('connection')}
                    className={`flex-1 px-2 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'connection'
                        ? 'text-white border-b-2 border-blue-400 bg-white/10'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">Board</span>
                </button>
                <button
                    onClick={() => setActiveTab('wled')}
                    className={`flex-1 px-2 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'wled'
                        ? 'text-white border-b-2 border-blue-400 bg-white/10'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Wifi className="w-4 h-4" />
                    <span className="hidden sm:inline">WLED</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'appearance' && (
                    <div className="space-y-4">
                        {/* Connection Status Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-white font-medium text-sm">Connection Status</div>
                                <div className="text-zinc-500 text-xs">Show in top left</div>
                            </div>
                            <button
                                onClick={() => handleToggle('showConnectionStatus')}
                                className={`w-10 h-5 rounded-full transition-colors ${appearance.showConnectionStatus ? 'bg-blue-500/80' : 'bg-white/20'
                                    }`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${appearance.showConnectionStatus ? 'translate-x-5' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>

                        {/* Board Status Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-white font-medium text-sm">Board Status</div>
                                <div className="text-zinc-500 text-xs">Show event status</div>
                            </div>
                            <button
                                onClick={() => handleToggle('showBoardStatus')}
                                className={`w-10 h-5 rounded-full transition-colors ${appearance.showBoardStatus ? 'bg-blue-500/80' : 'bg-white/20'
                                    }`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${appearance.showBoardStatus ? 'translate-x-5' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>

                        {/* Theme Selector - Custom Dropdown */}
                        <div className="pt-3 border-t border-white/10">
                            <div className="text-white font-medium text-sm mb-2">Theme</div>
                            <div className="grid grid-cols-3 gap-2">
                                {THEMES.map(theme => (
                                    <button
                                        key={theme.id}
                                        onClick={() => onAppearanceChange({ ...appearance, theme: theme.id })}
                                        className={`flex items-center gap-2 px-2 py-2 rounded-lg border transition-all ${appearance.theme === theme.id
                                            ? 'border-white/40 bg-white/10'
                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                            }`}
                                    >
                                        <div
                                            className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                                            style={{ background: theme.preview }}
                                        />
                                        <span className="text-xs text-zinc-300 truncate">{theme.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Game View Scale */}
                        <div className="pt-3 border-t border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-white font-medium text-sm">Game View Scale</div>
                                <span className="text-zinc-400 text-xs">{(appearance.gameViewScale || 130) - 30}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => onAppearanceChange({ ...appearance, gameViewScale: Math.max(50, (appearance.gameViewScale || 130) - 10) })}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, Math.max(0, ((appearance.gameViewScale || 130) - 50) / 1.5))}%` }}
                                    />
                                </div>
                                <button
                                    onClick={() => onAppearanceChange({ ...appearance, gameViewScale: Math.min(200, (appearance.gameViewScale || 130) + 10) })}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Reset Scale Button */}
                        <button
                            onClick={() => onAppearanceChange({ ...appearance, gameViewScale: 130 })}
                            className="w-full mt-2 px-3 py-2 text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                )}

                {activeTab === 'audio' && (
                    <div className="space-y-5">
                        {/* Master Caller Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-white font-medium text-sm">Caller</div>
                                <div className="text-zinc-500 text-xs">Enable score announcements</div>
                            </div>
                            <button
                                onClick={() => updateCallerSetting('enabled', !callerSettings.enabled)}
                                className={`w-10 h-5 rounded-full transition-colors ${callerSettings.enabled ? 'bg-blue-500/80' : 'bg-white/20'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${callerSettings.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>

                        {/* Only show other options when caller is enabled */}
                        {callerSettings.enabled && (
                            <>
                                {/* Caller Volume */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-white font-medium text-sm">Volume</div>
                                        <span className="text-zinc-400 text-xs">{callerSettings.volume}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={callerSettings.volume}
                                        onChange={(e) => updateCallerSetting('volume', Number(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>

                                {/* Caller Voice Selection */}
                                <div>
                                    <div className="text-white font-medium text-sm mb-2">Voice</div>
                                    <div className="flex gap-2">
                                        <select
                                            value={callerSettings.voice}
                                            onChange={(e) => updateCallerSetting('voice', e.target.value)}
                                            className="flex-1 bg-white/10 text-white px-3 py-2 rounded border border-white/10 focus:border-white/30 outline-none text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="Northern_Terry" className="bg-zinc-900">Northern Terry</option>
                                            <option value="Russ_Bray" className="bg-zinc-900" disabled>Russ Bray (Coming Soon)</option>
                                            <option value="Neutral_Male" className="bg-zinc-900" disabled>Neutral Male (Coming Soon)</option>
                                            <option value="Neutral_Female" className="bg-zinc-900" disabled>Neutral Female (Coming Soon)</option>
                                        </select>
                                        <button
                                            onClick={() => {
                                                const voicePack = (callerSettings.voice === 'default' || !callerSettings.voice) ? 'Northern_Terry' : callerSettings.voice;
                                                const audio = new Audio(`/sounds/${voicePack}/phrases/preview.mp3`);
                                                audio.volume = callerSettings.volume / 100;
                                                audio.play().catch(() => console.warn('Preview not found'));
                                            }}
                                            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded border border-white/10 transition-colors"
                                            title="Preview voice"
                                        >
                                            <Play className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </div>

                                {/* Announcement Options */}
                                <div className="pt-3 border-t border-white/10">
                                    <div className="text-white font-medium text-sm mb-3">Announce</div>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-zinc-300 text-sm">All Darts (per throw)</span>
                                            <input
                                                type="checkbox"
                                                checked={callerSettings.announceAllDarts}
                                                onChange={(e) => updateCallerSetting('announceAllDarts', e.target.checked)}
                                                className="w-4 h-4 rounded bg-white/10 border-white/20 accent-blue-500"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-zinc-300 text-sm">Round Total</span>
                                            <input
                                                type="checkbox"
                                                checked={callerSettings.announceRoundTotal}
                                                onChange={(e) => updateCallerSetting('announceRoundTotal', e.target.checked)}
                                                className="w-4 h-4 rounded bg-white/10 border-white/20 accent-blue-500"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-zinc-300 text-sm">Checkouts (≤170)</span>
                                            <input
                                                type="checkbox"
                                                checked={callerSettings.announceCheckouts}
                                                onChange={(e) => updateCallerSetting('announceCheckouts', e.target.checked)}
                                                className="w-4 h-4 rounded bg-white/10 border-white/20 accent-blue-500"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-zinc-300 text-sm">Busts</span>
                                            <input
                                                type="checkbox"
                                                checked={callerSettings.announceBusts}
                                                onChange={(e) => updateCallerSetting('announceBusts', e.target.checked)}
                                                className="w-4 h-4 rounded bg-white/10 border-white/20 accent-blue-500"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <span className="text-zinc-300 text-sm">Game Start</span>
                                            <input
                                                type="checkbox"
                                                checked={callerSettings.announceGameStart}
                                                onChange={(e) => updateCallerSetting('announceGameStart', e.target.checked)}
                                                className="w-4 h-4 rounded bg-white/10 border-white/20 accent-blue-500"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'connection' && (
                    <div className="space-y-4">
                        {/* IP Address Input */}
                        <div>
                            <div className="text-white font-medium text-sm mb-2">Autodarts IP Address</div>
                            <input
                                type="text"
                                value={ipAddress}
                                onChange={(e) => {
                                    setIpAddress(e.target.value);
                                    setIpError('');
                                    setIpStatus('idle');
                                }}
                                placeholder="192.168.1.100"
                                className="w-full px-3 py-2 bg-white/10 rounded border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono"
                                disabled={ipStatus === 'testing'}
                            />
                        </div>

                        {/* Save Button & Status */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSaveIp}
                                disabled={ipStatus === 'testing'}
                                className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${ipStatus === 'testing'
                                    ? 'bg-blue-500/50 text-white/70 cursor-wait'
                                    : ipStatus === 'success'
                                        ? 'bg-green-500 hover:bg-green-400 text-white'
                                        : 'bg-blue-500 hover:bg-blue-400 text-white'
                                    }`}
                            >
                                {ipStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
                                {ipStatus === 'success' && <Check className="w-4 h-4" />}
                                {ipStatus === 'testing' ? 'Testing...' : ipStatus === 'success' ? 'Connected!' : 'Test & Save'}
                            </button>
                            {ipStatus === 'error' && (
                                <span className="text-red-400 text-xs flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {ipError}
                                </span>
                            )}
                        </div>

                        {ipStatus === 'success' && (
                            <div className="text-xs text-green-400 mt-2">
                                ✓ Successfully connected to Board Manager
                            </div>
                        )}
                        {ipStatus === 'error' && (
                            <div className="text-xs text-zinc-500 mt-2">
                                Make sure Board Manager is running and the IP is correct.
                            </div>
                        )}
                        {ipStatus === 'idle' && (
                            <div className="text-xs text-zinc-500 mt-2">
                                Enter the IP address of the device running Autodarts Board Manager.
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'wled' && (
                    <div className="space-y-5">
                        {/* WLED Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-white font-medium text-sm">WLED Integration</div>
                                <div className="text-zinc-500 text-xs">Sync lights with game events</div>
                            </div>
                            <button
                                onClick={() => updateWledSetting('enabled', !wledSettings.enabled)}
                                className={`w-10 h-5 rounded-full transition-colors ${wledSettings.enabled ? 'bg-blue-500/80' : 'bg-white/20'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${wledSettings.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>

                        {wledSettings.enabled && (
                            <>
                                {/* WLED IP */}
                                <div className="space-y-2">
                                    <div className="text-white font-medium text-sm">WLED IP Address (Channel 1)</div>
                                    <input
                                        type="text"
                                        value={wledSettings.ip}
                                        onChange={(e) => updateWledSetting('ip', e.target.value)}
                                        placeholder="192.168.x.x"
                                        className="w-full bg-white/10 text-white px-3 py-2 rounded text-sm border border-white/10 focus:border-blue-500/50 outline-none"
                                    />
                                </div>

                                {/* WLED IP 2 */}
                                <div className="space-y-2">
                                    <div className="text-white font-medium text-sm">WLED IP Address (Channel 2)</div>
                                    <input
                                        type="text"
                                        value={wledSettings.ip2}
                                        onChange={(e) => updateWledSetting('ip2', e.target.value)}
                                        placeholder="192.168.x.x (optional)"
                                        className="w-full bg-white/10 text-white px-3 py-2 rounded text-sm border border-white/10 focus:border-blue-500/50 outline-none"
                                    />
                                </div>

                                {/* Fetch Presets Button */}
                                <div className="space-y-2 pt-3 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <div className="text-white font-medium text-sm">Presets</div>
                                        <button
                                            onClick={fetchWledPresets}
                                            disabled={presetFetchStatus === 'loading' || !wledSettings.ip}
                                            className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-1"
                                        >
                                            {presetFetchStatus === 'loading' ? (
                                                <>
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    Fetching...
                                                </>
                                            ) : (
                                                <>Fetch Presets</>
                                            )}
                                        </button>
                                    </div>
                                    {presetFetchStatus === 'success' && (
                                        <div className="text-xs text-green-400">✓ Found {wledPresetList.length} presets</div>
                                    )}
                                    {presetFetchStatus === 'error' && (
                                        <div className="text-xs text-red-400">Failed to fetch presets. Check IP address.</div>
                                    )}
                                </div>

                                {/* Default Lighting Preset */}
                                <div className="space-y-2 pt-3 border-t border-white/10">
                                    <div className="text-white font-medium text-sm">Default Lighting</div>
                                    <div className="text-zinc-500 text-xs mb-2">Lights revert to this after events</div>
                                    <select
                                        value={wledSettings.presets.default ?? ''}
                                        onChange={(e) => updateWledPreset('default', e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full bg-white/10 text-white px-3 py-2 rounded text-sm border border-white/10 focus:border-blue-500/50 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-zinc-900">None (stays on event)</option>
                                        {wledPresetList.map(p => (
                                            <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Per-Game Preset Selectors */}
                                <div className="space-y-2 pt-3 border-t border-white/10">
                                    <div className="text-white font-medium text-sm mb-3">Game Event Presets</div>

                                    {/* Game On */}
                                    <div className="bg-white/5 rounded-lg border border-white/10 p-3 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-zinc-200 font-medium text-sm">Game On</span>
                                            <select
                                                value={wledSettings.presets.gameOn ?? ''}
                                                onChange={(e) => updateWledPreset('gameOn', e.target.value ? parseInt(e.target.value) : null)}
                                                className="flex-1 max-w-[120px] bg-white/10 text-white px-2 py-1 rounded text-xs border border-white/10 outline-none"
                                            >
                                                <option value="" className="bg-zinc-900">None</option>
                                                {wledPresetList.map(p => (
                                                    <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={wledSettings.durations.gameOn}
                                                onChange={(e) => updateWledDuration('gameOn', parseInt(e.target.value))}
                                                className="flex-1 accent-blue-500"
                                            />
                                            <span className="text-zinc-400 text-xs w-6">{wledSettings.durations.gameOn}s</span>
                                        </div>
                                    </div>

                                    {/* X01 Accordion */}
                                    <details className="group bg-white/5 rounded-lg border border-white/10">
                                        <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5">
                                            <span className="text-zinc-200 font-medium text-sm">X01</span>
                                            <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">▼</span>
                                        </summary>
                                        <div className="p-3 pt-0 space-y-4 border-t border-white/10">
                                            {/* Checkout */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-zinc-300 text-sm">Checkout</span>
                                                    <select
                                                        value={wledSettings.presets.x01Checkout ?? ''}
                                                        onChange={(e) => updateWledPreset('x01Checkout', e.target.value ? parseInt(e.target.value) : null)}
                                                        className="flex-1 max-w-[120px] bg-white/10 text-white px-2 py-1 rounded text-xs border border-white/10 outline-none"
                                                    >
                                                        <option value="" className="bg-zinc-900">None</option>
                                                        {wledPresetList.map(p => (
                                                            <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={wledSettings.durations.x01Checkout}
                                                        onChange={(e) => updateWledDuration('x01Checkout', parseInt(e.target.value))}
                                                        className="flex-1 accent-blue-500"
                                                    />
                                                    <span className="text-zinc-400 text-xs w-6">{wledSettings.durations.x01Checkout}s</span>
                                                </div>
                                            </div>
                                            {/* Bust */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-zinc-300 text-sm">Bust</span>
                                                    <select
                                                        value={wledSettings.presets.x01Bust ?? ''}
                                                        onChange={(e) => updateWledPreset('x01Bust', e.target.value ? parseInt(e.target.value) : null)}
                                                        className="flex-1 max-w-[120px] bg-white/10 text-white px-2 py-1 rounded text-xs border border-white/10 outline-none"
                                                    >
                                                        <option value="" className="bg-zinc-900">None</option>
                                                        {wledPresetList.map(p => (
                                                            <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={wledSettings.durations.x01Bust}
                                                        onChange={(e) => updateWledDuration('x01Bust', parseInt(e.target.value))}
                                                        className="flex-1 accent-blue-500"
                                                    />
                                                    <span className="text-zinc-400 text-xs w-6">{wledSettings.durations.x01Bust}s</span>
                                                </div>
                                            </div>
                                            {/* 180 */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-zinc-300 text-sm">180</span>
                                                    <select
                                                        value={wledSettings.presets.x01OneEighty ?? ''}
                                                        onChange={(e) => updateWledPreset('x01OneEighty', e.target.value ? parseInt(e.target.value) : null)}
                                                        className="flex-1 max-w-[120px] bg-white/10 text-white px-2 py-1 rounded text-xs border border-white/10 outline-none"
                                                    >
                                                        <option value="" className="bg-zinc-900">None</option>
                                                        {wledPresetList.map(p => (
                                                            <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={wledSettings.durations.x01OneEighty}
                                                        onChange={(e) => updateWledDuration('x01OneEighty', parseInt(e.target.value))}
                                                        className="flex-1 accent-blue-500"
                                                    />
                                                    <span className="text-zinc-400 text-xs w-6">{wledSettings.durations.x01OneEighty}s</span>
                                                </div>
                                            </div>
                                        </div>
                                    </details>

                                    {/* Around The Clock Accordion */}
                                    <details className="group bg-white/5 rounded-lg border border-white/10">
                                        <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5">
                                            <span className="text-zinc-200 font-medium text-sm">Around The Clock</span>
                                            <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">▼</span>
                                        </summary>
                                        <div className="p-3 pt-0 space-y-4 border-t border-white/10">
                                            {/* Target Hit */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-zinc-300 text-sm">Target Hit</span>
                                                    <select
                                                        value={wledSettings.presets.atcTargetHit ?? ''}
                                                        onChange={(e) => updateWledPreset('atcTargetHit', e.target.value ? parseInt(e.target.value) : null)}
                                                        className="flex-1 max-w-[120px] bg-white/10 text-white px-2 py-1 rounded text-xs border border-white/10 outline-none"
                                                    >
                                                        <option value="" className="bg-zinc-900">None</option>
                                                        {wledPresetList.map(p => (
                                                            <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={wledSettings.durations.atcTargetHit}
                                                        onChange={(e) => updateWledDuration('atcTargetHit', parseInt(e.target.value))}
                                                        className="flex-1 accent-blue-500"
                                                    />
                                                    <span className="text-zinc-400 text-xs w-6">{wledSettings.durations.atcTargetHit}s</span>
                                                </div>
                                            </div>
                                            {/* Victory */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-zinc-300 text-sm">Victory</span>
                                                    <select
                                                        value={wledSettings.presets.atcWin ?? ''}
                                                        onChange={(e) => updateWledPreset('atcWin', e.target.value ? parseInt(e.target.value) : null)}
                                                        className="flex-1 max-w-[120px] bg-white/10 text-white px-2 py-1 rounded text-xs border border-white/10 outline-none"
                                                    >
                                                        <option value="" className="bg-zinc-900">None</option>
                                                        {wledPresetList.map(p => (
                                                            <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={wledSettings.durations.atcWin}
                                                        onChange={(e) => updateWledDuration('atcWin', parseInt(e.target.value))}
                                                        className="flex-1 accent-blue-500"
                                                    />
                                                    <span className="text-zinc-400 text-xs w-6">{wledSettings.durations.atcWin}s</span>
                                                </div>
                                            </div>
                                        </div>
                                    </details>

                                    {/* Killer Accordion */}
                                    <details className="group bg-white/5 rounded-lg border border-white/10">
                                        <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5">
                                            <span className="text-zinc-200 font-medium text-sm">Killer</span>
                                            <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">▼</span>
                                        </summary>
                                        <div className="p-3 pt-0 space-y-4 border-t border-white/10">
                                            {/* Became Killer */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-zinc-300 text-sm">Became Killer</span>
                                                    <select
                                                        value={wledSettings.presets.killerActivation ?? ''}
                                                        onChange={(e) => updateWledPreset('killerActivation', e.target.value ? parseInt(e.target.value) : null)}
                                                        className="flex-1 max-w-[120px] bg-white/10 text-white px-2 py-1 rounded text-xs border border-white/10 outline-none"
                                                    >
                                                        <option value="" className="bg-zinc-900">None</option>
                                                        {wledPresetList.map(p => (
                                                            <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={wledSettings.durations.killerActivation}
                                                        onChange={(e) => updateWledDuration('killerActivation', parseInt(e.target.value))}
                                                        className="flex-1 accent-blue-500"
                                                    />
                                                    <span className="text-zinc-400 text-xs w-6">{wledSettings.durations.killerActivation}s</span>
                                                </div>
                                            </div>
                                            {/* Life Taken */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-zinc-300 text-sm">Life Taken</span>
                                                    <select
                                                        value={wledSettings.presets.killerLifeTaken ?? ''}
                                                        onChange={(e) => updateWledPreset('killerLifeTaken', e.target.value ? parseInt(e.target.value) : null)}
                                                        className="flex-1 max-w-[120px] bg-white/10 text-white px-2 py-1 rounded text-xs border border-white/10 outline-none"
                                                    >
                                                        <option value="" className="bg-zinc-900">None</option>
                                                        {wledPresetList.map(p => (
                                                            <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={wledSettings.durations.killerLifeTaken}
                                                        onChange={(e) => updateWledDuration('killerLifeTaken', parseInt(e.target.value))}
                                                        className="flex-1 accent-blue-500"
                                                    />
                                                    <span className="text-zinc-400 text-xs w-6">{wledSettings.durations.killerLifeTaken}s</span>
                                                </div>
                                            </div>
                                            {/* Elimination */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-zinc-300 text-sm">Elimination</span>
                                                    <select
                                                        value={wledSettings.presets.killerElimination ?? ''}
                                                        onChange={(e) => updateWledPreset('killerElimination', e.target.value ? parseInt(e.target.value) : null)}
                                                        className="flex-1 max-w-[120px] bg-white/10 text-white px-2 py-1 rounded text-xs border border-white/10 outline-none"
                                                    >
                                                        <option value="" className="bg-zinc-900">None</option>
                                                        {wledPresetList.map(p => (
                                                            <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={wledSettings.durations.killerElimination}
                                                        onChange={(e) => updateWledDuration('killerElimination', parseInt(e.target.value))}
                                                        className="flex-1 accent-blue-500"
                                                    />
                                                    <span className="text-zinc-400 text-xs w-6">{wledSettings.durations.killerElimination}s</span>
                                                </div>
                                            </div>
                                            {/* Victory */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-zinc-300 text-sm">Victory</span>
                                                    <select
                                                        value={wledSettings.presets.killerWin ?? ''}
                                                        onChange={(e) => updateWledPreset('killerWin', e.target.value ? parseInt(e.target.value) : null)}
                                                        className="flex-1 max-w-[120px] bg-white/10 text-white px-2 py-1 rounded text-xs border border-white/10 outline-none"
                                                    >
                                                        <option value="" className="bg-zinc-900">None</option>
                                                        {wledPresetList.map(p => (
                                                            <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={wledSettings.durations.killerWin}
                                                        onChange={(e) => updateWledDuration('killerWin', parseInt(e.target.value))}
                                                        className="flex-1 accent-blue-500"
                                                    />
                                                    <span className="text-zinc-400 text-xs w-6">{wledSettings.durations.killerWin}s</span>
                                                </div>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
}
