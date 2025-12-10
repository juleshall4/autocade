import { useState, useCallback, useEffect } from 'react';
import { useAutodarts } from './hooks/use-autodarts';
import { usePlayers } from './hooks/use-players';
import { AutodartsGame } from './components/autodarts-game';
import { ConsoleLog } from './components/console-log';
import { SimulatorPanel } from './components/simulator-panel';
import { GameSelector } from './components/game-selector';
import { X01Rules, type X01Settings } from './components/x01-rules';
import { X01Game } from './components/x01-game';
import { PlayerConfigContent } from './components/player-config';
import { PlayerList } from './components/player-list';
import { SettingsContent, type AppearanceSettings, THEMES } from './components/settings';
import { Popover } from './components/popover';
import { IpSetup } from './components/ip-setup';
import { getStatusEmoji } from './types/autodarts';
import { Wifi, WifiOff, Gamepad2, Terminal, RotateCcw, Users, Settings as SettingsIcon, Maximize, Minimize, Globe } from 'lucide-react';
import autodartsLogo from './assets/autodartgrey.png';

type AppView = 'game' | 'game-selector' | 'x01-rules' | 'x01-game';

function App() {
  const { isConnected, latestState, logs, clearLogs, simulateState } = useAutodarts();
  const { players, activePlayers, addPlayer, removePlayer, updatePlayerName, updatePlayerPhoto, updateVictoryVideo, togglePlayerActive, reorderPlayers } = usePlayers();

  // Check if IP is configured in localStorage
  const [hasIpConfigured, setHasIpConfigured] = useState(() => {
    return !!localStorage.getItem('autodartsIP');
  });
  const [showIpSetupPreview, setShowIpSetupPreview] = useState(false);

  const [showSimulator, setShowSimulator] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [showPlayerConfig, setShowPlayerConfig] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [currentView, setCurrentView] = useState<AppView>('game-selector');
  const [x01Settings, setX01Settings] = useState<X01Settings>({
    baseScore: 501,
    inMode: 'single',
    outMode: 'double',
    matchMode: 'off',
    legsToWin: 3,
    setsToWin: 3,
    startingOrder: 'random',
  });

  // Load appearance settings from localStorage
  const loadAppearanceSettings = (): AppearanceSettings => {
    try {
      const saved = localStorage.getItem('autocade-appearance');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load appearance settings:', e);
    }
    return { showConnectionStatus: true, showBoardStatus: true, showDevTools: true, theme: 'midnight' };
  };

  const [appearance, setAppearance] = useState<AppearanceSettings>(loadAppearanceSettings);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Save appearance settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('autocade-appearance', JSON.stringify(appearance));
    } catch (e) {
      console.error('Failed to save appearance settings:', e);
    }
  }, [appearance]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

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

  // Check if we should show player list (only in generic game view, not X01 which shows inline)
  const showPlayerList = currentView === 'game';

  const renderMainContent = () => {
    const currentTheme = THEMES.find(t => t.id === appearance.theme);

    switch (currentView) {
      case 'game-selector':
        return (
          <GameSelector
            onSelectGame={handleSelectGame}
          />
        );
      case 'x01-rules':
        return (
          <X01Rules
            onNext={(settings) => {
              setX01Settings(settings);
              handleReset();
              setCurrentView('x01-game');
            }}
            onBack={() => setCurrentView('game-selector')}
            accentClass={currentTheme?.accent}
            accentBorderClass={currentTheme?.accentBorder}
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
            onLegStart={() => {
              simulateState({
                connected: true,
                running: true,
                status: 'Takeout finished',
                event: 'Reset',
                numThrows: 0,
                throws: [],
              });
            }}
            themeGlow={currentTheme?.glow}
          />
        );
      default:
        return <AutodartsGame key={gameKey} state={latestState} />;
    }
  };

  // Get the current theme's gradient class
  const themeGradient = THEMES.find(t => t.id === appearance.theme)?.gradient || 'bg-black';

  // Handle IP setup completion
  const handleIpSetupComplete = (ipAddress: string) => {
    console.log('IP configured:', ipAddress);
    setHasIpConfigured(true);
    setShowIpSetupPreview(false);
    // TODO: Reconnect WebSocket with new IP
  };

  // Show IP setup page if not configured or preview mode
  if (!hasIpConfigured || showIpSetupPreview) {
    return (
      <IpSetup onComplete={handleIpSetupComplete} />
    );
  }

  return (
    <div className={`h-screen w-screen ${themeGradient} text-white flex overflow-hidden`}>

      {/* Console Panel - only shown when toggled */}
      {showConsole && (
        <div className="w-1/2 h-full">
          <ConsoleLog logs={logs} onClear={clearLogs} />
        </div>
      )}

      {/* Main Panel */}
      <div className={`${showConsole ? 'w-1/2' : 'w-full'} h-full flex flex-col relative`}>

        {/* Status indicator - below logo */}
        <div className="absolute top-12 left-4 z-10 flex items-center gap-2 text-xs">
          {/* Connection Status */}
          {appearance.showConnectionStatus && (
            <div className="px-2 py-1 rounded bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
              {isConnected ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
              <span className="text-zinc-300">{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
          )}
          {/* Event Status */}
          {appearance.showBoardStatus && (
            <div className="px-2 py-1 rounded bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
              {getStatusEmoji(latestState?.status || '')}
              <span className="text-zinc-300">{latestState?.status || 'Waiting'}</span>
            </div>
          )}
        </div>

        {/* Top bar - right: icon buttons with tooltips */}
        <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
          {/* Fullscreen */}
          <div className="relative group">
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-zinc-300 hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs bg-black/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </span>
          </div>

          {/* Players Popover - hidden during active game */}
          {currentView !== 'x01-game' && (
            <Popover
              isOpen={showPlayerConfig}
              onClose={() => setShowPlayerConfig(false)}
              align="right"
              trigger={
                <div className="relative group">
                  <button
                    onClick={() => setShowPlayerConfig(!showPlayerConfig)}
                    className="p-2.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-zinc-300 hover:bg-white/20 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                  <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs bg-black/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Players
                  </span>
                </div>
              }
            >
              <PlayerConfigContent
                players={players}
                onAddPlayer={addPlayer}
                onRemovePlayer={removePlayer}
                onUpdateName={updatePlayerName}
                onUpdatePhoto={updatePlayerPhoto}
                onUpdateVictoryVideo={updateVictoryVideo}
                onToggleActive={togglePlayerActive}
                onReorderPlayers={reorderPlayers}
              />
            </Popover>
          )}

          {/* Quit Button - only during active game */}
          {currentView === 'x01-game' && (
            <button
              onClick={() => {
                if (showQuitConfirm) {
                  setCurrentView('game-selector');
                  setShowQuitConfirm(false);
                } else {
                  setShowQuitConfirm(true);
                }
              }}
              onBlur={() => setTimeout(() => setShowQuitConfirm(false), 200)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg backdrop-blur-md border bg-red-500/80 border-red-400/50 text-white hover:bg-red-600/80 transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-5 h-5" />
              <span>{showQuitConfirm ? 'Confirm?' : 'Quit'}</span>
            </button>
          )}

          {/* Settings Popover */}
          <Popover
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            align="right"
            trigger={
              <div className="relative group">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-zinc-300 hover:bg-white/20 transition-colors"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs bg-black/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Settings
                </span>
              </div>
            }
          >
            <SettingsContent
              appearance={appearance}
              onAppearanceChange={setAppearance}
            />
          </Popover>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Player List - shown above game content */}
          {showPlayerList && activePlayers.length > 0 && (
            <PlayerList players={activePlayers} />
          )}
          {renderMainContent()}
        </div>

        {/* Powered by Autodarts */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-30">
          <img src={autodartsLogo} alt="Autodarts" className="h-4" />
          <span className="text-xs text-[#A9A9A9]">Powered by Autodarts</span>
        </div>

        {/* Dev Controls - Bottom Left */}
        {appearance.showDevTools && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <button
              onClick={() => setShowConsole(!showConsole)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs backdrop-blur-md border transition-colors ${showConsole ? 'bg-green-500/80 border-green-400/50 text-white' : 'bg-white/10 border-white/10 text-zinc-300 hover:bg-white/20'
                }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Dev</span>
            </button>
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs backdrop-blur-md border transition-colors ${showSimulator ? 'bg-purple-500/80 border-purple-400/50 text-white' : 'bg-white/10 border-white/10 text-zinc-300 hover:bg-white/20'
                }`}
            >
              <Gamepad2 className="w-3 h-3" />
              <span>Sim</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-white/10 backdrop-blur-md border border-white/10 text-zinc-300 hover:bg-red-500/50 hover:border-red-400/50 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => setShowIpSetupPreview(true)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-white/10 backdrop-blur-md border border-white/10 text-zinc-300 hover:bg-white/20 transition-colors"
            >
              <Globe className="w-3 h-3" />
              <span>IP</span>
            </button>
          </div>
        )}
      </div>

      {/* Simulator Panel */}
      {
        showSimulator && (
          <SimulatorPanel
            currentState={latestState}
            onSimulateThrow={simulateState}
            onClose={() => setShowSimulator(false)}
          />
        )
      }






    </div>
  );
}

export default App;
