import { useState } from 'react';
import { Wifi, WifiOff, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface IpSetupProps {
    onComplete: (ipAddress: string) => void;
}

type ConnectionStatus = 'idle' | 'connecting' | 'success' | 'error';

export function IpSetup({ onComplete }: IpSetupProps) {
    const [ipAddress, setIpAddress] = useState('');
    const [validationError, setValidationError] = useState('');
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');

    const testConnection = async (ip: string): Promise<boolean> => {
        return new Promise((resolve) => {
            try {
                const ws = new WebSocket(`ws://${ip}:3000`);
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

        const connected = await testConnection(ipAddress);

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
                                <li>Ensure port 3000 is not blocked by a firewall</li>
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

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
            <div className="w-full max-w-md p-8 border border-white/10 rounded-xl bg-white/5">
                {/* Header */}
                <div className="text-center mb-8">
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
                                className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-zinc-500 focus:border-white/40 focus:outline-none transition-colors text-center text-lg font-mono"
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
                    <div className="text-center mt-6">
                        <div>
                            <a
                                href="#"
                                className="text-zinc-500 hover:text-zinc-300 text-sm underline transition-colors"
                            >
                                How do I find my IP address?
                            </a>
                        </div>
                        <div>
                            <a
                                href="#"
                                className="text-zinc-500 hover:text-zinc-300 text-sm underline transition-colors"
                            >
                                Why do you need this?
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

