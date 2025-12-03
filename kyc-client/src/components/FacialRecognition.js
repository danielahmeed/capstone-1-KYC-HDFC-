import React, { useState, useRef, useEffect } from 'react';
import './FacialRecognition.css';

const FacialRecognition = ({ onVerificationComplete, onError }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure you have granted camera permissions.');
      setCameraActive(false);
      setCameraReady(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  };

  const captureAndVerify = async () => {
    if (!cameraReady || !videoRef.current || !canvasRef.current) return;

    setIsVerifying(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const imageData = canvas.toDataURL('image/jpeg');

      // Stop camera after capture
      stopCamera();

      // Simulate facial recognition processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Randomly determine verification result (70% success rate for demo)
      const isSuccess = Math.random() > 0.3;

      if (isSuccess) {
        const result = {
          success: true,
          confidence: Math.floor(Math.random() * 30) + 70, // 70-99%
          message: 'Facial verification successful',
          imageData: imageData // Pass the captured image data
        };

        setVerificationResult(result);
        onVerificationComplete(result);
      } else {
        throw new Error('Facial verification failed. Face does not match document photo.');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to perform facial recognition. Please try again.';
      setError(errorMessage);
      if (onError) {
        onError(err);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const retryVerification = () => {
    setVerificationResult(null);
    setError('');
    startCamera();
  };

  return (
    <div className="facial-recognition">
      <div className="verification-container">
        {!isVerifying && !verificationResult && !error && !cameraActive && (
          <div className="start-prompt">
            <div className="camera-icon">📷</div>
            <h3>Facial Verification</h3>
            <p>Click the button below to start facial verification</p>
            <button className="verify-button" onClick={startCamera}>
              Start Verification
            </button>
            <div className="instructions">
              <h4>Instructions:</h4>
              <ul>
                <li>Position yourself in a well-lit area</li>
                <li>Look directly at the camera</li>
                <li>Remove any glasses or headwear</li>
                <li>Follow prompts for head movements</li>
              </ul>
            </div>
          </div>
        )}

        {cameraActive && !isVerifying && (
          <div className="camera-modal-overlay">
            <div className="camera-modal-content">
              <div className="camera-header">
                <h3>Verify Identity</h3>
                <button className="close-button" onClick={stopCamera}>&times;</button>
              </div>

              <div className="camera-view">
                <div className="camera-container">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-feed"
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {!cameraReady && (
                    <div className="camera-loading">
                      <div className="spinner"></div>
                      <p>Initializing camera...</p>
                    </div>
                  )}

                  {cameraReady && (
                    <div className="face-guide-overlay">
                      <div className="face-guide-circle"></div>
                    </div>
                  )}
                </div>

                <div className="camera-controls">
                  {cameraReady && (
                    <button className="capture-button" onClick={captureAndVerify}>
                      <div className="capture-circle"></div>
                    </button>
                  )}
                </div>
                <p className="camera-instruction">Position your face within the circle and click capture</p>
              </div>
            </div>
          </div>
        )}

        {isVerifying && (
          <div className="verifying-state">
            <div className="spinner"></div>
            <h3>Verifying Identity</h3>
            <p>Performing facial recognition...</p>
            <div className="progress-indicator">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          </div>
        )}

        {verificationResult && (
          <div className="verification-success">
            <div className="success-icon">✅</div>
            <h3>Verification Successful!</h3>
            <p>{verificationResult.message}</p>
            <div className="confidence-meter">
              <label>Confidence Score:</label>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{ width: `${verificationResult.confidence}%` }}
                ></div>
                <span className="score-text">{verificationResult.confidence}%</span>
              </div>
            </div>
            <button className="secondary-button" onClick={retryVerification}>
              Verify Again
            </button>
          </div>
        )}

        {error && (
          <div className="verification-error">
            <div className="error-icon">❌</div>
            <h3>Verification Failed</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={retryVerification}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacialRecognition;