import React, { useState, useRef, useEffect } from 'react';
import './DocumentScanner.css';

const DocumentScanner = ({ onScanComplete, onError }) => {
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit. Please select a smaller file.');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      // Convert file to base64 for transmission
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target.result;

        // Set image preview
        setImage(imageData);

        try {
          // In a real implementation, this would call an API endpoint
          // For demo purposes, we'll simulate API call with mock data
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Simulate different outcomes based on image quality
          const qualityScore = Math.floor(Math.random() * 40) + 60; // 60-99

          if (qualityScore < 70) {
            throw new Error('Document quality is too low. Please retake the photo with better lighting and clarity.');
          }

          const mockResult = {
            type: 'PAN Card',
            fullName: 'John Doe',
            documentNumber: 'ABCDE1234F',
            dateOfBirth: '1990-01-01',
            expiryDate: '2030-01-01',
            nationality: 'Indian',
            qualityScore,
            rawOcrText: 'Sample OCR text extracted from the document...',
            imageData: imageData // Pass the captured image data
          };

          setResult(mockResult);
          onScanComplete(mockResult);
        } catch (err) {
          setError(err.message || 'Failed to process document. Please try again.');
          if (onError) {
            onError(err);
          }
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process document. Please try again.');
      setIsProcessing(false);
      if (onError) {
        onError(err);
      }
    }
  };

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
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
    setCapturedPreview(null);
  };

  const captureImage = () => {
    if (!cameraReady || !videoRef.current || !canvasRef.current) return;

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

    // Show preview instead of processing immediately
    setCapturedPreview(imageData);
  };

  const confirmCapture = () => {
    if (!capturedPreview) return;

    // Stop camera
    stopCamera();

    // Process captured image
    setImage(capturedPreview);
    processImage(capturedPreview);
    setCapturedPreview(null);
  };

  const retakeCapture = () => {
    setCapturedPreview(null);
  };

  const processImage = async (imageData) => {
    setIsProcessing(true);

    try {
      // In a real implementation, this would call an API endpoint
      // For demo purposes, we'll simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate different outcomes based on image quality
      const qualityScore = Math.floor(Math.random() * 40) + 60; // 60-99

      if (qualityScore < 70) {
        throw new Error('Document quality is too low. Please retake the photo with better lighting and clarity.');
      }

      const mockResult = {
        type: 'PAN Card',
        fullName: 'John Doe',
        documentNumber: 'ABCDE1234F',
        dateOfBirth: '1990-01-01',
        expiryDate: '2030-01-01',
        nationality: 'Indian',
        qualityScore,
        rawOcrText: 'Sample OCR text extracted from the document...',
        imageData: imageData // Pass the captured image data
      };

      setResult(mockResult);
      onScanComplete(mockResult);
    } catch (err) {
      setError(err.message || 'Failed to process document. Please try again.');
      if (onError) {
        onError(err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const fileEvent = { target: { files } };
      handleFileChange(fileEvent);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const retakePhoto = () => {
    setImage(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="document-scanner">
      {!image && !isProcessing && !cameraActive && (
        <div className="scanner-options">
          <div
            className="upload-area"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
          >
            <div className="upload-content">
              <div className="upload-icon">📁</div>
              <h3>Upload Document</h3>
              <p>Drag & drop your document here or click to browse</p>
              <p className="file-types">Supports JPG, PNG (Max 10MB)</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="camera-option">
            <button className="camera-button" onClick={startCamera}>
              <span className="camera-icon">📷</span>
              <span>Scan with Camera</span>
            </button>
            <p className="camera-instruction">Position your document in front of the camera</p>
          </div>
        </div>
      )}

      {cameraActive && !isProcessing && (
        <div className="camera-modal-overlay">
          <div className="camera-modal-content">
            <div className="camera-header">
              <h3>{capturedPreview ? 'Confirm Capture' : 'Scan Document'}</h3>
              <button className="close-button" onClick={stopCamera}>&times;</button>
            </div>

            <div className="camera-view">
              <div className="camera-container">
                {capturedPreview ? (
                  <img src={capturedPreview} alt="Captured preview" className="camera-feed" />
                ) : (
                  <>
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
                  </>
                )}
              </div>

              <div className="camera-controls">
                {capturedPreview ? (
                  <div className="confirmation-controls">
                    <button className="secondary-button" onClick={retakeCapture}>Retake</button>
                    <button className="primary-button" onClick={confirmCapture}>Upload Photo</button>
                  </div>
                ) : (
                  cameraReady && (
                    <button className="capture-button" onClick={captureImage}>
                      <div className="capture-circle"></div>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="processing-state">
          <div className="spinner"></div>
          <h3>Processing Document</h3>
          <p>Extracting information from your document...</p>
        </div>
      )}

      {image && !isProcessing && (
        <div className="preview-area">
          <div className="image-preview">
            <img src={image} alt="Document preview" />
          </div>

          {result && (
            <div className="scan-result">
              <h3>Document Information</h3>
              <div className="result-grid">
                <div className="result-item">
                  <label>Document Type:</label>
                  <span>{result.type}</span>
                </div>
                <div className="result-item">
                  <label>Full Name:</label>
                  <span>{result.fullName}</span>
                </div>
                <div className="result-item">
                  <label>Document Number:</label>
                  <span>{result.documentNumber}</span>
                </div>
                <div className="result-item">
                  <label>Date of Birth:</label>
                  <span>{result.dateOfBirth}</span>
                </div>
                <div className="result-item">
                  <label>Expiry Date:</label>
                  <span>{result.expiryDate}</span>
                </div>
                <div className="result-item">
                  <label>Nationality:</label>
                  <span>{result.nationality}</span>
                </div>
                <div className="result-item quality-score">
                  <label>Quality Score:</label>
                  <span className={result.qualityScore > 80 ? 'high' : result.qualityScore > 70 ? 'medium' : 'low'}>
                    {result.qualityScore}/100
                  </span>
                </div>
              </div>

              <div className="action-buttons">
                <button className="secondary-button" onClick={retakePhoto}>
                  Retake Photo
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button className="secondary-button" onClick={retakePhoto}>
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentScanner;