import { useAutodarts } from './hooks/use-autodarts';
import { AutodartsGame } from './components/autodarts-game';
import { ConsoleLog } from './components/console-log';
import { Wifi, WifiOff } from 'lucide-react';

function App() {
  const { isConnected, latestState, logs, clearLogs } = useAutodarts();

  return (
    <div className="h-screen w-screen bg-black text-white flex font-mono overflow-hidden">

      {/* Left Panel - Console Log */}
      <div className="w-1/2 h-full">
        <ConsoleLog logs={logs} onClear={clearLogs} />
      </div>

      {/* Right Panel - Game Display */}
      <div className="w-1/2 h-full flex flex-col relative">
        {/* Connection Status Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 text-xs z-10">
          {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
          <span className="text-zinc-500">{isConnected ? 'DETECTING' : 'DISCONNECTED'}</span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <AutodartsGame state={latestState} />
        </div>
      </div>
    </div>
  )
}

export default App
