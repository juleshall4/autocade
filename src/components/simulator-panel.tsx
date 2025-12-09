import { useState } from 'react';
import type { AutodartsSegment, AutodartsThrow, AutodartsState } from '../types/autodarts';
import { X } from 'lucide-react';

interface SimulatorPanelProps {
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

export function SimulatorPanel({ onSimulateThrow, onClose }: SimulatorPanelProps) {
    const [throws, setThrows] = useState<AutodartsThrow[]>([]);
    const [multiplier, setMultiplier] = useState<MultiplierMode>(1);

    const handleThrow = (number: number) => {
        const segment = createSegment(number, multiplier);
        const newThrow = createThrow(segment);
        const newThrows = [...throws, newThrow];
        setThrows(newThrows);

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
        const segment: AutodartsSegment = {
            name: 'Miss',
            number: 0,
            bed: 'Outside',
            multiplier: 0,
        };
        const newThrow = createThrow(segment);
        const newThrows = [...throws, newThrow];
        setThrows(newThrows);

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
        if (throws.length === 0) return;
        const newThrows = throws.slice(0, -1);
        setThrows(newThrows);

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
        setThrows([]);
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

    return (
        <div className="fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-3 z-50 w-72">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase">Simulator</span>
                <button onClick={onClose} className="text-zinc-500 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
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
                    className="py-1.5 text-[10px] font-bold bg-red-900/50 text-red-400 rounded hover:bg-red-900"
                >
                    Miss
                </button>
                <button
                    onClick={() => {
                        const segment = createSegment(25, 1);
                        const newThrow = createThrow(segment);
                        const newThrows = [...throws, newThrow];
                        setThrows(newThrows);
                        onSimulateThrow({
                            connected: true, running: true, status: 'Throw',
                            event: 'Throw detected', numThrows: newThrows.length, throws: newThrows,
                        });
                    }}
                    className="py-1.5 text-[10px] font-bold bg-green-900/50 text-green-400 rounded hover:bg-green-900"
                >
                    25
                </button>
                <button
                    onClick={() => {
                        const segment = createSegment(25, 2);
                        const newThrow = createThrow(segment);
                        const newThrows = [...throws, newThrow];
                        setThrows(newThrows);
                        onSimulateThrow({
                            connected: true, running: true, status: 'Throw',
                            event: 'Throw detected', numThrows: newThrows.length, throws: newThrows,
                        });
                    }}
                    className="py-1.5 text-[10px] font-bold bg-green-900/50 text-green-400 rounded hover:bg-green-900"
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
                        className={`py-1.5 text-[10px] font-bold rounded transition-all ${multiplier === 3
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
                Throws: {throws.map(t => t.segment.name).join(', ') || '-'}
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
