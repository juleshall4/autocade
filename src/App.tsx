import { useState, useCallback } from 'react';
import { useAutodarts } from './hooks/use-autodarts';
import { usePlayers } from './hooks/use-players';
import { AutodartsGame } from './components/autodarts-game';
import { ConsoleLog } from './components/console-log';
import { SimulatorPanel } from './components/simulator-panel';
import { GameSelector } from './components/game-selector';
import { X01Rules, type X01Settings } from './components/x01-rules';
import { X01Game } from './components/x01-game';
import { PlayerConfig } from './components/player-config';
import { PlayerList } from './components/player-list';
import { getStatusEmoji } from './types/autodarts';
import { Wifi, WifiOff, Gamepad2, Terminal, RotateCcw, List, Users } from 'lucide-react';

type AppView = 'game' | 'game-selector' | 'x01-rules' | 'x01-game';

function App() {
  const { isConnected, latestState, logs, clearLogs, simulateState } = useAutodarts();
  const { players, activePlayers, addPlayer, removePlayer, updatePlayerName, updatePlayerPhoto, togglePlayerActive } = usePlayers();

  const [showSimulator, setShowSimulator] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [showPlayerConfig, setShowPlayerConfig] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [currentView, setCurrentView] = useState<AppView>('game');
  const [x01Settings, setX01Settings] = useState<X01Settings>({
    baseScore: 501,
    inMode: 'single',
    outMode: 'double',
    matchMode: 'off',
    legsToWin: 3,
    setsToWin: 3,
  });

  // Reset everything - game state, logs, and simulator
  const handleReset = useCallback(() => {
    setGameKey(prev => prev + 1);
    clearLogs();
    simulateState({
      connected: true,
      running: true,
      status: 'Takeout finished',
      event: 'Reset',
      numThrows: 0,
      throws: [],
    });
  }, [clearLogs, simulateState]);

  const handleSelectGame = (gameId: string) => {
    if (gameId === 'x01') {
      setCurrentView('x01-rules');
    } else {
      // Other games not implemented yet - just show generic game
      setCurrentView('game');
      handleReset();
    }
  };

  const handleStartX01 = (settings: X01Settings) => {
    setX01Settings(settings);
    setCurrentView('x01-game');
    handleReset();
  };

  // Check if we should show player list (only in generic game view, not X01 which shows inline)
  const showPlayerList = currentView === 'game';

  const renderMainContent = () => {
    switch (currentView) {
      case 'game-selector':
        return (
          <GameSelector
            onSelectGame={handleSelectGame}
            onBack={() => setCurrentView('game')}
          />
        );
      case 'x01-rules':
        return (
          <X01Rules
            onStartGame={handleStartX01}
            onBack={() => setCurrentView('game-selector')}
          />
        );
      case 'x01-game':
        return (
          <X01Game
            key={gameKey}
            state={latestState}
            settings={x01Settings}
            players={activePlayers}
            onPlayAgain={() => {
              handleReset();
              setCurrentView('x01-rules');
            }}
          />
        );
      default:
        return <AutodartsGame key={gameKey} state={latestState} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-black text-white flex font-mono overflow-hidden">

      {/* Console Panel - only shown when toggled */}
      {showConsole && (
        <div className="w-1/2 h-full">
          <ConsoleLog logs={logs} onClear={clearLogs} />
        </div>
      )}

      {/* Main Panel */}
      <div className={`${showConsole ? 'w-1/2' : 'w-full'} h-full flex flex-col relative`}>
        {/* Status indicator - top left */}
        <div className="absolute top-4 left-4 z-10">
          <div className="px-2 py-1 rounded bg-zinc-800 text-sm">
            {getStatusEmoji(latestState?.status || '')}
            <span className="text-zinc-500 text-[10px] ml-1.5">{latestState?.status || 'Waiting'}</span>
          </div>
        </div>

        {/* Top bar - right */}
        <div className="absolute top-4 right-4 flex items-center gap-2 text-xs z-10">
          {/* Games Button */}
          <button
            onClick={() => setCurrentView('game-selector')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded ${currentView === 'game-selector' || currentView === 'x01-rules'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
          >
            <List className="w-3 h-3" />
            <span>Games</span>
          </button>

          {/* Players Button */}
          <button
            onClick={() => setShowPlayerConfig(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          >
            <Users className="w-3 h-3" />
            <span>Players</span>
          </button>

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

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Player List - shown above game content */}
          {showPlayerList && activePlayers.length > 0 && (
            <PlayerList players={activePlayers} />
          )}
          {renderMainContent()}
        </div>
      </div>

      {/* Simulator Panel */}
      {showSimulator && (
        <SimulatorPanel
          currentState={latestState}
          onSimulateThrow={simulateState}
          onClose={() => setShowSimulator(false)}
        />
      )}

      {/* Player Config Modal */}
      {showPlayerConfig && (
        <PlayerConfig
          players={players}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
          onUpdateName={updatePlayerName}
          onUpdatePhoto={updatePlayerPhoto}
          onToggleActive={togglePlayerActive}
          onClose={() => setShowPlayerConfig(false)}
        />
      )}
    </div>
  )
}

export default App
