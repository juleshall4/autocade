import { useState, useCallback, useEffect } from 'react';
import { useAutodarts } from './hooks/use-autodarts';
import { usePlayers } from './hooks/use-players';
import { AutodartsGame } from './components/autodarts-game';
import { GameSelector } from './components/game-selector';
import { X01Rules, type X01Settings } from './components/x01-rules';
import { X01Game } from './components/x01-game';
import { AroundTheClockRules, type AroundTheClockSettings } from './components/around-the-clock-rules';
import { AroundTheClockGame } from './components/around-the-clock-game';
import { KillerRules, type KillerSettings } from './components/killer-rules';
import { KillerGame } from './components/killer-game';
import { PlayerConfigContent } from './components/player-config';
import { PlayerList } from './components/player-list';
import { SettingsContent, type AppearanceSettings, THEMES } from './components/settings';
import { Popover } from './components/popover';
import { IpSetup } from './components/ip-setup';
import { getStatusEmoji } from './types/autodarts';
import { Wifi, WifiOff, RotateCcw, Settings as SettingsIcon, Maximize, Minimize } from 'lucide-react';
import { ManualEntryDrawer } from './components/manual-entry-drawer';
import autodartsLogo from './assets/autodartgrey.png';

type AppView = 'game' | 'game-selector' | 'x01-rules' | 'x01-game' | 'atc-rules' | 'atc-game' | 'killer-rules' | 'killer-game';

