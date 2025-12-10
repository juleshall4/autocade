import { useCallback, useRef, useEffect, useState } from 'react';

export interface CallerSettings {
    enabled: boolean;
    volume: number;           // 0-100
    sfxVolume: number;        // 0-100
    announceAllDarts: boolean; // Announce each dart or just turn total
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
    announceCheckouts: true,
    announceBusts: true,
    announceGameStart: true,
    voice: 'default',
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

    // === CALLER FUNCTIONS ===

    // Call a score (0-180)
    const callScore = useCallback((score: number) => {
        if (!settings.enabled) return;
        // Scores are named as {score}.mp3 in the voice pack
        const soundPath = `/sounds/${score}.mp3`;
        queueSound(soundPath);
    }, [settings.enabled, queueSound]);

    // Call a single dart (e.g., "triple twenty", "double sixteen")
    const callDart = useCallback((segment: string) => {
        if (!settings.enabled || !settings.announceAllDarts) return;
        // Darts-caller uses format like: s20.mp3, d20.mp3, t20.mp3
        // We'll map our segment format to theirs
        const soundPath = `/sounds/${segment.toLowerCase()}.mp3`;
        queueSound(soundPath);
    }, [settings.enabled, settings.announceAllDarts, queueSound]);

    // Call remaining score for checkout (≤170)
    const callRemaining = useCallback((remaining: number) => {
        if (!settings.enabled || !settings.announceCheckouts) return;
        if (remaining <= 170 && remaining >= 2) {
            // Just play the remaining score (we don't have "you require" audio)
            queueSound(`/sounds/${remaining}.mp3`);
        }
    }, [settings.enabled, settings.announceCheckouts, queueSound]);

    // Game on call - not implemented (no audio file)
    const callGameOn = useCallback(() => {
        if (!settings.enabled || !settings.announceGameStart) return;
        // We don't have game_on.mp3 in this voice pack, skip for now
        // queueSound('/sounds/game_on.mp3');
    }, [settings.enabled, settings.announceGameStart]);

    // Game shot call (checkout/win)
    const callGameShot = useCallback(() => {
        if (!settings.enabled) return;
        queueSound('/sounds/game_shot.mp3');
    }, [settings.enabled, queueSound]);

    // Bust call - not implemented (no audio file)
    const callBust = useCallback(() => {
        if (!settings.enabled || !settings.announceBusts) return;
        // We don't have busted.mp3 in this voice pack, skip for now
        // queueSound('/sounds/busted.mp3');
    }, [settings.enabled, settings.announceBusts]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAll();
        };
    }, [stopAll]);

    return {
        callScore,
        callDart,
        callRemaining,
        callGameOn,
        callGameShot,
        callBust,
        stopAll,
    };
};
