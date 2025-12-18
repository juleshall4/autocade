import { useState, useEffect, useRef, useCallback } from 'react';
import type { AutodartsState } from '../types/autodarts';
import type { Player } from '../types/player';
import { Dartboard } from './Dartboard';
import { VictoryOverlay } from './victory-overlay';
import {
    type RouletteState,
    type RouletteSettings,
    initializeRoulette,
    spinRoulette,
    startAimPhase,
    judgeThrow,
    nextRound,
    getCurrentShooter,
    getCurrentVictim,
} from '../logic/dart-roulette';
import { wled } from '../services/wled';
import { Target, Beer, PartyPopper, Trophy } from 'lucide-react';

interface DartRouletteGameProps {
    state: AutodartsState | null;
    players: Player[];
    settings: RouletteSettings;
    onPlayAgain: () => void;
    gameViewScale?: number;
    themeGlow?: string;
}

const SPIN_DURATION = 6000; // 3 seconds spin animation + 3 seconds to view result
const RESULT_DURATION = 4000; // 4 seconds to show result
const VIDEO_BONUS_DURATION = 3000; // Extra 3 seconds when showing shooter video

export function DartRouletteGame({
    state,
    players,
    settings,
    onPlayAgain,
    gameViewScale = 100,
    themeGlow
}: DartRouletteGameProps) {
    const [gameState, setGameState] = useState<RouletteState>(() =>
        initializeRoulette(players)
    );

    // Spin animation states
    const [spinAnimation, setSpinAnimation] = useState<{
        number: number;
        shooterName: string;
        victimName: string;
    } | null>(null);
    const [spinningNumber, setSpinningNumber] = useState<number>(1);
    const [spinningShooter, setSpinningShooter] = useState<string>('');
    const [spinningVictim, setSpinningVictim] = useState<string>('');
    const [spinPhase, setSpinPhase] = useState<'shooter' | 'victim' | 'number' | 'done'>('shooter');
    const [showingVideo, setShowingVideo] = useState(false);

    const lastThrowCountRef = useRef(0);
    const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const spinIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Slot machine cycling effect for all three elements
    useEffect(() => {
        if (!spinAnimation) {
            setSpinPhase('shooter');
            return;
        }

        const playerNames = players.map(p => p.name);
        let currentPhase: 'shooter' | 'victim' | 'number' | 'done' = 'shooter';
        let elapsed = 0;
        let speed = 60;
        let cycleIndex = 0;

        const runCycle = () => {
            elapsed += speed;
            cycleIndex++;

            if (currentPhase === 'shooter') {
                // Cycle through player names
                setSpinningShooter(playerNames[cycleIndex % playerNames.length]);

                if (elapsed > 800) {
                    setSpinningShooter(spinAnimation.shooterName);
                    currentPhase = 'victim';
                    setSpinPhase('victim');
                    elapsed = 0;
                    speed = 60;
                }
            } else if (currentPhase === 'victim') {
                // Cycle through victim names
                const victimNames = playerNames.filter(n => n !== spinAnimation.shooterName);
                setSpinningVictim(victimNames[cycleIndex % Math.max(victimNames.length, 1)] || spinAnimation.victimName);

                if (elapsed > 800) {
                    setSpinningVictim(spinAnimation.victimName);
                    currentPhase = 'number';
                    setSpinPhase('number');
                    elapsed = 0;
                    speed = 50;
                }
            } else if (currentPhase === 'number') {
                // Cycle through numbers
                setSpinningNumber(prev => (prev % 20) + 1);

                // Slow down
                if (elapsed > 1500) speed = 150;
                else if (elapsed > 1000) speed = 100;

                if (elapsed > 2000) {
                    setSpinningNumber(spinAnimation.number);
                    currentPhase = 'done';
                    setSpinPhase('done');
                    return;
                }
            } else {
                return;
            }

            spinIntervalRef.current = setTimeout(runCycle, speed);
        };

        runCycle();

        return () => {
            if (spinIntervalRef.current) {
                clearTimeout(spinIntervalRef.current);
            }
        };
    }, [spinAnimation, players]); // Removed spinPhase from dependencies

    // Auto-start spin on mount (skip lobby phase)
    useEffect(() => {
        if (gameState.phase === 'lobby' && !spinAnimation) {
            handleStartSpin();
        }
    }, []); // Only run once on mount

    // Handle start spin
    const handleStartSpin = useCallback(() => {
        const newState = spinRoulette(gameState);
        setGameState(newState);

        const shooter = newState.players[newState.shooterIndex];
        const victim = newState.players.find(p => p.id === newState.victimId);

        setSpinAnimation({
            number: newState.targetNumber!,
            shooterName: shooter.name,
            victimName: victim?.name || ''
        });
        setSpinPhase('shooter');

        // After spin animation, transition to aim phase
        setTimeout(() => {
            setSpinAnimation(null);
            setGameState(prev => startAimPhase(prev));
        }, SPIN_DURATION);
    }, [gameState]);

    // Handle dart detection
    useEffect(() => {
        if (!state || gameState.phase !== 'aim' || gameState.winnerId) return;

        const currentThrows = state.throws || [];
        const currentCount = currentThrows.length;

        if (currentCount > lastThrowCountRef.current) {
            const dart = currentThrows[currentCount - 1];
            const segment = dart.segment;

            const newState = judgeThrow(gameState, {
                number: segment.number,
                multiplier: segment.multiplier,
            }, settings);
            setGameState(newState);

            // Trigger WLED events and sounds based on result
            if (newState.winnerId) {
                wled.rouletteWin();
            } else if (newState.lastResult?.isBackfire) {
                wled.rouletteMiss();
                // Play random miss sound (miss1-4.mp3)
                const missNum = Math.floor(Math.random() * 4) + 1; // 1-4
                new Audio(`/sounds/Northern_Terry/roulette/miss${missNum}.mp3`).play().catch(() => { });
            } else if (!newState.lastResult?.isJailbreak) {
                // Hit (single, double, triple)
                wled.rouletteHit();
                new Audio('/sounds/Northern_Terry/roulette/hit.mp3').play().catch(() => { });
            }

            // If no winner, auto-advance after result duration
            // Show video first if shooter has one, then results
            if (!newState.winnerId) {
                const shooter = newState.players[newState.shooterIndex];
                const shooterPlayer = players.find(p => p.id === shooter.id);
                const hasHitVideo = !newState.lastResult?.isBackfire && !newState.lastResult?.isJailbreak && shooterPlayer?.victoryVideo;

                if (hasHitVideo) {
                    // Show video first for 3 seconds
                    setShowingVideo(true);
                    setTimeout(() => {
                        setShowingVideo(false);
                        // Then show results for normal duration, then advance
                        resultTimeoutRef.current = setTimeout(() => {
                            setGameState(prev => {
                                const advanced = nextRound(prev);
                                const spun = spinRoulette(advanced);

                                const shooter = spun.players[spun.shooterIndex];
                                const victim = spun.players.find(p => p.id === spun.victimId);

                                setSpinAnimation({
                                    number: spun.targetNumber!,
                                    shooterName: shooter.name,
                                    victimName: victim?.name || ''
                                });
                                setSpinPhase('shooter');

                                setTimeout(() => {
                                    setSpinAnimation(null);
                                    setGameState(p => startAimPhase(p));
                                }, SPIN_DURATION);

                                return spun;
                            });
                        }, RESULT_DURATION);
                    }, VIDEO_BONUS_DURATION);
                } else {
                    // No video, just show results then advance
                    resultTimeoutRef.current = setTimeout(() => {
                        setGameState(prev => {
                            const advanced = nextRound(prev);
                            const spun = spinRoulette(advanced);

                            const shooter = spun.players[spun.shooterIndex];
                            const victim = spun.players.find(p => p.id === spun.victimId);

                            setSpinAnimation({
                                number: spun.targetNumber!,
                                shooterName: shooter.name,
                                victimName: victim?.name || ''
                            });
                            setSpinPhase('shooter');

                            setTimeout(() => {
                                setSpinAnimation(null);
                                setGameState(p => startAimPhase(p));
                            }, SPIN_DURATION);

                            return spun;
                        });
                    }, RESULT_DURATION);
                }
            }
        }

        lastThrowCountRef.current = currentCount;
    }, [state, gameState]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
            if (spinIntervalRef.current) clearTimeout(spinIntervalRef.current);
        };
    }, []);

    const shooter = getCurrentShooter(gameState);
    const victim = getCurrentVictim(gameState);
    const shooterPlayer = players.find(p => p.id === shooter?.id);
    const victimPlayer = victim ? players.find(p => p.id === victim.id) : null;

    // Victory screen
    if (gameState.winnerId) {
        const winner = players.find(p => p.id === gameState.winnerId);
        if (winner) {
            return (
                <VictoryOverlay
                    winner={winner}
                    onComplete={onPlayAgain}
                />
            );
        }
    }

    // Player list component (used in multiple phases)
    const PlayerList = () => (
        <div className="flex flex-col gap-2 min-w-[250px]">
            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Leaderboard</div>
            {[...gameState.players].sort((a, b) => b.score - a.score).map((p, idx) => {
                const realPlayer = players.find(rp => rp.id === p.id);
                const isShooter = p.id === shooter?.id;
                const isVictim = p.id === victim?.id;

                return (
                    <div
                        key={p.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all border ${isShooter
                            ? 'bg-amber-500/20 border-amber-500/50 text-white'
                            : isVictim
                                ? 'bg-red-500/20 border-red-500/50 text-white'
                                : 'bg-white/5 border-white/10 text-zinc-400'
                            }`}
                    >
                        {/* Rank */}
                        <div className="w-6 text-center font-bold text-lg">
                            {idx === 0 && p.score > 0 ? <Trophy className="w-5 h-5 text-amber-400" /> : idx + 1}
                        </div>

                        {/* Photo */}
                        <div className="w-10 h-10 rounded-full bg-zinc-700/50 overflow-hidden shrink-0">
                            {realPlayer?.photo ? (
                                <img src={realPlayer.photo} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-bold opacity-50">
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Name and role */}
                        <div className="flex-1">
                            <div className="font-bold text-sm">{p.name}</div>
                            {isShooter && <div className="text-xs text-amber-400">Shooter</div>}
                            {isVictim && <div className="text-xs text-red-400">Target</div>}
                        </div>

                        {/* Score */}
                        <div className="text-xl font-bold font-mono">
                            {p.score}<span className="text-xs text-zinc-500">/10</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    // Lobby Phase
    if (gameState.phase === 'lobby') {
        return (
            <div className="h-full w-full flex items-center justify-center gap-12 p-8">
                <div className="flex flex-col items-center gap-6">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🎯🍺</div>
                        <h1 className="text-4xl font-bold text-white mb-2">Dart Roulette</h1>
                        <p className="text-xl text-zinc-400">First to 10 points wins!</p>
                    </div>

                    <button
                        onClick={handleStartSpin}
                        className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xl font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-amber-500/30"
                    >
                        <span className="flex items-center gap-3">
                            <Target className="w-6 h-6" />
                            Spin the Roulette!
                        </span>
                    </button>
                </div>

                <PlayerList />
            </div>
        );
    }

    // Spin Animation Phase
    if (spinAnimation) {
        return (
            <div className="h-full w-full flex items-center justify-center gap-12 p-8">
                <div className="flex flex-col items-center gap-8">
                    {/* Shooter spin */}
                    <div className={`text-center transition-all duration-300 ${spinPhase !== 'shooter' ? 'opacity-100' : 'opacity-70'}`}>
                        <div className="text-sm text-zinc-500 uppercase tracking-widest mb-2">Shooter</div>
                        <div className={`text-3xl font-bold transition-all ${spinPhase === 'shooter' ? 'text-zinc-400 blur-[1px]' : 'text-amber-400'
                            }`}>
                            {spinningShooter || players[0]?.name}
                        </div>
                    </div>

                    {/* Victim spin */}
                    <div className={`text-center transition-all duration-300 ${spinPhase === 'shooter' ? 'opacity-30' : spinPhase === 'victim' ? 'opacity-70' : 'opacity-100'
                        }`}>
                        <div className="text-sm text-zinc-500 uppercase tracking-widest mb-2">vs</div>
                        <div className={`text-3xl font-bold transition-all ${spinPhase === 'victim' ? 'text-zinc-400 blur-[1px]' : 'text-red-400'
                            }`}>
                            {spinningVictim || '-'}
                        </div>
                    </div>

                    {/* Number spin */}
                    <div className={`relative transition-all duration-300 ${spinPhase === 'number' || spinPhase === 'done' ? 'opacity-100' : 'opacity-30'
                        }`}>
                        <div className="relative overflow-hidden bg-black/50 border-4 border-amber-500/50 rounded-2xl w-48 py-6 shadow-2xl">
                            <div className="text-sm text-zinc-500 uppercase tracking-widest mb-2 text-center">Target</div>
                            <div
                                className={`text-8xl font-bold font-mono transition-all text-center ${spinPhase === 'done' ? 'text-amber-400 scale-110' : 'text-amber-200 blur-[1px]'
                                    }`}
                                style={{
                                    textShadow: spinPhase === 'done' ? '0 0 40px rgba(251, 191, 36, 0.8)' : 'none'
                                }}
                            >
                                {spinningNumber}
                            </div>
                        </div>
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-3xl">🎰</div>
                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-3xl">🎰</div>
                    </div>

                    {spinPhase !== 'done' && (
                        <div className="text-lg text-zinc-500 animate-pulse">Spinning...</div>
                    )}
                </div>

                <PlayerList />
            </div>
        );
    }

    // Aim Phase
    if (gameState.phase === 'aim') {
        return (
            <div className="h-full w-full flex items-center justify-center gap-12 p-8">
                <div className="flex items-center gap-8">
                    {/* Dartboard */}
                    <div style={{ zoom: gameViewScale / 100 }}>
                        <Dartboard
                            size={280}
                            glowColor={themeGlow}
                            highlightSegments={gameState.targetNumber ? [`full${gameState.targetNumber}`] : []}
                        />
                    </div>

                    {/* Target Info */}
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="text-zinc-400 text-sm uppercase tracking-widest">
                            {shooterPlayer?.name}'s Turn
                        </div>

                        <div className="p-6 bg-white/5 border border-amber-500/30 rounded-2xl">
                            <div className="text-zinc-400 text-sm mb-1">Hit</div>
                            <div className="text-7xl font-bold text-amber-400 mb-2">
                                {gameState.targetNumber}
                            </div>
                            <div className="text-zinc-400 text-sm mb-1">to make</div>
                            <div className="flex items-center justify-center gap-2">
                                {victimPlayer?.photo ? (
                                    <img src={victimPlayer.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-lg text-red-400">
                                        {victim?.name.charAt(0)}
                                    </div>
                                )}
                                <span className="text-2xl font-bold text-white">{victim?.name}</span>
                            </div>
                            <div className="text-xl text-amber-400 mt-1">DRINK! 🍺</div>
                        </div>


                    </div>
                </div>

                <PlayerList />
            </div>
        );
    }

    // Result Phase
    if (gameState.phase === 'result' && gameState.lastResult) {
        const result = gameState.lastResult;
        const shooterHasVideo = !result.isBackfire && !result.isJailbreak && shooterPlayer?.victoryVideo;

        // Show fullscreen video first (if shooter has one)
        if (showingVideo && shooterHasVideo) {
            return (
                <div className="fixed inset-0 bg-black z-[50]">
                    <video
                        src={shooterPlayer!.victoryVideo}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/70 rounded-full text-white text-xl font-bold">
                        {shooterPlayer!.name} 🎯
                    </div>
                </div>
            );
        }

        // Show results after video (or directly if no video)
        return (
            <div className="h-full w-full flex items-center justify-center gap-12 p-8">
                <div className={`text-center p-10 rounded-3xl border-2 ${result.isJailbreak
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50'
                    : result.isBackfire
                        ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/50'
                        : 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-500/50'
                    }`}>
                    <div className="text-5xl mb-4">
                        {result.isJailbreak && <PartyPopper className="w-14 h-14 mx-auto text-purple-400" />}
                        {result.isBackfire && '💥'}
                        {!result.isJailbreak && !result.isBackfire && <Beer className="w-14 h-14 mx-auto text-amber-400" />}
                    </div>

                    <div className="text-2xl font-bold text-white mb-3">
                        {result.hitType === 'bullseye' && 'JAILBREAK!'}
                        {result.hitType === 'triple' && 'TRIPLE HIT!'}
                        {result.hitType === 'double' && 'DOUBLE HIT!'}
                        {result.hitType === 'single' && 'HIT!'}
                        {result.hitType === 'miss' && 'BACKFIRE!'}
                    </div>

                    <div className="text-xl text-zinc-300 mb-4">
                        {result.penalty}
                    </div>

                    {result.pointsScored > 0 && (
                        <div className="text-lg text-amber-400 font-bold">
                            +{result.pointsScored} point{result.pointsScored > 1 ? 's' : ''} for {result.shooterName}!
                        </div>
                    )}

                    <div className="text-zinc-500 mt-4 text-sm animate-pulse">
                        Next round soon...
                    </div>
                </div>

                <PlayerList />
            </div>
        );
    }

    // Fallback
    return <div>Loading...</div>;
}
