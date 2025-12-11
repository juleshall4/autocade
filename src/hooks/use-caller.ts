import { useCallback, useRef, useEffect, useState } from 'react';

export interface CallerSettings {
    enabled: boolean;
    volume: number;           // 0-100
    sfxVolume: number;        // 0-100
    announceAllDarts: boolean; // Announce each dart
    announceRoundTotal: boolean; // Announce turn total after 3 darts
    announceCheckouts: boolean; // Announce "you require X" when <= 170
    announceBusts: boolean;    // Announce busts
    announceGameStart: boolean; // Announce game on
    voice: string;            // Voice pack name
}

const DEFAULT_SETTINGS: CallerSettings = {
    enabled: true,
    volume: 80,
    sfxVolume: 70,
    announceAllDarts: false,
    announceRoundTotal: true,
    announceCheckouts: true,
    announceBusts: true,
    announceGameStart: true,
    voice: 'Northern_Terry',
};

// Load settings from localStorage
export const loadCallerSettings = (): CallerSettings => {
    try {
        const saved = localStorage.getItem('autocade-caller');
        if (saved) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Failed to load caller settings:', e);
    }
    return DEFAULT_SETTINGS;
};

// Save settings to localStorage
export const saveCallerSettings = (settings: CallerSettings) => {
    try {
        localStorage.setItem('autocade-caller', JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save caller settings:', e);
    }
};

// Hook that auto-loads settings from localStorage
export const useCaller = () => {
    const [settings, setSettings] = useState<CallerSettings>(loadCallerSettings);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const queueRef = useRef<string[]>([]);
    const isPlayingRef = useRef(false);

    // Re-load settings when localStorage changes (for when settings are updated elsewhere)
    useEffect(() => {
        const handleStorage = () => {
            setSettings(loadCallerSettings());
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Play the next sound in the queue
    const playNext = useCallback(() => {
        if (queueRef.current.length === 0) {
            isPlayingRef.current = false;
            return;
        }

        if (!settings.enabled) {
            queueRef.current = [];
            isPlayingRef.current = false;
            return;
        }

        isPlayingRef.current = true;
        const soundPath = queueRef.current.shift()!;

        const audio = new Audio(soundPath);
        audio.volume = settings.volume / 100;
        audioRef.current = audio;

        audio.onended = () => {
            playNext();
        };

        audio.onerror = () => {
            console.warn(`Failed to play sound: ${soundPath}`);
            playNext();
        };

        audio.play().catch(() => {
            console.warn(`Failed to play sound: ${soundPath}`);
            playNext();
        });
    }, [settings.enabled, settings.volume]);

    // Queue a sound to play
    const queueSound = useCallback((soundPath: string) => {
        if (!settings.enabled) return;

        queueRef.current.push(soundPath);
        if (!isPlayingRef.current) {
            playNext();
        }
    }, [settings.enabled, playNext]);

    // Clear the queue and stop current audio
    const stopAll = useCallback(() => {
        queueRef.current = [];
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        isPlayingRef.current = false;
    }, []);

    // === CALLER FUNCTIONS (Dynamic Voice Pack) ===
    // Map legacy 'default' value to Northern_Terry for backwards compatibility
    const voicePack = (settings.voice === 'default' || !settings.voice) ? 'Northern_Terry' : settings.voice;
    const VOICE_PATH = `/sounds/${voicePack}`;

    // Call a score (0-180) - uses numbers folder
    // Note: For 0 (bust/no score), use callNoScore() instead
    const callScore = useCallback((score: number) => {
        if (!settings.enabled) return;
        if (score === 0) {
            // Use "No score" for 0
            queueSound(`${VOICE_PATH}/phrases/No_score.mp3`);
        } else {
            queueSound(`${VOICE_PATH}/numbers/${score}.mp3`);
        }
    }, [settings.enabled, queueSound]);

    // Call a single dart (not implemented for this voice pack)
    const callDart = useCallback((_segment: string) => {
        // Northern Terry doesn't have individual dart calls
    }, []);

    // Call remaining score for checkout (≤170) - plays random "You need" + number
    const YOU_NEED_VARIANTS = ['You_need.mp3', 'You_need1.mp3', 'You_need2.mp3', 'You_need3.mp3'];
    const callRemaining = useCallback((remaining: number) => {
        if (!settings.enabled || !settings.announceCheckouts) return;
        if (remaining <= 170 && remaining >= 2) {
            const randomVariant = YOU_NEED_VARIANTS[Math.floor(Math.random() * YOU_NEED_VARIANTS.length)];
            queueSound(`${VOICE_PATH}/phrases/${randomVariant}`);
            queueSound(`${VOICE_PATH}/numbers/${remaining}.mp3`);
        }
    }, [settings.enabled, settings.announceCheckouts, queueSound]);

    // Game on call - at start of game (randomize from 5 variants)
    const GAME_ON_VARIANTS = ['Game_on.mp3', 'Game_on1.mp3', 'Game_on2.mp3', 'Game_on3.mp3', 'Game_on4.mp3'];
    const callGameOn = useCallback(() => {
        if (!settings.enabled || !settings.announceGameStart) return;
        const randomVariant = GAME_ON_VARIANTS[Math.floor(Math.random() * GAME_ON_VARIANTS.length)];
        queueSound(`${VOICE_PATH}/phrases/${randomVariant}`);
    }, [settings.enabled, settings.announceGameStart, queueSound]);

    // Game shot call (checkout/win) - no score announcement
    const callGameShot = useCallback(() => {
        if (!settings.enabled) return;
        queueSound(`${VOICE_PATH}/phrases/Game_shot.mp3`);
    }, [settings.enabled, queueSound]);

    // No score call - for bust or all 3 miss (randomize from 3 variants)
    const NO_SCORE_VARIANTS = ['No_score.mp3', 'No_score1.mp3', 'No_score2.mp3'];
    const callNoScore = useCallback(() => {
        if (!settings.enabled) return;
        const randomVariant = NO_SCORE_VARIANTS[Math.floor(Math.random() * NO_SCORE_VARIANTS.length)];
        queueSound(`${VOICE_PATH}/phrases/${randomVariant}`);
    }, [settings.enabled, queueSound]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAll();
        };
    }, [stopAll]);

    return {
        settings,
        callScore,
        callDart,
        callRemaining,
        callGameOn,
        callGameShot,
        callNoScore,
        stopAll,
    };
};