function App() {
  const { isConnected, latestState, simulateState } = useAutodarts();
  const { players, activePlayers, addPlayer, removePlayer, updatePlayerName, updatePlayerPhoto, updateVictoryVideo, togglePlayerActive, reorderPlayers } = usePlayers();

  // Check if IP is configured in localStorage
  const [hasIpConfigured, setHasIpConfigured] = useState(() => {
    return !!localStorage.getItem('autodartsIP');
  });
  const [showIpSetupPreview, setShowIpSetupPreview] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [currentView, setCurrentView] = useState<AppView>('game-selector');
  const [gameMode, setGameMode] = useState<'quick-play' | 'tournament'>(() => {
    return (localStorage.getItem('autocade-gameMode') as 'quick-play' | 'tournament') || 'quick-play';
  });

  // Persist game mode
  useEffect(() => {
    localStorage.setItem('autocade-gameMode', gameMode);
  }, [gameMode]);

  const [x01Settings, setX01Settings] = useState<X01Settings>({
    baseScore: 501,
    inMode: 'single',
    outMode: 'double',
    matchMode: 'off',
    legsToWin: 3,
    setsToWin: 3,
    startingOrder: 'random',
  });
  const [atcSettings, setAtcSettings] = useState<AroundTheClockSettings>({
    mode: 'full',
    order: '1-20-bull',
    multiplier: false,
    hitsRequired: 1,
    bullMode: 'both',
    startingOrder: 'listed',
  });
  const [killerSettings, setKillerSettings] = useState<KillerSettings>({
    startingLives: 3,
    activationZone: 'full',
    killZone: 'full',
    multiplier: false,
    suicide: false,
    startingOrder: 'listed',
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
    return { showConnectionStatus: true, showBoardStatus: true, theme: 'midnight', gameViewScale: 130 };
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
    // clearLogs(); // Logs removed
    simulateState({
      connected: true,
      running: true,
      status: 'Takeout finished',
      event: 'Reset',
      numThrows: 0,
      throws: [],
    });
  }, [simulateState]);

  // Players for the current game instance (ordered)
  const [gamePlayers, setGamePlayers] = useState<any[]>([]);

  const handleStartGame = (gameId: 'x01' | 'around-the-clock' | 'killer' | string) => {
    let orderedPlayers = [...activePlayers];
    let startingOrder = 'listed';

    if (gameId === 'x01') {
      startingOrder = x01Settings.startingOrder;
    } else if (gameId === 'around-the-clock') {
      startingOrder = atcSettings.startingOrder;
    } else if (gameId === 'killer') {
      startingOrder = killerSettings.startingOrder;
    }

    if (startingOrder === 'random') {
      // Fisher-Yates shuffle
      for (let i = orderedPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedPlayers[i], orderedPlayers[j]] = [orderedPlayers[j], orderedPlayers[i]];
      }
    }

    // TODO: Implement 'bull-off' logic later

    setGamePlayers(orderedPlayers);
    handleReset();

    if (gameId === 'x01') {
      setCurrentView('x01-game');
    } else if (gameId === 'around-the-clock') {
      setCurrentView('atc-game');
    } else if (gameId === 'killer') {
      setCurrentView('killer-game');
    } else {
      setCurrentView('game');
    }
  };

  const handleSelectGame = (gameId: string, mode: 'quick-play' | 'tournament') => {
    // TODO: Handle tournament mode differently
    console.log(`Selected game: ${gameId}, mode: ${mode}`);
    // Store the selected mode
    setGameMode(mode);

    if (gameId === 'x01') {
      setCurrentView('x01-rules');
    } else if (gameId === 'around-the-clock') {
      setCurrentView('atc-rules');
    } else if (gameId === 'killer') {
      setCurrentView('killer-rules');
    } else {
      // Other games not implemented yet - just show generic game
      setGamePlayers(activePlayers); // Default to generic active players for others
      setCurrentView('game');
      handleReset();
    }
  };

  // Check if we should show player list (only in generic game view, not X01 which shows inline)
  const showPlayerList = currentView === 'game';

  const renderMainContent = () => {
    const currentTheme = THEMES.find((t: any) => t.id === appearance.theme);

    switch (currentView) {
      case 'game-selector':
        return (
          <GameSelector
            onSelectGame={handleSelectGame}
            initialGameMode={gameMode}
            onGameModeChange={setGameMode}
          />
        );
      case 'x01-rules':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-stretch gap-6">
              <X01Rules
                onSettingsChange={setX01Settings}
                initialSettings={x01Settings}
                accentClass={currentTheme?.accent}
                accentBorderClass={currentTheme?.accentBorder}
              />
              <div className="shrink-0 min-w-80 flex flex-col p-8 bg-white/5 border border-white/10 rounded-xl overflow-hidden">

                {/* Starting Order */}
                <div className="mb-6 shrink-0" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out 0.1s forwards' }}>
                  <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                    Starting Order
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setX01Settings({ ...x01Settings, startingOrder: 'listed' })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${x01Settings.startingOrder === 'listed'
                        ? 'bg-blue-500/80 border-blue-400/50 text-white'
                        : 'bg-white/10 border-white/10 text-zinc-400 hover:bg-white/20'
                        }`}
                    >
                      Listed
                    </button>
                    <button
                      onClick={() => setX01Settings({ ...x01Settings, startingOrder: 'random' })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${x01Settings.startingOrder === 'random'
                        ? 'bg-blue-500/80 border-blue-400/50 text-white'
                        : 'bg-white/10 border-white/10 text-zinc-400 hover:bg-white/20'
                        }`}
                    >
                      Random
                    </button>
                    {/* Bull Off - disabled for now */}
                    {/*
                    <button
                      onClick={() => setX01Settings({ ...x01Settings, startingOrder: 'bull-off' })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${x01Settings.startingOrder === 'bull-off'
                        ? 'bg-blue-500/80 border-blue-400/50 text-white'
                        : 'bg-white/10 border-white/10 text-zinc-400 hover:bg-white/20'
                        }`}
                    >
                      Bull Off
                    </button>
                    */}
                  </div>
                </div>
                <div className="flex-1 relative min-h-0">
                  <div className="absolute inset-0 overflow-y-auto">
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
                  </div>
                </div>
              </div>
            </div>
            {/* Back / Start buttons */}
            <div className="flex w-full justify-between gap-4">
              <button
                onClick={() => setCurrentView('game-selector')}
                className="px-6 py-3 text-sm text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/10"
              >
                ← Back
              </button>
              <button
                onClick={() => handleStartGame('x01')}
                className={`px-6 py-3 ${currentTheme?.accent || 'bg-blue-500/80'} ${currentTheme?.accentBorder || 'border-blue-400/50'} text-white font-bold rounded-lg hover:brightness-110 transition-all text-sm backdrop-blur-md border`}
              >
                {gameMode === 'quick-play' ? 'Start Quick Play' : 'Start Tournament'}
              </button>
            </div>
          </div>
        );
      case 'x01-game':
        return (
          <X01Game
            key={gameKey}
            state={latestState}
            settings={x01Settings}
            players={gamePlayers}
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
            gameViewScale={appearance.gameViewScale}
          />
        );
      case 'atc-rules':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-stretch gap-6">
              <AroundTheClockRules
                onSettingsChange={setAtcSettings}
                initialSettings={atcSettings}
                gameMode={gameMode}
                accentClass={currentTheme?.accent}
                accentBorderClass={currentTheme?.accentBorder}
              />
              <div className="shrink-0 min-w-80 flex flex-col p-8 bg-white/5 border border-white/10 rounded-xl overflow-hidden">

                {/* Starting Order */}
                <div className="mb-6 shrink-0" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out 0.1s forwards' }}>
                  <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                    Starting Order
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAtcSettings({ ...atcSettings, startingOrder: 'listed' })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${atcSettings.startingOrder === 'listed'
                        ? 'bg-blue-500/80 border-blue-400/50 text-white'
                        : 'bg-white/10 border-white/10 text-zinc-400 hover:bg-white/20'
                        }`}
                    >
                      Listed
                    </button>
                    <button
                      onClick={() => setAtcSettings({ ...atcSettings, startingOrder: 'random' })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${atcSettings.startingOrder === 'random'
                        ? 'bg-blue-500/80 border-blue-400/50 text-white'
                        : 'bg-white/10 border-white/10 text-zinc-400 hover:bg-white/20'
                        }`}
                    >
                      Random
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative min-h-0">
                  <div className="absolute inset-0 overflow-y-auto">
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
                  </div>
                </div>
              </div>
            </div>
            {/* Back / Start buttons */}
            <div className="flex w-full justify-between gap-4">
              <button
                onClick={() => setCurrentView('game-selector')}
                className="px-6 py-3 text-sm text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/10"
              >
                ← Back
              </button>
              <button
                onClick={() => handleStartGame('around-the-clock')}
                className={`px-6 py-3 ${currentTheme?.accent || 'bg-blue-500/80'} ${currentTheme?.accentBorder || 'border-blue-400/50'} text-white font-bold rounded-lg hover:brightness-110 transition-all text-sm backdrop-blur-md border`}
              >
                {gameMode === 'quick-play' ? 'Start Quick Play' : 'Start Tournament'}
              </button>
            </div>
          </div>
        );
      case 'atc-game':
        return (
          <AroundTheClockGame
            key={gameKey}
            state={latestState}
            settings={atcSettings}
            players={gamePlayers}
            onPlayAgain={() => {
              handleReset();
              setCurrentView('atc-rules');
            }}
            themeGlow={currentTheme?.glow}
            gameViewScale={appearance.gameViewScale}
          />
        );
      case 'killer-rules':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-stretch gap-6">
              <KillerRules
                onSettingsChange={setKillerSettings}
                initialSettings={killerSettings}
                accentClass={currentTheme?.accent}
                accentBorderClass={currentTheme?.accentBorder}
              />
              <div className="shrink-0 min-w-80 flex flex-col p-8 bg-white/5 border border-white/10 rounded-xl overflow-hidden">

                {/* Starting Order */}
                <div className="mb-6 shrink-0" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out 0.1s forwards' }}>
                  <label className="text-zinc-500 uppercase tracking-widest text-xs block mb-2">
                    Starting Order
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setKillerSettings({ ...killerSettings, startingOrder: 'listed' })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${killerSettings.startingOrder === 'listed'
                        ? 'bg-blue-500/80 border-blue-400/50 text-white'
                        : 'bg-white/10 border-white/10 text-zinc-400 hover:bg-white/20'
                        }`}
                    >
                      Listed
                    </button>
                    <button
                      onClick={() => setKillerSettings({ ...killerSettings, startingOrder: 'random' })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${killerSettings.startingOrder === 'random'
                        ? 'bg-blue-500/80 border-blue-400/50 text-white'
                        : 'bg-white/10 border-white/10 text-zinc-400 hover:bg-white/20'
                        }`}
                    >
                      Random
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative min-h-0">
                  <div className="absolute inset-0 overflow-y-auto">
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
                  </div>
                </div>
              </div>
            </div>
            {/* Back / Start buttons */}
            <div className="flex w-full justify-between gap-4">
              <button
                onClick={() => setCurrentView('game-selector')}
                className="px-6 py-3 text-sm text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/10"
              >
                ← Back
              </button>
              <button
                onClick={() => handleStartGame('killer')}
                className={`px-6 py-3 ${currentTheme?.accent || 'bg-blue-500/80'} ${currentTheme?.accentBorder || 'border-blue-400/50'} text-white font-bold rounded-lg hover:brightness-110 transition-all text-sm backdrop-blur-md border`}
              >
                {gameMode === 'quick-play' ? 'Start Quick Play' : 'Start Tournament'}
              </button>
            </div>
          </div>
        );
      case 'killer-game':
        return (
          <KillerGame
            key={gameKey}
            state={latestState}
            settings={killerSettings}
            players={gamePlayers}
            onPlayAgain={() => {
              handleReset();
              setCurrentView('killer-rules');
            }}
            gameViewScale={appearance.gameViewScale}
          />
        );
      default:
        return <AutodartsGame key={gameKey} state={latestState} />;
    }
  };

  // Get the current theme's gradient class
  const themeGradient = THEMES.find((t: any) => t.id === appearance.theme)?.gradient || 'bg-black';

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

      {/* Main Panel */}
      <div className="w-full h-full flex flex-col relative">

        {/* Status indicator - top left */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
          {/* Connection Status */}
          {appearance.showConnectionStatus && (
            <div className="relative group">
              <div className="p-2.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
                {isConnected ? <Wifi className="w-5 h-5 text-green-400" /> : <WifiOff className="w-5 h-5 text-red-400" />}
              </div>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs bg-black/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          )}
          {/* Board Status */}
          {appearance.showBoardStatus && (
            <div className="relative group">
              <div className="w-10.5 h-10.5 flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-lg leading-none">
                {getStatusEmoji(latestState?.status || '')}
              </div>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs bg-black/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {latestState?.status || 'Waiting'}
              </span>
            </div>
          )}
        </div>

        {/* Top bar - right: icon buttons with tooltips */}
        <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
          {/* Quit Button - only during active game */}
          {(currentView === 'x01-game' || currentView === 'atc-game' || currentView === 'killer-game') && (
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
              <span>{showQuitConfirm ? 'Confirm?' : 'Abort'}</span>
            </button>
          )}

          {/* Fullscreen */}
          <div className="relative group">
            <button
              onClick={toggleFullscreen}
              className="btn-scale-lg p-2.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-zinc-300 hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs bg-black/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </span>
          </div>

          {/* Settings Popover */}
          <Popover
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            align="right"
            trigger={
              <div className="relative group">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="btn-scale-lg p-2.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-zinc-300 hover:bg-white/20 transition-colors"
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

        {/* Powered by Autodarts - bottom left */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-50">
          <img src={autodartsLogo} alt="Autodarts" className="h-4" />
          <span className="text-xs text-[#A9A9A9]">Powered by Autodarts</span>
        </div>


      </div>

      {/* Manual Entry Drawer - only during active games */}
      {(currentView === 'x01-game' || currentView === 'atc-game' || currentView === 'killer-game') && (
        <ManualEntryDrawer
          currentState={latestState}
          onSimulateThrow={simulateState}
        />
      )}






    </div>
  );
}

export default App;
