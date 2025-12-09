import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, Check } from 'lucide-react';

interface CameraCaptureProps {
    onCapture: (photo: string) => void;
    onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Start camera on mount
    useEffect(() => {
        async function startCamera() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: 400, height: 400 }
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                setError('Could not access camera. Please allow camera permissions.');
                console.error('Camera error:', err);
            }
        }
        startCamera();

        // Cleanup on unmount
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Stop stream when we have a captured photo
    useEffect(() => {
        if (capturedPhoto && stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }, [capturedPhoto, stream]);

    const handleCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0);

        // Get base64 image (JPEG for smaller size)
        const photo = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photo);
    }, []);

    const handleRetake = useCallback(async () => {
        setCapturedPhoto(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 400, height: 400 }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError('Could not restart camera.');
        }
    }, []);

    const handleConfirm = useCallback(() => {
        if (capturedPhoto) {
            onCapture(capturedPhoto);
        }
    }, [capturedPhoto, onCapture]);

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Take Photo
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Camera view / Captured photo */}
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-4">
                    {capturedPhoto ? (
                        <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover mirror"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    )}
                </div>

                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Buttons */}
                <div className="flex gap-3">
                    {capturedPhoto ? (
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
                                Use Photo
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleCapture}
                            disabled={!!error}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Camera className="w-4 h-4" />
                            Capture
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
