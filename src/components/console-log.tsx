import { useState, useMemo, memo, useRef, useLayoutEffect, useCallback } from 'react';
import type { LogEntry } from '../hooks/use-autodarts';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface ConsoleLogProps {
    logs: LogEntry[];
    onClear: () => void;
}

// Collapsible log item
const LogItem = memo(function LogItem({ log }: { log: LogEntry }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-zinc-900/50 rounded border border-zinc-800/50 hover:border-zinc-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 flex items-center gap-2 text-left"
            >
                {isOpen ? (
                    <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                ) : (
                    <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
                )}
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${log.type === 'state' ? 'bg-blue-900/50 text-blue-400' :
                    log.type === 'system' ? 'bg-green-900/50 text-green-400' :
                        log.type === 'error' ? 'bg-red-900/50 text-red-400' :
                            'bg-zinc-800 text-zinc-400'
                    }`}>
                    {log.type}
                </span>
                <span className="text-zinc-600 text-[10px]">{log.timestamp}</span>
            </button>
            {isOpen && (
                <pre className="text-zinc-400 overflow-x-auto whitespace-pre-wrap break-all p-2 pt-0 text-xs">
                    {typeof log.data === 'object'
                        ? JSON.stringify(log.data, null, 2)
                        : String(log.data)
                    }
                </pre>
            )}
        </div>
    );
});

export function ConsoleLog({ logs, onClear }: ConsoleLogProps) {
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const stickToBottomRef = useRef(true);

    // Get unique log types
    const logTypes = useMemo(() => {
        const types = new Set<string>();
        logs.forEach(log => types.add(log.type));
        return Array.from(types).sort();
    }, [logs.length]);

    // Filter logs by active filter
    const filteredLogs = activeFilter
        ? logs.filter(log => log.type === activeFilter)
        : logs;

    // Track whether user is at bottom
    const handleScroll = useCallback(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            stickToBottomRef.current = distanceFromBottom < 30;
        }
    }, []);

    // Synchronously scroll to bottom after render if we should stick
    useLayoutEffect(() => {
        if (stickToBottomRef.current && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [filteredLogs.length]);

    const handleFilterClick = (type: string) => {
        setActiveFilter(prev => prev === type ? null : type);
    };

    return (
        <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800">
            {/* Header with filter buttons */}
            <div className="p-2 border-b border-zinc-800 shrink-0">
                <div className="flex gap-1 flex-wrap items-center">
                    <button
                        onClick={() => setActiveFilter(null)}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${activeFilter === null
                            ? 'bg-white text-black'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                    >
                        All
                    </button>
                    {logTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => handleFilterClick(type)}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${activeFilter === type
                                ? 'bg-white text-black'
                                : type === 'state' ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900' :
                                    type === 'system' ? 'bg-green-900/50 text-green-400 hover:bg-green-900' :
                                        type === 'error' ? 'bg-red-900/50 text-red-400 hover:bg-red-900' :
                                            'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                    <div className="flex-1" />
                    <button
                        onClick={onClear}
                        className="px-2 py-1 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded border border-zinc-700"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Log entries - newest first */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs"
            >
                {filteredLogs.length === 0 && (
                    <div className="text-zinc-600 italic text-center mt-8">
                        {activeFilter ? 'No matching logs...' : 'Waiting for events...'}
                    </div>
                )}
                {[...filteredLogs].reverse().map((log) => (
                    <LogItem key={log.id} log={log} />
                ))}
            </div>
        </div>
    );
}
