import { useState, useEffect } from 'react';
import { Palette, Globe, Check, AlertCircle, Volume2 } from 'lucide-react';

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
    { id: 'midnight', name: 'Midnight', gradient: 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950', preview: '#09090b', accent: 'bg-zinc-500/80', accentBorder: 'border-zinc-400/50', glow: 'rgba(113, 113, 122, 0.7)' },
    { id: 'ocean', name: 'Ocean', gradient: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900', preview: '#0c1929', accent: 'bg-blue-500/80', accentBorder: 'border-blue-400/50', glow: 'rgba(59, 130, 246, 0.7)' },
    { id: 'purple', name: 'Purple Haze', gradient: 'bg-gradient-to-br from-zinc-950 via-purple-950 to-zinc-900', preview: '#1a0a2e', accent: 'bg-purple-500/80', accentBorder: 'border-purple-400/50', glow: 'rgba(168, 85, 247, 0.7)' },
    { id: 'forest', name: 'Forest', gradient: 'bg-gradient-to-br from-zinc-950 via-emerald-950 to-zinc-900', preview: '#022c22', accent: 'bg-emerald-500/80', accentBorder: 'border-emerald-400/50', glow: 'rgba(16, 185, 129, 0.7)' },
    { id: 'crimson', name: 'Crimson', gradient: 'bg-gradient-to-br from-zinc-950 via-rose-950 to-zinc-900', preview: '#2a0a14', accent: 'bg-rose-500/80', accentBorder: 'border-rose-400/50', glow: 'rgba(244, 63, 94, 0.7)' },
    { id: 'amber', name: 'Amber', gradient: 'bg-gradient-to-br from-zinc-950 via-amber-950 to-zinc-900', preview: '#1c1204', accent: 'bg-amber-500/80', accentBorder: 'border-amber-400/50', glow: 'rgba(245, 158, 11, 0.7)' },
];

export interface AppearanceSettings {
    showConnectionStatus: boolean;
    showBoardStatus: boolean;
    showDevTools: boolean;
    theme: string;
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
    announceCheckouts: boolean;
    announceBusts: boolean;
    announceGameStart: boolean;
}

type SettingsTab = 'appearance' | 'audio' | 'connection' | 'wled';

export function SettingsContent({ appearance, onAppearanceChange }: SettingsProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
    const [ipAddress, setIpAddress] = useState('');
    const [ipSaved, setIpSaved] = useState(false);
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
            voice: 'default',
            announceAllDarts: false,
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

    const handleSaveIp = () => {
        // Basic validation
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ipAddress)) {
            setIpError('Invalid IP address format');
            setIpSaved(false);
            return;
        }

        localStorage.setItem('autodartsIP', ipAddress);
        setIpSaved(true);
        setIpError('');

        // Reset saved indicator after 2 seconds
        setTimeout(() => setIpSaved(false), 2000);

        // Optional: Trigger a reload or notify user to reload for changes to take effect
        // For now, we just save it. The useAutodarts hook would need to be updated to react to this 
        // or we rely on the next app load/reconnect cycle if we were fancy.
        // But since this is a "setting", simple persistence is the first step.
    };

    return (
        <div className="w-[480px] max-h-[600px] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('appearance')}
                    className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'appearance'
                        ? 'text-white border-b-2 border-blue-400 bg-white/10'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Palette className="w-4 h-4" />
                    Appearance
                </button>
                <button
                    onClick={() => setActiveTab('audio')}
                    className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'audio'
                        ? 'text-white border-b-2 border-blue-400 bg-white/10'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Volume2 className="w-4 h-4" />
                    Audio
                </button>
                <button
                    onClick={() => setActiveTab('connection')}
                    className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'connection'
                        ? 'text-white border-b-2 border-blue-400 bg-white/10'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Globe className="w-4 h-4" />
                    Connection
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

                        {/* Dev Tools Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-white font-medium text-sm">Dev Tools</div>
                                <div className="text-zinc-500 text-xs">Show Dev, Sim, Reset buttons</div>
                            </div>
                            <button
                                onClick={() => handleToggle('showDevTools')}
                                className={`w-10 h-5 rounded-full transition-colors ${appearance.showDevTools ? 'bg-blue-500/80' : 'bg-white/20'
                                    }`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${appearance.showDevTools ? 'translate-x-5' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>

                        {/* Theme Selector */}
                        <div className="pt-3 border-t border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="text-white font-medium text-sm">Theme</div>
                                <div className="relative">
                                    <select
                                        value={appearance.theme}
                                        onChange={(e) => onAppearanceChange({ ...appearance, theme: e.target.value })}
                                        className="bg-white/10 text-white pl-8 pr-3 py-1.5 rounded border border-white/10 focus:border-white/30 outline-none text-xs appearance-none cursor-pointer"
                                    >
                                        {THEMES.map(theme => (
                                            <option key={theme.id} value={theme.id} className="bg-zinc-900">{theme.name}</option>
                                        ))}
                                    </select>
                                    <div
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/30 pointer-events-none"
                                        style={{ background: THEMES.find(t => t.id === appearance.theme)?.preview || '#09090b' }}
                                    />
                                </div>
                            </div>
                        </div>
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

                        {/* Caller Volume */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-white font-medium text-sm">Caller Volume</div>
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

                        {/* SFX Volume */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-white font-medium text-sm">Sound Effects Volume</div>
                                <span className="text-zinc-400 text-xs">{callerSettings.sfxVolume}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={callerSettings.sfxVolume}
                                onChange={(e) => updateCallerSetting('sfxVolume', Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Caller Voice Selection */}
                        <div>
                            <div className="text-white font-medium text-sm mb-2">Caller Voice</div>
                            <select
                                value={callerSettings.voice}
                                onChange={(e) => updateCallerSetting('voice', e.target.value)}
                                className="w-full bg-white/10 text-white px-3 py-2 rounded border border-white/10 focus:border-white/30 outline-none text-sm appearance-none cursor-pointer"
                            >
                                <option value="default" className="bg-zinc-900">Joey (Default)</option>
                            </select>
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
                                onChange={(e) => setIpAddress(e.target.value)}
                                placeholder="192.168.1.100"
                                className="w-full px-3 py-2 bg-white/10 rounded border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono"
                            />
                        </div>

                        {/* Save Button & Status */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSaveIp}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded text-sm font-medium transition-colors"
                            >
                                Save
                            </button>
                            {ipSaved && (
                                <span className="text-green-400 text-xs flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Saved!
                                </span>
                            )}
                            {ipError && (
                                <span className="text-red-400 text-xs flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {ipError}
                                </span>
                            )}
                        </div>

                        <div className="text-xs text-zinc-500 mt-2">
                            Note: Refresh the page for connection changes to take effect.
                        </div>
                    </div>
                )}
                {activeTab === 'wled' && (
                    <div className="text-zinc-500 text-center py-6 text-sm">
                        WLED integration coming soon...
                    </div>
                )}
            </div>
        </div >
    );
}
