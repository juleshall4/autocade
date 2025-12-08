import { useEffect, useState } from 'react';
import { useDartsCaller } from './hooks/use-darts-caller';
import { EventLog } from './components/event-log';
import { GameDisplay } from './components/game-display';
import type { DartsCallerLogEntry } from './types/darts-caller';

const MAX_LOG_SIZE = 100;

function App() {
  const { isConnected, lastMessage } = useDartsCaller();
  const [messages, setMessages] = useState<DartsCallerLogEntry[]>([]);

  useEffect(() => {
    if (lastMessage) {
      setMessages((prev) => {
        const newMsg: DartsCallerLogEntry = {
          ...lastMessage,
          _timestamp: new Date().toLocaleTimeString()
        };
        const newLog = [...prev, newMsg];
        if (newLog.length > MAX_LOG_SIZE) {
          return newLog.slice(newLog.length - MAX_LOG_SIZE);
        }
        return newLog;
      });
    }
  }, [lastMessage]);

  return (
    <div className="h-screen w-screen bg-black text-white flex overflow-hidden font-mono">
      <EventLog messages={messages} isConnected={isConnected} />

      {/* RIGHT PANEL - Game UI */}
      <div className="w-1/2 h-full flex flex-col bg-zinc-950/20">
        <GameDisplay lastMessage={lastMessage} />
      </div>
    </div>
  )
}

export default App
