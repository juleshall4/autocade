import { useEffect, useRef } from "react"
import { Wifi, WifiOff } from "lucide-react"
import type { DartsCallerLogEntry } from "../types/darts-caller"

interface EventLogProps {
    messages: DartsCallerLogEntry[]
    isConnected: boolean
}

export function EventLog({ messages, isConnected }: EventLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    return (
        <div className="w-1/2 h-full flex flex-col border-r border-white/20">
            <div className="p-4 border-b border-white/20 flex items-center justify-between bg-zinc-900/50">
                <h2 className="text-xl font-bold text-neon-pink uppercase tracking-widest neon-effect"></h2>
                <div className="flex items-center gap-2 text-xs">
                    {isConnected ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                        <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                    <span>{isConnected ? "CONNECTED" : "DISCONNECTED"}</span>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-zinc-500 italic text-center mt-20">
                        Waiting for events...
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className="bg-zinc-900/80 p-3 rounded border border-white/10 text-xs"
                    >
                        <div className="text-zinc-400 mb-1 border-b border-white/5 pb-1 flex justify-between">
                            <span className="text-white">
                                {msg.event || "Unknown Event"}
                            </span>
                            <span>{msg._timestamp}</span>
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap text-zinc-300">
                            {JSON.stringify(
                                msg,
                                (key, value) => {
                                    if (key === "_timestamp") return undefined
                                    return value
                                },
                                2,
                            )}
                        </pre>
                    </div>
                ))}
            </div>
        </div>
    )
}
