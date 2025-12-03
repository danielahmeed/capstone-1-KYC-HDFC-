import React, { useState, useEffect } from 'react';
import './ErrorRecovery.css';

const ErrorRecovery = ({ error, onRetry, onRecover }) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [recoveryOptions, setRecoveryOptions] = useState([]);

  useEffect(() => {
    // Determine recovery options based on error type
    const options = [];
    
    if (error.type === 'NETWORK_ERROR') {
      options.push({
        id: 'retry',
        label: 'Retry Connection',
        action: handleRetry
      });
      options.push({
        id: 'offline',
        label: 'Continue Offline',
        action: () => onRecover('offline')
      });
    } else if (error.type === 'AUTH_ERROR') {
      options.push({
        id: 'relogin',
        label: 'Log In Again',
        action: () => onRecover('relogin')
      });
    } else if (error.type === 'RATE_LIMIT_ERROR') {
      options.push({
        id: 'wait',
        label: 'Wait and Retry',
        action: handleDelayedRetry
      });
    } else {
      options.push({
        id: 'retry',
        label: 'Try Again',
        action: handleRetry
      });
      options.push({
        id: 'recover',
        label: 'Recover Previous State',
        action: () => onRecover('recover_state')
      });
    }
    
    // Always add contact support option
    options.push({
      id: 'support',
      label: 'Contact Support',
      action: () => handleContactSupport(error)
    });
    
    setRecoveryOptions(options);
  }, [error]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(retryCount + 1);
    
    try {
      await onRetry();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDelayedRetry = () => {
    setIsRetrying(true);
    // Wait 30 seconds before retrying
    setTimeout(() => {
      handleRetry();
    }, 30000);
  };

  const handleContactSupport = (error) => {
    // In a real implementation, this would open a support ticket
    alert(`Contacting 24/7 Support...

Error Details:
Type: ${error.type}
Message: ${error.message}

A support agent will assist you shortly.`);
  };

  const getErrorMessage = () => {
    switch (error.type) {
      case 'NETWORK_ERROR':
        return 'Network connection lost. Please check your internet connection.';
      case 'AUTH_ERROR':
        return 'Your session has expired. Please log in again.';
      case 'RATE_LIMIT_ERROR':
        return 'Too many requests. Please wait before trying again.';
      case 'SERVER_ERROR':
        return 'Server is temporarily unavailable. Please try again later.';
      case 'DOCUMENT_SCAN_ERROR':
        return 'Document scanning failed. Please ensure the image is clear and well-lit.';
      case 'FACIAL_RECOGNITION_ERROR':
        return 'Facial recognition failed. Please ensure good lighting and follow the prompts.';
      case 'AADHAAR_OTP_ERROR':
        return 'Aadhaar verification failed. Please check your number and try again.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  };

  const getErrorIcon = () => {
    switch (error.type) {
      case 'NETWORK_ERROR':
        return '📶';
      case 'AUTH_ERROR':
        return '🔒';
      case 'RATE_LIMIT_ERROR':
        return '⏳';
      case 'SERVER_ERROR':
        return '⚠️';
      case 'DOCUMENT_SCAN_ERROR':
        return '📄';
      case 'FACIAL_RECOGNITION_ERROR':
        return '👤';
      case 'AADHAAR_OTP_ERROR':
        return '📱';
      default:
        return '❌';
    }
  };

  const getErrorSolution = () => {
    switch (error.type) {
      case 'NETWORK_ERROR':
        return [
          "Check your internet connection",
          "Try switching to a different network",
          "Restart your router if issues persist"
        ];
      case 'AUTH_ERROR':
        return [
          "Log in again with your credentials",
          "Clear your browser cache and cookies",
          "Contact support if the issue continues"
        ];
      case 'RATE_LIMIT_ERROR':
        return [
          "Wait for a few minutes before trying again",
          "Reduce the frequency of your requests",
          "Contact support for higher rate limits"
        ];
      case 'SERVER_ERROR':
        return [
          "Wait a few minutes and try again",
          "Check system status page for outages",
          "Contact support if the problem persists"
        ];
      case 'DOCUMENT_SCAN_ERROR':
        return [
          "Ensure the document is well-lit and in focus",
          "Place the document on a flat surface",
          "Try uploading a different image format",
          "Use the camera scan option for better results"
        ];
      case 'FACIAL_RECOGNITION_ERROR':
        return [
          "Ensure good lighting on your face",
          "Remove glasses or headwear",
          "Position your face in the center of the frame",
          "Keep steady during the capture process"
        ];
      case 'AADHAAR_OTP_ERROR':
        return [
          "Verify your Aadhaar number is correct",
          "Check that your mobile number is registered",
          "Try resending the OTP after 30 seconds",
          "Contact UIDAI if issues persist"
        ];
      default:
        return [
          "Try the operation again",
          "Check your internet connection",
          "Clear your browser cache",
          "Contact 24/7 support for assistance"
        ];
    }
  };

  return (
    <div className="error-recovery-overlay">
      <div className="error-recovery-modal">
        <div className="error-header">
          <span className="error-icon">{getErrorIcon()}</span>
          <h2>Error Occurred</h2>
        </div>
        
        <div className="error-message">
          <p>{getErrorMessage()}</p>
          {retryCount > 0 && (
            <p className="retry-info">
              Attempt {retryCount} of 3
            </p>
          )}
        </div>
        
        <div className="error-solutions">
          <h3>Troubleshooting Tips:</h3>
          <ul>
            {getErrorSolution().map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
        
        <div className="recovery-options">
          {recoveryOptions.map(option => (
            <button
              key={option.id}
              className={`recovery-button ${option.id}`}
              onClick={option.action}
              disabled={isRetrying && option.id === 'retry'}
            >
              {isRetrying && option.id === 'retry' ? 'Retrying...' : option.label}
            </button>
          ))}
        </div>
        
        {isRetrying && (
          <div className="retry-progress">
            <div className="spinner"></div>
            <p>Attempting to recover...</p>
          </div>
        )}
        
        <div className="error-footer">
          <p>Need more help? <a href="#support" onClick={(e) => {e.preventDefault(); handleContactSupport(error);}}>Contact 24/7 Support</a></p>
        </div>
      </div>
    </div>
  );
};

export default ErrorRecovery;