import { useState } from 'react';
import { Wifi } from 'lucide-react';

interface IpSetupProps {
    onComplete: (ipAddress: string) => void;
}

export function IpSetup({ onComplete }: IpSetupProps) {
    const [ipAddress, setIpAddress] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic IP validation
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ipAddress)) {
            setError('Please enter a valid IP address (e.g., 192.168.1.100)');
            return;
        }

        // Save to localStorage
        localStorage.setItem('autodartsIP', ipAddress);
        onComplete(ipAddress);
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            <div className="w-full max-w-md p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-4">
                        <Wifi className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Connect to Autodarts</h1>
                    <p className="text-zinc-400 text-sm">
                        Enter the IP address of your Autodarts board to get started
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={ipAddress}
                            onChange={(e) => {
                                setIpAddress(e.target.value);
                                setError('');
                            }}
                            placeholder="192.168.1.100"
                            className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-zinc-500 focus:border-white/40 focus:outline-none transition-colors text-center text-lg font-mono"
                        />
                        {error && (
                            <p className="mt-2 text-red-400 text-sm text-center">{error}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white font-medium transition-colors"
                    >
                        Continue
                    </button>
                </form>

                {/* Help link */}
                <div className="text-center mt-6">
                    <a
                        href="#"
                        className="text-zinc-500 hover:text-zinc-300 text-sm underline transition-colors"
                    >
                        How do I find my IP address?
                    </a>
                </div>
            </div>
        </div>
    );
}
