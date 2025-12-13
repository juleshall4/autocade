import { useState, useRef, useEffect } from 'react';
import type { AutodartsSegment, AutodartsThrow, AutodartsState } from '../types/autodarts';
import { X, Pin, GripVertical } from 'lucide-react';

interface SimulatorPanelProps {
    currentState: AutodartsState | null;
    onSimulateThrow: (state: AutodartsState) => void;
    onClose: () => void;
}

// All segment numbers for the grid
const SEGMENTS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

type MultiplierMode = 1 | 2 | 3;

// Create a segment object
function createSegment(number: number, multiplier: number): AutodartsSegment {
    const prefix = multiplier === 3 ? 'T' : multiplier === 2 ? 'D' : 'S';
    const bed = multiplier === 3 ? 'Triple' : multiplier === 2 ? 'Double' : 'Single';
    return {
        name: `${prefix}${number}`,
        number,
        bed,
        multiplier,
    };
}

// Create a throw object
function createThrow(segment: AutodartsSegment): AutodartsThrow {
    return {
        segment,
        coords: { x: Math.random() * 100, y: Math.random() * 100 },
    };
}

export function SimulatorPanel({ currentState, onSimulateThrow, onClose }: SimulatorPanelProps) {
    const [multiplier, setMultiplier] = useState<MultiplierMode>(1);
    const [isPinned, setIsPinned] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });

    // Get current throws from the actual state (real + simulated)
    const currentThrows = currentState?.throws || [];
    const maxThrows = 3;
    const canThrow = currentThrows.length < maxThrows;

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!panelRef.current) return;
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y,
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleThrow = (number: number) => {
        if (!canThrow) return;
        const segment = createSegment(number, multiplier);
        const newThrow = createThrow(segment);
        const newThrows = [...currentThrows, newThrow];

        const state: AutodartsState = {
            connected: true,
            running: true,
            status: 'Throw',
            event: 'Throw detected',
            numThrows: newThrows.length,
            throws: newThrows,
        };
        onSimulateThrow(state);
    };

    const handleMiss = () => {
        if (!canThrow) return;
        const segment: AutodartsSegment = {
            name: 'Miss',
            number: 0,
            bed: 'Outside',
            multiplier: 0,
        };
        const newThrow = createThrow(segment);
        const newThrows = [...currentThrows, newThrow];

        const state: AutodartsState = {
            connected: true,
            running: true,
            status: 'Throw',
            event: 'Throw detected',
            numThrows: newThrows.length,
            throws: newThrows,
        };
        onSimulateThrow(state);
    };

    const handleUndo = () => {
        if (currentThrows.length === 0) return;
        const newThrows = currentThrows.slice(0, -1);

        const state: AutodartsState = {
            connected: true,
            running: true,
            status: 'Throw',
            event: 'Throw removed',  // This signals it's an undo, should subtract points
            numThrows: newThrows.length,
            throws: newThrows,
        };
        onSimulateThrow(state);
    };

    const handleNextTurn = () => {
        setMultiplier(1); // Reset to single

        const state: AutodartsState = {
            connected: true,
            running: true,
            status: 'Takeout finished',
            event: 'Takeout finished',
            numThrows: 0,
            throws: [],
        };
        onSimulateThrow(state);
    };

    const getPrefix = () => multiplier === 3 ? 'T' : multiplier === 2 ? 'D' : 'S';

    // Calculate style based on position and whether it's been dragged
    const hasBeenDragged = position.x !== 0 || position.y !== 0;
    const panelStyle = hasBeenDragged
        ? { transform: `translate(${position.x}px, ${position.y}px)`, right: 'auto', bottom: 'auto', left: '16px', top: '16px' }
        : {};

    return (
        <div
            ref={panelRef}
            className={`fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-3 z-50 w-72 ${isDragging ? 'cursor-grabbing' : ''}`}
            style={panelStyle}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                {/* Drag Handle */}
                <div
                    onMouseDown={handleMouseDown}
                    className="flex items-center gap-1 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-white/10"
                    title="Drag to move"
                >
                    <GripVertical className="w-4 h-4 text-zinc-500" />
                </div>

                <span className="text-xs font-bold text-zinc-400 uppercase flex-1 text-center">Simulator</span>

                <div className="flex items-center gap-1">
                    {/* Pin Button */}
                    <button
                        onClick={() => setIsPinned(!isPinned)}
                        className={`p-1 rounded transition-colors ${isPinned ? 'bg-blue-500/30 text-blue-400' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                        title={isPinned ? 'Unpin' : 'Pin to keep open'}
                    >
                        <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                    </button>
                    {/* Close Button - hidden when pinned */}
                    {!isPinned && (
                        <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Multiplier mode selector */}
            <div className="grid grid-cols-3 gap-1 mb-2">
                <button
                    onClick={() => setMultiplier(1)}
                    className={`py-1.5 text-[10px] font-bold rounded transition-all ${multiplier === 1
                        ? 'bg-white text-black'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                >
                    Single
                </button>
                <button
                    onClick={() => setMultiplier(2)}
                    className={`py-1.5 text-[10px] font-bold rounded transition-all ${multiplier === 2
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-900/50 text-blue-400 hover:bg-blue-900'
                        }`}
                >
                    Double
                </button>
                <button
                    onClick={() => setMultiplier(3)}
                    className={`py-1.5 text-[10px] font-bold rounded transition-all ${multiplier === 3
                        ? 'bg-purple-500 text-white'
                        : 'bg-purple-900/50 text-purple-400 hover:bg-purple-900'
                        }`}
                >
                    Triple
                </button>
            </div>

            {/* Special buttons */}
            <div className="grid grid-cols-3 gap-1 mb-2">
                <button
                    onClick={handleMiss}
                    disabled={!canThrow}
                    className={`py-1.5 text-[10px] font-bold rounded ${canThrow ? 'bg-red-900/50 text-red-400 hover:bg-red-900' : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'}`}
                >
                    Miss
                </button>
                <button
                    onClick={() => handleThrow(25)}
                    disabled={!canThrow}
                    className={`py-1.5 text-[10px] font-bold rounded ${canThrow ? 'bg-green-900/50 text-green-400 hover:bg-green-900' : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'}`}
                >
                    25
                </button>
                <button
                    onClick={() => {
                        if (!canThrow) return;
                        const segment = createSegment(25, 2);
                        const newThrow = createThrow(segment);
                        const newThrows = [...currentThrows, newThrow];
                        onSimulateThrow({
                            connected: true, running: true, status: 'Throw',
                            event: 'Throw detected', numThrows: newThrows.length, throws: newThrows,
                        });
                    }}
                    disabled={!canThrow}
                    className={`py-1.5 text-[10px] font-bold rounded ${canThrow ? 'bg-green-900/50 text-green-400 hover:bg-green-900' : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'}`}
                >
                    Bull
                </button>
            </div>

            {/* Segment grid - shows current multiplier prefix */}
            <div className="grid grid-cols-5 gap-1 mb-2">
                {SEGMENTS.map(num => (
                    <button
                        key={num}
                        onClick={() => handleThrow(num)}
                        disabled={!canThrow}
                        className={`py-1.5 text-[10px] font-bold rounded transition-all ${!canThrow
                            ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                            : multiplier === 3
                                ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-900'
                                : multiplier === 2
                                    ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                    >
                        {getPrefix()}{num}
                    </button>
                ))}
            </div>

            {/* Current throws display */}
            <div className="text-[10px] text-zinc-500 mb-2">
                Throws: {currentThrows.map(t => t.segment.name).join(', ') || '-'}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-1">
                <button
                    onClick={handleUndo}
                    className="py-1.5 text-[10px] font-bold bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700"
                >
                    ↩ Undo
                </button>
                <button
                    onClick={handleNextTurn}
                    className="py-1.5 text-[10px] font-bold bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700"
                >
                    Next ▶
                </button>
            </div>
        </div>
    );
}

