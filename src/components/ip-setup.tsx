import { useState } from 'react';
import { Wifi, WifiOff, Loader2, CheckCircle2, RefreshCw, X, Monitor, Apple } from 'lucide-react';

interface IpSetupProps {
    onComplete: (ipAddress: string) => void;
}

type ConnectionStatus = 'idle' | 'connecting' | 'success' | 'error';
type HelpModal = null | 'find-ip' | 'why-needed';
type OsTab = 'windows' | 'mac';

export function IpSetup({ onComplete }: IpSetupProps) {
    const [ipAddress, setIpAddress] = useState('');
    const [validationError, setValidationError] = useState('');
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [helpModal, setHelpModal] = useState<HelpModal>(null);
    const [osTab, setOsTab] = useState<OsTab>('windows');

    const testConnection = async (ip: string): Promise<boolean> => {
        return new Promise((resolve) => {
            try {
                // Connect to Board Manager on port 3180 with /api/events endpoint
                const ws = new WebSocket(`ws://${ip}:3180/api/events`);
                const timeout = setTimeout(() => {
                    ws.close();
                    resolve(false);
                }, 5000); // 5 second timeout

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic IP validation
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ipAddress)) {
            setValidationError('Please enter a valid IP address (e.g., 192.168.1.100)');
            return;
        }

        setValidationError('');
        setConnectionStatus('connecting');

        // Run connection test and minimum delay in parallel
        const [connected] = await Promise.all([
            testConnection(ipAddress),
            new Promise(resolve => setTimeout(resolve, 1000)) // Minimum 1 second animation
        ]);

        if (connected) {
            setConnectionStatus('success');
            // Short delay to show success state
            setTimeout(() => {
                localStorage.setItem('autodartsIP', ipAddress);
                onComplete(ipAddress);
            }, 1000);
        } else {
            setConnectionStatus('error');
        }
    };

    const handleRetry = () => {
        setConnectionStatus('idle');
    };

    const renderIcon = () => {
        switch (connectionStatus) {
            case 'connecting':
                return (
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 mb-4">
                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                );
            case 'success':
                return (
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 backdrop-blur-md border border-green-400/30 mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                );
            case 'error':
                return (
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 backdrop-blur-md border border-red-400/30 mb-4">
                        <WifiOff className="w-8 h-8 text-red-400" />
                    </div>
                );
            default:
                return (
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-4">
                        <Wifi className="w-8 h-8 text-white" />
                    </div>
                );
        }
    };

    const renderContent = () => {
        switch (connectionStatus) {
            case 'connecting':
                return (
                    <>
                        <h1 className="text-2xl font-bold text-white mb-2">Connecting...</h1>
                        <p className="text-zinc-400 text-sm">
                            Testing connection to {ipAddress}
                        </p>
                    </>
                );
            case 'success':
                return (
                    <>
                        <h1 className="text-2xl font-bold text-green-400 mb-2">Connected!</h1>
                        <p className="text-zinc-400 text-sm">
                            Successfully connected to board manager
                        </p>
                    </>
                );
            case 'error':
                return (
                    <>
                        <h1 className="text-2xl font-bold text-red-400 mb-2">Connection Failed</h1>
                        <p className="text-zinc-400 text-sm mb-4">
                            Could not connect to {ipAddress}
                        </p>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-left">
                            <p className="text-zinc-300 text-sm font-medium mb-2">Troubleshooting:</p>
                            <ul className="text-zinc-400 text-xs space-y-1.5 list-disc list-inside">
                                <li>Make sure the Autodarts Board Manager is running</li>
                                <li>Verify the IP address is correct</li>
                                <li>Check that your device is on the same network</li>
                                <li>Ensure port 3180 is not blocked by a firewall</li>
                            </ul>
                        </div>
                    </>
                );
            default:
                return (
                    <>
                        <h1 className="text-2xl font-bold text-white mb-2">Welcome to Autocade</h1>
                        <p className="text-zinc-400 text-sm">
                            Enter the local IP of the device running Board Manager
                        </p>
                    </>
                );
        }
    };

    const renderFindIpModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setHelpModal(null)}>
            <div className="w-full max-w-lg mx-4 p-6 border border-white/10 rounded-xl bg-slate-900/95 backdrop-blur-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Finding Your IP Address</h2>
                    <button onClick={() => setHelpModal(null)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* OS Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setOsTab('windows')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${osTab === 'windows'
                            ? 'bg-blue-500/80 text-white'
                            : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                            }`}
                    >
                        <Monitor className="w-4 h-4" />
                        Windows
                    </button>
                    <button
                        onClick={() => setOsTab('mac')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${osTab === 'mac'
                            ? 'bg-blue-500/80 text-white'
                            : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                            }`}
                    >
                        <Apple className="w-4 h-4" />
                        macOS
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    {osTab === 'windows' ? (
                        <div className="space-y-3">
                            <p className="text-zinc-300 text-sm font-medium">Option 1: Using Command Prompt</p>
                            <ol className="text-zinc-400 text-sm space-y-2 list-decimal list-inside">
                                <li>Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono">Win + R</kbd> to open Run</li>
                                <li>Type <code className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono">cmd</code> and press Enter</li>
                                <li>Type <code className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono">ipconfig</code> and press Enter</li>
                                <li>Look for <span className="text-white">IPv4 Address</span> under your network adapter</li>
                            </ol>
                            <div className="border-t border-white/10 pt-3 mt-3">
                                <p className="text-zinc-300 text-sm font-medium">Option 2: Using Settings</p>
                                <ol className="text-zinc-400 text-sm space-y-2 list-decimal list-inside mt-2">
                                    <li>Open <span className="text-white">Settings → Network & Internet</span></li>
                                    <li>Click <span className="text-white">Properties</span> on your connection</li>
                                    <li>Scroll down to find <span className="text-white">IPv4 address</span></li>
                                </ol>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-zinc-300 text-sm font-medium">Option 1: Using System Preferences</p>
                            <ol className="text-zinc-400 text-sm space-y-2 list-decimal list-inside">
                                <li>Click the Apple menu  → <span className="text-white">System Settings</span></li>
                                <li>Click <span className="text-white">Network</span> in the sidebar</li>
                                <li>Select your active connection (Wi-Fi or Ethernet)</li>
                                <li>Click <span className="text-white">Details</span> to see your IP address</li>
                            </ol>
                            <div className="border-t border-white/10 pt-3 mt-3">
                                <p className="text-zinc-300 text-sm font-medium">Option 2: Using Terminal</p>
                                <ol className="text-zinc-400 text-sm space-y-2 list-decimal list-inside mt-2">
                                    <li>Open <span className="text-white">Terminal</span> (search in Spotlight)</li>
                                    <li>Type <code className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono">ipconfig getifaddr en0</code> (for Wi-Fi)</li>
                                    <li>Or <code className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono">ipconfig getifaddr en1</code> (for Ethernet)</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-zinc-500 text-xs mt-4 text-center">
                    Your IP address usually looks like <span className="text-zinc-300 font-mono">192.168.x.x</span> or <span className="text-zinc-300 font-mono">10.0.0.x</span>
                </p>
            </div>
        </div>
    );

    const renderWhyNeededModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setHelpModal(null)}>
            <div className="w-full max-w-md mx-4 p-6 border border-white/10 rounded-xl bg-slate-900/95 backdrop-blur-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Why We Need Your IP</h2>
                    <button onClick={() => setHelpModal(null)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-zinc-300 text-sm">
                        Autocade connects directly to your <span className="text-white font-medium">Autodarts Board Manager</span> to receive real-time dart throw data.
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <p className="text-zinc-300 text-sm font-medium mb-2">How it works:</p>
                        <ul className="text-zinc-400 text-sm space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">1.</span>
                                Board Manager runs on your dart board's computer
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">2.</span>
                                It broadcasts throw data over your local network
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">3.</span>
                                Autocade connects to receive this data in real-time
                            </li>
                        </ul>
                    </div>

                    <p className="text-zinc-500 text-xs">
                        Your IP address stays on your device and is only used for local network communication. Nothing is sent to external servers.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
                <div className="w-full max-w-md p-8 border border-white/10 rounded-xl bg-white/5">
                    {/* Header */}
                    <div className="text-center">
                        {renderIcon()}
                        {renderContent()}
                    </div>

                    {/* Form - only show when idle or has validation error */}
                    {(connectionStatus === 'idle') && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    value={ipAddress}
                                    onChange={(e) => {
                                        setIpAddress(e.target.value);
                                        setValidationError('');
                                    }}
                                    placeholder="192.168.1.100"
                                    className="w-full mt-8 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-zinc-500 focus:border-white/40 focus:outline-none transition-colors text-center text-lg font-mono"
                                />
                                {validationError && (
                                    <p className="mt-2 text-red-400 text-sm text-center">{validationError}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white font-medium transition-colors"
                            >
                                Connect
                            </button>
                        </form>
                    )}

                    {/* Error state actions */}
                    {connectionStatus === 'error' && (
                        <div className="space-y-3 mt-6">
                            <button
                                onClick={() => handleSubmit({ preventDefault: () => { } } as React.FormEvent)}
                                className="w-full py-3 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                            <button
                                onClick={handleRetry}
                                className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 text-sm transition-colors"
                            >
                                Change IP Address
                            </button>
                        </div>
                    )}

                    {/* Help links - only show when idle */}
                    {connectionStatus === 'idle' && (
                        <div className="text-center mt-6 space-y-1">
                            <div>
                                <button
                                    onClick={() => setHelpModal('find-ip')}
                                    className="text-zinc-500 hover:text-zinc-300 text-sm underline transition-colors"
                                >
                                    How do I find my IP address?
                                </button>
                            </div>
                            <div>
                                <button
                                    onClick={() => setHelpModal('why-needed')}
                                    className="text-zinc-500 hover:text-zinc-300 text-sm underline transition-colors"
                                >
                                    Why do you need this?
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {helpModal === 'find-ip' && renderFindIpModal()}
            {helpModal === 'why-needed' && renderWhyNeededModal()}
        </>
    );
}
