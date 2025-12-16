import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Pin, GripVertical } from 'lucide-react';
import type { AutodartsSegment, AutodartsThrow, AutodartsState } from '../types/autodarts';


interface ManualEntryDrawerProps {
    currentState: AutodartsState | null;
    onSimulateThrow: (state: AutodartsState) => void;
}

// All segment numbers for the grid (standard dartboard order)
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

export function ManualEntryDrawer({ currentState, onSimulateThrow }: ManualEntryDrawerProps) {
    const [multiplier, setMultiplier] = useState<MultiplierMode>(1);
    const [isHovered, setIsHovered] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Get current throws from the actual state
    const currentThrows = currentState?.throws || [];
    const maxThrows = 3;
    const canThrow = currentThrows.length < maxThrows;

    // Only allow dragging when pinned
    const [isDragging, setIsDragging] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!panelRef.current || !isPinned) return;
        e.preventDefault();
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

    // Reset position when unpinned
    const handleTogglePin = () => {
        if (isPinned) {
            // Unpinning - reset position
            setPosition({ x: 0, y: 0 });
        }
        setIsPinned(!isPinned);
    };

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

    const handleBull = (isDouble: boolean) => {
        if (!canThrow) return;
        const segment = createSegment(25, isDouble ? 2 : 1);
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
            event: 'Throw removed',
            numThrows: newThrows.length,
            throws: newThrows,
        };
        onSimulateThrow(state);
    };

    const handleNextTurn = () => {
        setMultiplier(1);

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

    // Multiplier button styles
    const multiplierBtn = (mode: MultiplierMode, active: boolean) => {
        const colors = {
            1: active ? 'bg-white/20 text-white border-white/30' : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10',
            2: active ? 'bg-blue-500/80 text-white border-blue-400/50' : 'bg-blue-900/30 text-blue-400 border-blue-500/20 hover:bg-blue-900/50',
            3: active ? 'bg-purple-500/80 text-white border-purple-400/50' : 'bg-purple-900/30 text-purple-400 border-purple-500/20 hover:bg-purple-900/50',
        };
        return `px-4 py-2 text-sm font-bold rounded-lg backdrop-blur-md border transition-all ${colors[mode]}`;
    };

    // Segment button style based on current multiplier
    const segmentBtnClass = (disabled: boolean) => {
        if (disabled) return 'bg-white/5 text-zinc-600 cursor-not-allowed border-white/5';
        if (multiplier === 3) return 'bg-purple-900/40 text-purple-300 border-purple-500/20 hover:bg-purple-900/60';
        if (multiplier === 2) return 'bg-blue-900/40 text-blue-300 border-blue-500/20 hover:bg-blue-900/60';
        return 'bg-white/10 text-white border-white/10 hover:bg-white/20';
    };

    // Show drawer based on hover or pinned state
    const showDrawer = isHovered || isPinned;

    // Calculate style based on position and whether it's been dragged
    const hasBeenDragged = position.x !== 0 || position.y !== 0;
    const panelStyle = hasBeenDragged
        ? { transform: `translate(${position.x}px, ${position.y}px)` }
        : {};

    return (
        <>
            {/* Peek tab - visible when drawer is hidden */}
            <div
                className={`fixed top-1/2 -translate-y-1/2 right-0 z-40 transition-all duration-300 ${showDrawer ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
                onMouseEnter={() => setIsHovered(true)}
            >
                <div className="flex items-center gap-1 px-2 py-3 bg-white/10 backdrop-blur-xl border border-white/10 border-r-0 rounded-l-lg cursor-pointer hover:bg-white/20 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-zinc-400" />
                </div>
            </div>

            {/* Drawer container */}
            <div
                ref={panelRef}
                className={`fixed top-1/2 -translate-y-1/2 right-5 z-30 ${isDragging ? 'cursor-grabbing' : ''}`}
                style={panelStyle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => !isPinned && setIsHovered(false)}
            >

                {/* Drawer Panel - always rendered, visibility controlled via CSS */}
                <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl transition-all duration-300 ${showDrawer ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                    <div className="p-3 w-56">
                        {/* Header with drag handle and pin */}
                        <div className="flex items-center justify-between mb-2">
                            {/* Drag Handle - only visible when pinned */}
                            {isPinned ? (
                                <div
                                    onMouseDown={handleMouseDown}
                                    className="p-1 -ml-1 rounded cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
                                    title="Drag to move"
                                >
                                    <GripVertical className="w-4 h-4 text-zinc-500" />
                                </div>
                            ) : (
                                <div className="w-6" /> // Spacer when not pinned
                            )}

                            <span className="text-xs font-medium text-zinc-500 uppercase">Manual Entry</span>

                            {/* Pin Button */}
                            <button
                                onClick={handleTogglePin}
                                className={`p-1 rounded transition-colors ${isPinned ? 'bg-blue-500/30 text-blue-400' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                                title={isPinned ? 'Unpin' : 'Pin to keep open'}
                            >
                                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                            </button>
                        </div>



                        {/* Multiplier selector - vertical */}
                        <div className="flex gap-1 mb-3">
                            <button onClick={() => setMultiplier(1)} className={`flex-1 ${multiplierBtn(1, multiplier === 1)}`}>
                                S
                            </button>
                            <button onClick={() => setMultiplier(2)} className={`flex-1 ${multiplierBtn(2, multiplier === 2)}`}>
                                D
                            </button>
                            <button onClick={() => setMultiplier(3)} className={`flex-1 ${multiplierBtn(3, multiplier === 3)}`}>
                                T
                            </button>
                        </div>

                        {/* Segment grid - 4 columns for vertical layout */}
                        <div className="grid grid-cols-4 gap-1 mb-3">
                            {SEGMENTS.map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleThrow(num)}
                                    disabled={!canThrow}
                                    className={`py-2 text-xs font-bold rounded-lg border backdrop-blur-md transition-all ${segmentBtnClass(!canThrow)}`}
                                >
                                    {getPrefix()}{num}
                                </button>
                            ))}
                        </div>

                        {/* Special buttons - row */}
                        <div className="flex gap-1 mb-3">
                            <button
                                onClick={handleMiss}
                                disabled={!canThrow}
                                className="flex-1 py-2 text-xs font-bold rounded-lg bg-red-900/40 border border-red-500/20 text-red-400 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                Miss
                            </button>
                            <button
                                onClick={() => handleBull(false)}
                                disabled={!canThrow}
                                className="flex-1 py-2 text-xs font-bold rounded-lg bg-green-900/40 border border-green-500/20 text-green-400 hover:bg-green-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                25
                            </button>
                            <button
                                onClick={() => handleBull(true)}
                                disabled={!canThrow}
                                className="flex-1 py-2 text-xs font-bold rounded-lg bg-green-900/40 border border-green-500/20 text-green-400 hover:bg-green-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                Bull
                            </button>
                        </div>

                        {/* Throw History */}
                        <div className="flex items-center justify-center gap-2 mb-3 min-h-[20px]">
                            {currentThrows.length === 0 ? (
                                <span className="text-xs text-zinc-500 italic">No throws</span>
                            ) : (
                                currentThrows.map((t, i) => (
                                    <span key={i} className="text-xs font-mono font-bold text-zinc-400">
                                        {t.segment.name}{i < currentThrows.length - 1 ? ', ' : ''}
                                    </span>
                                ))
                            )}
                        </div>

                        {/* Undo and Next Turn buttons */}
                        <div className="flex gap-1">
                            <button
                                onClick={handleUndo}
                                disabled={currentThrows.length === 0}
                                className="flex-1 py-2 text-xs font-bold rounded-lg bg-white/10 border border-white/10 text-zinc-300 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                ↩ Undo
                            </button>
                            <button
                                onClick={handleNextTurn}
                                className="flex-1 py-2 text-xs font-bold rounded-lg bg-green-600/80 border border-green-500/50 text-white hover:bg-green-600 transition-all"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

