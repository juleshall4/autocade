import { useState } from 'react';
import type { Player } from '../types/player';
import { CameraCapture } from './camera-capture';
import { VideoCapture } from './video-capture';
import { Plus, Camera, ChevronDown, ChevronUp, Trash2, Video, Trophy, Target, Crosshair, GripVertical } from 'lucide-react';

interface PlayerConfigProps {
    players: Player[];
    onAddPlayer: () => void;
    onRemovePlayer: (id: string) => void;
    onUpdateName: (id: string, name: string) => void;
    onUpdatePhoto: (id: string, photo: string) => void;
    onUpdateVictoryVideo: (id: string, video: string) => void;
    onToggleActive: (id: string) => void;
    onReorderPlayers: (fromIndex: number, toIndex: number) => void;
}

export function PlayerConfigContent({
    players,
    onAddPlayer,
    onRemovePlayer,
    onUpdateName,
    onUpdatePhoto,
    onUpdateVictoryVideo,
    onToggleActive,
    onReorderPlayers,
}: PlayerConfigProps) {
    const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
    const [capturingPlayerId, setCapturingPlayerId] = useState<string | null>(null);
    const [recordingPlayerId, setRecordingPlayerId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        onReorderPlayers(draggedIndex, dropIndex);
        setDraggedIndex(null);
    };

    const handleCapture = (photo: string) => {
        if (capturingPlayerId) {
            onUpdatePhoto(capturingPlayerId, photo);
            setCapturingPlayerId(null);
        }
    };

    const handleVideoCapture = (video: string) => {
        if (recordingPlayerId) {
            onUpdateVictoryVideo(recordingPlayerId, video);
            setRecordingPlayerId(null);
        }
    };

    const handleDelete = (id: string) => {
        onRemovePlayer(id);
        setDeleteConfirmId(null);
        setExpandedPlayerId(null);
    };

    const toggleExpand = (id: string) => {
        setExpandedPlayerId(prev => prev === id ? null : id);
    };

    return (
        <>
            <div className="w-full h-full flex flex-col min-h-0">
                {/* Player list */}
                <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
                    {players.map((player, index) => {
                        const isExpanded = expandedPlayerId === player.id;

                        return (
                            <div
                                key={player.id}
                                className={`rounded-lg border transition-all ${player.isActive
                                    ? 'bg-white/10 border-white/20'
                                    : 'bg-white/5 border-white/10 opacity-60'
                                    }`}
                            >
                                {/* Collapsed view */}
                                <div
                                    className="flex items-center gap-2 p-1.5 cursor-pointer"
                                    onClick={() => toggleExpand(player.id)}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, players.indexOf(player))}
                                    onDragOver={(e) => handleDragOver(e)}
                                    onDrop={(e) => handleDrop(e, players.indexOf(player))}
                                >
                                    {/* Drag Handle */}
                                    <div
                                        className="text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <GripVertical className="w-4 h-4" />
                                    </div>

                                    {/* Active toggle */}
                                    <button
                                        onClick={e => { e.stopPropagation(); onToggleActive(player.id); }}
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${player.isActive ? 'bg-blue-500/80 border-blue-400' : 'border-zinc-500'
                                            }`}
                                    >
                                        {player.isActive && <div className="w-1 h-1 bg-white rounded-full" />}
                                    </button>

                                    {/* Photo */}
                                    <div className="w-6 h-6 rounded-full bg-zinc-700 shrink-0 overflow-hidden">
                                        {player.photo ? (
                                            <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-500">
                                                {player.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <span className="flex-1 text-white font-medium text-sm truncate">{player.name}</span>

                                    {/* Expand chevron */}
                                    {isExpanded ? (
                                        <ChevronUp className="w-3 h-3 text-zinc-400" />
                                    ) : (
                                        <ChevronDown className="w-3 h-3 text-zinc-400" />
                                    )}
                                </div>

                                {/* Expanded view */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-4 border-t border-zinc-700 pt-4">
                                        {/* Photo & Name row */}
                                        <div className="flex items-start gap-4">
                                            {/* Photo button */}
                                            <button
                                                onClick={() => setCapturingPlayerId(player.id)}
                                                className="w-16 h-16 rounded-full bg-zinc-700 shrink-0 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all group relative"
                                            >
                                                {player.photo ? (
                                                    <>
                                                        <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <Camera className="w-5 h-5 text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <Camera className="w-6 h-6 text-zinc-400" />
                                                )}
                                            </button>

                                            {/* Name input */}
                                            <div className="flex-1">
                                                <label className="text-zinc-500 text-xs uppercase tracking-widest block mb-1">Name</label>
                                                <input
                                                    type="text"
                                                    value={player.name}
                                                    onChange={e => onUpdateName(player.id, e.target.value)}
                                                    className="w-full bg-zinc-700 text-white rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Victory Dance Video */}
                                        <div>
                                            <label className="text-zinc-500 text-xs uppercase tracking-widest block mb-2">Victory Dance</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setRecordingPlayerId(player.id)}
                                                    className="flex-1 py-3 bg-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-600 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Video className="w-4 h-4" />
                                                    {player.victoryVideo ? 'Change Video' : 'Record Video'}
                                                </button>
                                                {player.victoryVideo && (
                                                    <button
                                                        onClick={() => onUpdateVictoryVideo(player.id, '')}
                                                        className="px-4 py-3 bg-zinc-700 rounded-lg text-red-400 hover:text-red-300 hover:bg-zinc-600 transition-colors"
                                                        title="Remove video"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div>
                                            <label className="text-zinc-500 text-xs uppercase tracking-widest block mb-2">Statistics</label>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="flex items-center gap-2 bg-zinc-700/50 rounded px-3 py-2">
                                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                                    <span className="text-zinc-400">Wins</span>
                                                    <span className="ml-auto text-white font-bold">{player.stats.gamesWon}</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-zinc-700/50 rounded px-3 py-2">
                                                    <Target className="w-4 h-4 text-blue-400" />
                                                    <span className="text-zinc-400">Played</span>
                                                    <span className="ml-auto text-white font-bold">{player.stats.gamesPlayed}</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-zinc-700/50 rounded px-3 py-2">
                                                    <Crosshair className="w-4 h-4 text-green-400" />
                                                    <span className="text-zinc-400">Best Turn</span>
                                                    <span className="ml-auto text-white font-bold">{player.stats.highestTurn}</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-zinc-700/50 rounded px-3 py-2">
                                                    <span className="w-4 h-4 text-center text-purple-400">🎯</span>
                                                    <span className="text-zinc-400">Darts</span>
                                                    <span className="ml-auto text-white font-bold">{player.stats.totalDarts}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delete button */}
                                        <button
                                            onClick={() => setDeleteConfirmId(player.id)}
                                            className="w-full py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Player
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Add player button */}
                <button
                    onClick={onAddPlayer}
                    className="py-2 border border-dashed border-white/20 rounded-lg text-zinc-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <Plus className="w-3 h-3" />
                    Add Player
                </button>
            </div>

            {/* Camera Capture Modal */}
            {capturingPlayerId && (
                <CameraCapture
                    onCapture={handleCapture}
                    onClose={() => setCapturingPlayerId(null)}
                />
            )}

            {/* Video Capture Modal */}
            {recordingPlayerId && (
                <VideoCapture
                    onCapture={handleVideoCapture}
                    onClose={() => setRecordingPlayerId(null)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold text-white mb-2">Delete Player?</h3>
                        <p className="text-zinc-400 mb-6">
                            This will permanently delete this player and all their history and statistics. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
