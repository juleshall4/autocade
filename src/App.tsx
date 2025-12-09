import { useState, useCallback } from 'react';
import { useAutodarts } from './hooks/use-autodarts';
import { AutodartsGame } from './components/autodarts-game';
import { ConsoleLog } from './components/console-log';
import { SimulatorPanel } from './components/simulator-panel';
import { Wifi, WifiOff, Gamepad2, Terminal, RotateCcw } from 'lucide-react';

function App() {
  const { isConnected, latestState, logs, clearLogs, simulateState } = useAutodarts();
  const [showSimulator, setShowSimulator] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  // Reset everything - game state, logs, and simulator
  const handleReset = useCallback(() => {
    setGameKey(prev => prev + 1); // Forces AutodartsGame to remount and reset
    clearLogs();
    // Simulate a clean state
    simulateState({
      connected: true,
      running: true,
      status: 'Takeout finished',
      event: 'Reset',
      numThrows: 0,
      throws: [],
    });
  }, [clearLogs, simulateState]);

  return (
    <div className="h-screen w-screen bg-black text-white flex font-mono overflow-hidden">

      {/* Console Panel - only shown when toggled */}
      {showConsole && (
        <div className="w-1/2 h-full">
          <ConsoleLog logs={logs} onClear={clearLogs} />
        </div>
      )}

      {/* Main Panel - Game Display */}
      <div className={`${showConsole ? 'w-1/2' : 'w-full'} h-full flex flex-col relative`}>
        {/* Top bar */}
        <div className="absolute top-4 right-4 flex items-center gap-2 text-xs z-10">
          {/* Dev Console Toggle */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded ${showConsole ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
          >
            <Terminal className="w-3 h-3" />
            <span>Dev</span>
          </button>

          {/* Simulator Toggle */}
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded ${showSimulator ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
          >
            <Gamepad2 className="w-3 h-3" />
            <span>Sim</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:bg-red-900 hover:text-red-400"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          {/* Connection Status */}
          <div className="flex items-center gap-2 ml-2">
            {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
            <span className="text-zinc-500">{isConnected ? 'DETECTING' : 'DISCONNECTED'}</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <AutodartsGame key={gameKey} state={latestState} />
        </div>
      </div>

      {/* Simulator Panel */}
      {showSimulator && (
        <SimulatorPanel
          onSimulateThrow={simulateState}
          onClose={() => setShowSimulator(false)}
        />
      )}
    </div>
  )
}

export default App
