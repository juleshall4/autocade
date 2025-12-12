import { useState } from 'react';
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

    // Get current throws from the actual state
    const currentThrows = currentState?.throws || [];
    const maxThrows = 3;
    const canThrow = currentThrows.length < maxThrows;

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

    const [isHovered, setIsHovered] = useState(false);

    // Show drawer based only on hover
    const showDrawer = isHovered;

    return (
        <>
            {/* Hover detection zone - 3px strip on right edge, full height */}
            <div
                className="fixed right-0 z-40 w-[100px] h-1/2 translate-y-1/2"
                onMouseEnter={() => setIsHovered(true)}
            />

            {/* Drawer container - NOT hoverable, just positioned */}
            <div
                className="fixed top-1/2 -translate-y-1/2 right-5 z-30"
                onMouseLeave={() => setIsHovered(false)}
            >

                {/* Drawer Panel - always rendered, visibility controlled via CSS */}
                <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl transition-all duration-300 ${showDrawer ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                    <div className="p-3 w-56">
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
