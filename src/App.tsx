import { useAutodarts } from './hooks/use-autodarts';
import { AutodartsGame } from './components/autodarts-game';
import { Wifi, WifiOff } from 'lucide-react';

function App() {
  const { isConnected, latestState } = useAutodarts();

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col font-mono relative overflow-hidden">

      {/* Connection Status Indicator - Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-xs z-10">
        {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
        <span className="text-zinc-500">{isConnected ? 'DETECTING' : 'DISCONNECTED'}</span>
      </div>

      <div className="flex-1 flex items-center justify-center w-full h-full">
        <AutodartsGame state={latestState} />
      </div>
    </div>
  )
}

export default App
