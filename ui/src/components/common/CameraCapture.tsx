import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check } from 'lucide-react';

import './camera-capture.css';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('Camera capture: track stopped');
            });
            streamRef.current = null;
        }
    };

    const startCamera = async () => {
        try {
            stopCamera(); // Clean up existing if any
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }, 
                audio: false
            });
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Could not access camera. Please ensure permissions are granted.');
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                
                // Set canvas dimensions to match video
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                // Draw frame to canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Convert to data URL
                const imageData = canvas.toDataURL('image/jpeg');
                setCapturedImage(imageData);
                
                // Stop the camera
                stopCamera();
            }
        }
    };

    const handleConfirm = () => {
        if (capturedImage) {
            // Convert data URL to File
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
                    onCapture(file);
                });
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    return (
        <div className="camera-capture-overlay">
            <div className="camera-modal">
                <div className="camera-header">
                    <h3>Take Selfie Verification</h3>
                    <button onClick={onClose} className="camera-close-btn">&times;</button>
                </div>
                
                <div className="camera-body">
                    {error ? (
                        <div className="camera-error">
                            <p>{error}</p>
                            <button onClick={startCamera} className="retry-btn">Try Again</button>
                        </div>
                    ) : (
                        <div className="viewfinder">
                            {!capturedImage ? (
                                <video ref={videoRef} autoPlay playsInline muted />
                            ) : (
                                <img src={capturedImage} alt="Captured" />
                            )}
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>
                    )}
                </div>

                <div className="camera-footer">
                    {!capturedImage ? (
                        <button onClick={takePhoto} className="capture-btn" disabled={!!error}>
                            <Camera size={24} />
                            Capture Photo
                        </button>
                    ) : (
                        <div className="confirm-row">
                            <button onClick={handleRetake} className="retake-btn">
                                <RefreshCw size={20} />
                                Retake
                            </button>
                            <button onClick={handleConfirm} className="use-photo-btn">
                                <Check size={20} />
                                Use Photo
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

