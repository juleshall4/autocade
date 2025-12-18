import { useRef, useState, useCallback, useEffect } from 'react';
import { Video, X, Check, Circle } from 'lucide-react';

interface VideoCaptureProps {
    onCapture: (video: string) => void;
    onClose: () => void;
}

const RECORDING_DURATION = 3000; // 3 seconds

export function VideoCapture({ onCapture, onClose }: VideoCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Start camera on mount
    useEffect(() => {
        async function startCamera() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: 640, height: 480 },
                    audio: false
                });
                setStream(mediaStream);
            } catch (err) {
                setError('Could not access camera. Please allow camera permissions.');
                console.error('Camera error:', err);
            }
        }
        startCamera();

        return () => {
            // Cleanup on unmount
        };
    }, []);

    // Handle video source - either camera stream or recorded video
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (recordedVideo) {
            // Show recorded video
            video.srcObject = null; // Clear stream first
            video.src = recordedVideo;
            video.loop = true;
            video.style.transform = 'none'; // No mirror for playback
            video.play().catch(console.error);
        } else if (stream) {
            // Show camera stream
            video.src = ''; // Clear src first
            video.srcObject = stream;
            video.loop = false;
            video.style.transform = 'scaleX(-1)'; // Mirror camera
            video.play().catch(console.error);
        }
    }, [recordedVideo, stream]);

    // Recording countdown
    useEffect(() => {
        if (isRecording && countdown !== null && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [isRecording, countdown]);

    const startRecording = useCallback(() => {
        if (!stream) return;

        chunksRef.current = [];

        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });

            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                console.log('Video recorded, size:', result.length);
                setRecordedVideo(result);
            };
            reader.readAsDataURL(blob);
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
        setCountdown(3);

        setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
            }
        }, RECORDING_DURATION);
    }, [stream]);

    const handleRetake = useCallback(async () => {
        setRecordedVideo(null);
        setCountdown(null);

        // Stop current stream and restart
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 },
                audio: false
            });
            setStream(mediaStream);
        } catch (err) {
            setError('Could not restart camera.');
        }
    }, [stream]);

    const handleConfirm = useCallback(() => {
        if (recordedVideo) {
            // Stop camera before closing
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            onCapture(recordedVideo);
        }
    }, [recordedVideo, stream, onCapture]);

    const handleClose = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        onClose();
    }, [stream, onClose]);

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Victory Dance
                    </h2>
                    <button onClick={handleClose} className="text-zinc-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-zinc-400 text-sm mb-4">
                    Record a 3-second victory dance that plays when you win!
                </p>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Single video element */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />

                    {/* Recording indicator */}
                    {isRecording && (
                        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 px-3 py-1 rounded-full">
                            <Circle className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
                            <span className="text-white text-sm font-bold">{countdown}s</span>
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    {recordedVideo ? (
                        <>
                            <button
                                onClick={handleRetake}
                                className="flex-1 py-3 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors"
                            >
                                Retake
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Use Video
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={startRecording}
                            disabled={!!error || isRecording || !stream}
                            className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isRecording ? (
                                <>
                                    <Circle className="w-4 h-4 fill-white animate-pulse" />
                                    Recording... {countdown}s
                                </>
                            ) : (
                                <>
                                    <Circle className="w-4 h-4 fill-white" />
                                    Start Recording
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
