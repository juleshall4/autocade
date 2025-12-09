import { useState } from 'react';
import type { Player } from '../types/player';
import { CameraCapture } from './camera-capture';
import { Plus, Trash2, X, Camera } from 'lucide-react';

interface PlayerConfigProps {
    players: Player[];
    onAddPlayer: () => void;
    onRemovePlayer: (id: string) => void;
    onUpdateName: (id: string, name: string) => void;
    onUpdatePhoto: (id: string, photo: string) => void;
    onToggleActive: (id: string) => void;
    onClose: () => void;
}

export function PlayerConfig({
    players,
    onAddPlayer,
    onRemovePlayer,
    onUpdateName,
    onUpdatePhoto,
    onToggleActive,
    onClose,
}: PlayerConfigProps) {
    const [capturingPlayerId, setCapturingPlayerId] = useState<string | null>(null);

    const handleCapture = (photo: string) => {
        if (capturingPlayerId) {
            onUpdatePhoto(capturingPlayerId, photo);
            setCapturingPlayerId(null);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Players</h2>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Player list */}
                    <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                        {players.map(player => (
                            <div
                                key={player.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border ${player.isActive
                                    ? 'bg-zinc-800 border-zinc-600'
                                    : 'bg-zinc-900 border-zinc-800 opacity-50'
                                    }`}
                            >
                                {/* Active toggle */}
                                <button
                                    onClick={() => onToggleActive(player.id)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${player.isActive
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-zinc-600'
                                        }`}
                                >
                                    {player.isActive && (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                </button>

                                {/* Photo / Camera button */}
                                <button
                                    onClick={() => setCapturingPlayerId(player.id)}
                                    className="w-10 h-10 rounded-full bg-zinc-700 shrink-0 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                                >
                                    {player.photo ? (
                                        <img
                                            src={player.photo}
                                            alt={player.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Camera className="w-4 h-4 text-zinc-400" />
                                    )}
                                </button>

                                {/* Name input */}
                                <input
                                    type="text"
                                    value={player.name}
                                    onChange={e => onUpdateName(player.id, e.target.value)}
                                    className="flex-1 bg-transparent text-white border-b border-zinc-700 focus:border-zinc-500 outline-none px-1 py-0.5"
                                />

                                {/* Delete button */}
                                <button
                                    onClick={() => onRemovePlayer(player.id)}
                                    className="text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add player button */}
                    <button
                        onClick={onAddPlayer}
                        className="w-full py-3 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Player
                    </button>
                </div>
            </div>

            {/* Camera Capture Modal */}
            {capturingPlayerId && (
                <CameraCapture
                    onCapture={handleCapture}
                    onClose={() => setCapturingPlayerId(null)}
                />
            )}
        </>
    );
}
