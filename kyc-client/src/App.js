import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import KYCProgress from './components/KYCProgress';
import DocumentScanner from './components/DocumentScanner';
import FacialRecognition from './components/FacialRecognition';
import ErrorRecovery from './components/ErrorRecovery';
import SupportAssistant from './components/SupportAssistant';
import APIService from './services/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [documentData, setDocumentData] = useState(null);
  const [facialVerified, setFacialVerified] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState(null);
  const [retryGuidance, setRetryGuidance] = useState(null);
  const [kycSession, setKycSession] = useState({
    userId: null,
    documentScanned: false,
    facialVerified: false,
    duplicateChecked: false,
    aadhaarVerified: false,
    submissionData: {}
  });
  
  // Add state for transitions
  const [transitionState, setTransitionState] = useState('entered');
  
  // Add state for form data
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
    phoneNumber: '',
    email: ''
  });
  
  // Add state for Aadhaar verification
  const [aadhaarData, setAadhaarData] = useState({
    aadhaarNumber: '',
    otp: '',
    otpSent: false,
    otpVerified: false
  });
  
  // Add state for errors
  const [errors, setErrors] = useState({});
  
  // Add state for error recovery
  const [error, setError] = useState(null);
  const [showErrorRecovery, setShowErrorRecovery] = useState(false);
  
  const kycSteps = [
    { id: 0, name: 'Welcome', description: 'Start your KYC process' },
    { id: 1, name: 'Personal Info', description: 'Enter your personal details' },
    { id: 2, name: 'PAN Upload', description: 'Upload your PAN card' },
    { id: 3, name: 'Aadhaar OTP', description: 'Verify your Aadhaar number' },
    { id: 4, name: 'Face Match', description: 'Verify your identity with facial recognition' },
    { id: 5, name: 'Final Review', description: 'Review and submit your information' },
    { id: 6, name: 'Completion', description: 'KYC process completed' }
  ];
  
  const totalSteps = kycSteps.length;
  
  // Handle login success
  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    
    // Load saved progress from localStorage on login
    const savedProgress = localStorage.getItem('kycProgress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCurrentStep(progress.currentStep);
        setPersonalInfo(progress.personalInfo || personalInfo);
        setDocumentData(progress.documentData || documentData);
        setAadhaarData(progress.aadhaarData || aadhaarData);
        setFacialVerified(progress.facialVerified || facialVerified);
        setKycSession(progress.kycSession || kycSession);
      } catch (e) {
        console.error('Error parsing saved progress:', e);
      }
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    APIService.setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('kycProgress');
    
    // Reset state
    setCurrentStep(0);
    setPersonalInfo({
      fullName: '',
      dateOfBirth: '',
      address: '',
      phoneNumber: '',
      email: ''
    });
    setDocumentData(null);
    setAadhaarData({
      aadhaarNumber: '',
      otp: '',
      otpSent: false,
      otpVerified: false
    });
    setFacialVerified(false);
    setKycSession({
      userId: null,
      documentScanned: false,
      facialVerified: false,
      duplicateChecked: false,
      aadhaarVerified: false,
      submissionData: {}
    });
  };
  
  // Save progress to localStorage whenever state changes
  useEffect(() => {
    if (isLoggedIn) {
      const progress = {
        currentStep,
        personalInfo,
        documentData,
        aadhaarData,
        facialVerified,
        kycSession
      };
      localStorage.setItem('kycProgress', JSON.stringify(progress));
      
      // Also save to backend with fallback mechanism
      APIService.saveKYCProgressWithFallback(progress).catch(err => {
        console.error('Failed to save progress to backend:', err);
        // Error is already handled by the fallback mechanism in the API service
      });
    }
  }, [currentStep, personalInfo, documentData, aadhaarData, facialVerified, kycSession, isLoggedIn]);
  
  // Error recovery handlers
  const handleError = (error) => {
    setError(error);
    setShowErrorRecovery(true);
  };
  
  const handleRetry = async () => {
    // Hide error recovery modal
    setShowErrorRecovery(false);
    
    // Reset error state
    setError(null);
    
    // Retry the last operation
    // This would depend on which step was active when the error occurred
    // For now, we'll just log that a retry was attempted
    console.log('Retrying last operation...');
  };
  
  const handleRecover = (recoveryType) => {
    // Hide error recovery modal
    setShowErrorRecovery(false);
    
    // Reset error state
    setError(null);
    
    // Handle different recovery types
    switch (recoveryType) {
      case 'offline':
        // Continue with offline mode
        console.log('Continuing in offline mode');
        break;
      case 'relogin':
        // Redirect to login
        handleLogout();
        break;
      case 'recover_state':
        // Try to recover previous state
        const savedProgress = localStorage.getItem('kycProgress');
        if (savedProgress) {
          try {
            const progress = JSON.parse(savedProgress);
            setCurrentStep(progress.currentStep);
            setPersonalInfo(progress.personalInfo || personalInfo);
            setDocumentData(progress.documentData || documentData);
            setAadhaarData(progress.aadhaarData || aadhaarData);
            setFacialVerified(progress.facialVerified || facialVerified);
            setKycSession(progress.kycSession || kycSession);
          } catch (e) {
            console.error('Error recovering state:', e);
          }
        }
        break;
      default:
        console.log('Unknown recovery type:', recoveryType);
    }
  };
  
  const handleScanComplete = (data) => {
    setDocumentData(data);
    setKycSession(prev => ({
      ...prev,
      documentScanned: true,
      submissionData: {
        ...prev.submissionData,
        documentData: data
      }
    }));
  };
  
  const handleFacialVerification = (result) => {
    setFacialVerified(result.success);
    setKycSession(prev => ({
      ...prev,
      facialVerified: result.success,
      submissionData: {
        ...prev.submissionData,
        facialData: result
      }
    }));
  };
  
  const handleDuplicateCheck = (result) => {
    setDuplicateCheckResult(result);
    setKycSession(prev => ({
      ...prev,
      duplicateChecked: true,
      submissionData: {
        ...prev.submissionData,
        duplicateCheck: result
      }
    }));
  };
  
  const handleRetryGuidance = (guidance) => {
    setRetryGuidance(guidance);
  };
  
  // Handle step navigation with transitions
  const goToStep = (step) => {
    setTransitionState('exiting');
    setTimeout(() => {
      setCurrentStep(step);
      setTransitionState('entering');
      setTimeout(() => {
        setTransitionState('entered');
      }, 50);
    }, 150);
  };
  
  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      // Validate current step before moving forward
      if (validateStep(currentStep)) {
        goToStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  // Handle KYC submission
  const submitKYC = async () => {
    try {
      // Prepare KYC data
      const kycData = {
        personalInfo,
        documentData,
        aadhaarData,
        facialVerified,
        consent: true // In a real implementation, you would check if the user has actually consented
      };

      // Submit to backend
      const response = await APIService.submitKYC(kycData);
      
      if (response.success) {
        // Move to completion step
        goToStep(6);
      } else {
        // Handle submission error
        setErrors({ submit: response.message || 'Failed to submit KYC. Please try again.' });
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      setErrors({ submit: 'Failed to submit KYC. Please check your connection and try again.' });
      handleError(error);
    }
  };

  // Validation functions for each step
  const validateStep = (step) => {
    setErrors({}); // Clear previous errors
    switch (step) {
      case 1: // Personal Info
        return validatePersonalInfo();
      case 2: // PAN Upload
        return kycSession.documentScanned;
      case 3: // Aadhaar OTP
        return aadhaarData.otpVerified;
      case 4: // Face Match
        return facialVerified;
      default:
        return true;
    }
  };
  
  const validatePersonalInfo = () => {
    const newErrors = {};
    if (!personalInfo.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!personalInfo.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!personalInfo.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!personalInfo.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(personalInfo.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }
    if (!personalInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };
  
  // Handle Aadhaar OTP functions
  const sendOtp = async () => {
    // In a real implementation, this would call an API to send OTP
    if (aadhaarData.aadhaarNumber && /^\d{12}$/.test(aadhaarData.aadhaarNumber)) {
      try {
        const response = await APIService.sendAadhaarOTP({
          aadhaarNumber: aadhaarData.aadhaarNumber
        });
        
        if (response.success) {
          setAadhaarData(prev => ({ ...prev, otpSent: true }));
        } else {
          setErrors({ aadhaarNumber: response.message || 'Failed to send OTP' });
        }
      } catch (err) {
        setErrors({ aadhaarNumber: 'Failed to send OTP. Please try again.' });
        console.error('Send OTP error:', err);
        handleError(err);
      }
    } else {
      setErrors({ aadhaarNumber: 'Please enter a valid 12-digit Aadhaar number' });
    }
  };
  
  const verifyOtp = async () => {
    // In a real implementation, this would call an API to verify OTP
    if (aadhaarData.otp && /^\d{6}$/.test(aadhaarData.otp)) {
      try {
        const response = await APIService.verifyAadhaarOTP({
          aadhaarNumber: aadhaarData.aadhaarNumber,
          otp: aadhaarData.otp
        });
        
        if (response.success) {
          setAadhaarData(prev => ({ ...prev, otpVerified: true }));
          setKycSession(prev => ({ ...prev, aadhaarVerified: true }));
        } else {
          setErrors({ otp: response.message || 'Invalid OTP' });
        }
      } catch (err) {
        setErrors({ otp: 'Failed to verify OTP. Please try again.' });
        console.error('Verify OTP error:', err);
        handleError(err);
      }
    } else {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
    }
  };
  
  // Handle contact support
  const handleContactSupport = () => {
    // In a real implementation, this would open a support ticket or chat
    alert('Connecting you to 24/7 customer support...\n\nIn a production environment, this would connect you to a live agent.');
  };
  
  const getStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className={`step-content ${transitionState}`}>
            <h2>Welcome to HDFC Digital KYC</h2>
            <div className="step-instructions">
              <p>Complete your identity verification in just a few simple steps.</p>
              <div className="instructions">
                <h3>Process Overview:</h3>
                <ul>
                  <li>Enter your personal information</li>
                  <li>Upload your PAN card</li>
                  <li>Verify your Aadhaar number with OTP</li>
                  <li>Complete facial recognition</li>
                  <li>Review and submit your details</li>
                </ul>
                <div className="help-tip">
                  <p>💡 <strong>Pro Tip:</strong> Have your PAN card and Aadhaar card ready before you begin.</p>
                </div>
              </div>
            </div>
            <button className="nav-button" onClick={nextStep}>Get Started</button>
          </div>
        );
      case 1: // Personal Info
        return (
          <div className={`step-content ${transitionState}`}>
            <h2>Personal Information</h2>
            <div className="step-instructions">
              <p>Please enter your personal details exactly as they appear on your documents.</p>
              <div className="instructions">
                <h3>Guidelines:</h3>
                <ul>
                  <li>Use your full legal name</li>
                  <li>Enter your date of birth in DD/MM/YYYY format</li>
                  <li>Provide your complete residential address</li>
                  <li>Enter a valid 10-digit mobile number</li>
                  <li>Provide an active email address</li>
                </ul>
                <div className="help-tip">
                  <p>💡 <strong>Pro Tip:</strong> Double-check all information as it must match your official documents.</p>
                </div>
              </div>
            </div>
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  value={personalInfo.fullName}
                  onChange={(e) => setPersonalInfo({...personalInfo, fullName: e.target.value})}
                  className={errors.fullName ? 'error' : ''}
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth *</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={personalInfo.dateOfBirth}
                  onChange={(e) => setPersonalInfo({...personalInfo, dateOfBirth: e.target.value})}
                  className={errors.dateOfBirth ? 'error' : ''}
                />
                {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Residential Address *</label>
                <textarea
                  id="address"
                  value={personalInfo.address}
                  onChange={(e) => setPersonalInfo({...personalInfo, address: e.target.value})}
                  className={errors.address ? 'error' : ''}
                  rows="3"
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number *</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={personalInfo.phoneNumber}
                    onChange={(e) => setPersonalInfo({...personalInfo, phoneNumber: e.target.value})}
                    className={errors.phoneNumber ? 'error' : ''}
                  />
                  {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
              </div>
            </div>
            <div className="navigation-buttons">
              <button className="nav-button secondary" onClick={prevStep}>Back</button>
              <button className="nav-button" onClick={nextStep}>Continue</button>
            </div>
          </div>
        );
      case 2: // PAN Upload
        return (
          <div className={`step-content ${transitionState}`}>
            <h2>PAN Card Upload</h2>
            <div className="step-instructions">
              <p>Please upload a clear image of your PAN card.</p>
              <div className="instructions">
                <h3>Document Guidelines:</h3>
                <ul>
                  <li>Ensure the entire PAN card is visible</li>
                  <li>Place the card on a flat surface with good lighting</li>
                  <li>Avoid glare or shadows on the document</li>
                  <li>Image should be in focus and not blurry</li>
                  <li>Minimum resolution: 600x400 pixels</li>
                  <li>Supported formats: JPG, PNG, PDF</li>
                </ul>
                <div className="help-tip">
                  <p>💡 <strong>Pro Tip:</strong> Use the camera scan option for best results. Ensure all corners are visible.</p>
                </div>
              </div>
            </div>
            <DocumentScanner onScanComplete={handleScanComplete} onError={handleError} />
            {kycSession.documentScanned && (
              <div className="success-message">
                <p>PAN card uploaded and processed successfully!</p>
              </div>
            )}
            <div className="navigation-buttons">
              <button className="nav-button secondary" onClick={prevStep}>Back</button>
              <button 
                className="nav-button" 
                onClick={nextStep} 
                disabled={!kycSession.documentScanned}
              >
                Continue
              </button>
            </div>
          </div>
        );
      case 3: // Aadhaar OTP
        return (
          <div className={`step-content ${transitionState}`}>
            <h2>Aadhaar Verification</h2>
            <div className="step-instructions">
              <p>Verify your Aadhaar number to complete identity verification.</p>
              <div className="instructions">
                <h3>Process:</h3>
                <ul>
                  <li>Enter your 12-digit Aadhaar number</li>
                  <li>Click "Send OTP" to receive a code on your registered mobile</li>
                  <li>Enter the 6-digit OTP to verify your identity</li>
                </ul>
                <div className="help-tip">
                  <p>💡 <strong>Pro Tip:</strong> OTP is valid for 10 minutes. If not received, check your mobile network and try again.</p>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="aadhaarNumber">Aadhaar Number *</label>
                <input
                  type="text"
                  id="aadhaarNumber"
                  value={aadhaarData.aadhaarNumber}
                  onChange={(e) => setAadhaarData({...aadhaarData, aadhaarNumber: e.target.value})}
                  className={errors.aadhaarNumber ? 'error' : ''}
                  placeholder="1234 5678 9012"
                  maxLength="12"
                />
                {errors.aadhaarNumber && <span className="error-message">{errors.aadhaarNumber}</span>}
              </div>
              
              {!aadhaarData.otpSent ? (
                <button 
                  className="nav-button" 
                  onClick={sendOtp}
                  disabled={!aadhaarData.aadhaarNumber || !/^\d{12}$/.test(aadhaarData.aadhaarNumber)}
                >
                  Send OTP
                </button>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="otp">Enter OTP *</label>
                    <input
                      type="text"
                      id="otp"
                      value={aadhaarData.otp}
                      onChange={(e) => setAadhaarData({...aadhaarData, otp: e.target.value})}
                      className={errors.otp ? 'error' : ''}
                      placeholder="123456"
                      maxLength="6"
                    />
                    {errors.otp && <span className="error-message">{errors.otp}</span>}
                  </div>
                  
                  <div className="button-group">
                    <button 
                      className="nav-button secondary" 
                      onClick={() => setAadhaarData({...aadhaarData, otpSent: false})}
                    >
                      Resend OTP
                    </button>
                    <button 
                      className="nav-button" 
                      onClick={verifyOtp}
                      disabled={!aadhaarData.otp || !/^\d{6}$/.test(aadhaarData.otp)}
                    >
                      Verify OTP
                    </button>
                  </div>
                  
                  {aadhaarData.otpVerified && (
                    <div className="success-message">
                      <p>Aadhaar verified successfully!</p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="navigation-buttons">
              <button className="nav-button secondary" onClick={prevStep}>Back</button>
              <button 
                className="nav-button" 
                onClick={nextStep} 
                disabled={!aadhaarData.otpVerified}
              >
                Continue
              </button>
            </div>
          </div>
        );
      case 4: // Face Match
        return (
          <div className={`step-content ${transitionState}`}>
            <h2>Facial Recognition</h2>
            <div className="step-instructions">
              <p>Complete facial verification to confirm your identity.</p>
              <div className="instructions">
                <h3>Instructions:</h3>
                <ul>
                  <li>Position yourself in a well-lit area</li>
                  <li>Look directly at the camera</li>
                  <li>Remove any glasses or headwear</li>
                  <li>Follow the on-screen prompts for head movements</li>
                  <li>Stay still during the capture process</li>
                </ul>
                <div className="help-tip">
                  <p>💡 <strong>Pro Tip:</strong> Ensure your face is centered in the frame and there's good lighting.</p>
                </div>
              </div>
            </div>
            <FacialRecognition onVerificationComplete={handleFacialVerification} onError={handleError} />
            {facialVerified && (
              <div className="success-message">
                <p>Facial verification completed successfully!</p>
              </div>
            )}
            <div className="navigation-buttons">
              <button className="nav-button secondary" onClick={prevStep}>Back</button>
              <button 
                className="nav-button" 
                onClick={nextStep} 
                disabled={!facialVerified}
              >
                Continue
              </button>
            </div>
          </div>
        );
      case 5: // Final Review
        return (
          <div className={`step-content ${transitionState}`}>
            <h2>Review & Submit</h2>
            <div className="step-instructions">
              <p>Please carefully review all your information before final submission. You can edit any information by going back to the respective steps.</p>
              <div className="instructions">
                <h3>Review Checklist:</h3>
                <ul>
                  <li>Verify all personal information is correct</li>
                  <li>Confirm PAN card details are accurate</li>
                  <li>Ensure Aadhaar verification is complete</li>
                  <li>Check that facial recognition was successful</li>
                  <li>Review and accept the terms and conditions</li>
                </ul>
                <div className="help-tip">
                  <p>💡 <strong>Pro Tip:</strong> Take your time to review all details carefully. You cannot edit after submission.</p>
                </div>
              </div>
            </div>
            
            <div className="review-section">
              <div className="review-column">
                <h3>Personal Information</h3>
                <div className="review-item">
                  <div className="review-field">
                    <label>Full Name:</label>
                    <span>{personalInfo.fullName}</span>
                  </div>
                  <div className="review-field">
                    <label>Date of Birth:</label>
                    <span>{personalInfo.dateOfBirth}</span>
                  </div>
                  <div className="review-field">
                    <label>Address:</label>
                    <span>{personalInfo.address}</span>
                  </div>
                  <div className="review-field">
                    <label>Phone Number:</label>
                    <span>{personalInfo.phoneNumber}</span>
                  </div>
                  <div className="review-field">
                    <label>Email:</label>
                    <span>{personalInfo.email}</span>
                  </div>
                  <button className="edit-button" onClick={() => goToStep(1)}>Edit</button>
                </div>
                
                <h3>Document Information</h3>
                {documentData ? (
                  <div className="review-item">
                    <div className="review-field">
                      <label>Document Type:</label>
                      <span>{documentData.type}</span>
                    </div>
                    <div className="review-field">
                      <label>Document Number:</label>
                      <span>{documentData.documentNumber}</span>
                    </div>
                    <div className="review-field">
                      <label>Name on Document:</label>
                      <span>{documentData.fullName}</span>
                    </div>
                    <div className="review-field">
                      <label>Quality Score:</label>
                      <span>{documentData.qualityScore}/100</span>
                    </div>
                    <button className="edit-button" onClick={() => goToStep(2)}>Edit</button>
                  </div>
                ) : (
                  <div className="review-item error-message">
                    <p>Document not uploaded</p>
                    <button className="edit-button" onClick={() => goToStep(2)}>Upload Document</button>
                  </div>
                )}
              </div>
              
              <div className="review-column">
                <h3>Aadhaar Verification</h3>
                {aadhaarData.otpVerified ? (
                  <div className="review-item success-message">
                    <div className="review-field">
                      <label>Status:</label>
                      <span>Verified</span>
                    </div>
                    <div className="review-field">
                      <label>Aadhaar Number:</label>
                      <span>{aadhaarData.aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}</span>
                    </div>
                    <button className="edit-button" onClick={() => goToStep(3)}>Re-verify</button>
                  </div>
                ) : (
                  <div className="review-item error-message">
                    <div className="review-field">
                      <label>Status:</label>
                      <span>Pending Verification</span>
                    </div>
                    <button className="edit-button" onClick={() => goToStep(3)}>Verify Aadhaar</button>
                  </div>
                )}
                
                <h3>Biometric Verification</h3>
                {facialVerified ? (
                  <div className="review-item success-message">
                    <div className="review-field">
                      <label>Status:</label>
                      <span>Verified</span>
                    </div>
                    <button className="edit-button" onClick={() => goToStep(4)}>Re-verify</button>
                  </div>
                ) : (
                  <div className="review-item error-message">
                    <div className="review-field">
                      <label>Status:</label>
                      <span>Pending Verification</span>
                    </div>
                    <button className="edit-button" onClick={() => goToStep(4)}>Verify Face</button>
                  </div>
                )}
                
                <h3>Terms & Conditions</h3>
                <div className="review-item">
                  <div className="terms-section">
                    <p>By submitting this KYC, I agree to the following:</p>
                    <ul>
                      <li>I have provided accurate and truthful information</li>
                      <li>I authorize HDFC Bank to verify my identity</li>
                      <li>I consent to the processing of my personal data</li>
                      <li>I agree to the bank's privacy policy and terms of service</li>
                    </ul>
                  </div>
                  <div className="consent-checkbox">
                    <input 
                      type="checkbox" 
                      id="consent" 
                      // Add consent state if needed
                    />
                    <label htmlFor="consent">I agree to the terms and conditions</label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="navigation-buttons">
              <button className="nav-button secondary" onClick={prevStep}>Back</button>
              <button className="nav-button" onClick={submitKYC}>Submit KYC</button>
            </div>
            {errors.submit && (
              <div className="error-message" style={{ marginTop: '15px' }}>
                <p>{errors.submit}</p>
              </div>
            )}
          </div>
        );
      case 6: // Completion
        return (
          <div className={`step-content ${transitionState}`}>
            <h2>KYC Submission Complete</h2>
            <div className="success-message">
              <p>Your KYC has been submitted successfully!</p>
              <p>We'll notify you of the final approval status shortly.</p>
              <p>Reference Number: <strong>KYC-{Date.now()}</strong></p>
            </div>
            <button className="nav-button" onClick={() => {
              // Clear localStorage and reset state
              localStorage.removeItem('kycProgress');
              setCurrentStep(0);
              setPersonalInfo({
                fullName: '',
                dateOfBirth: '',
                address: '',
                phoneNumber: '',
                email: ''
              });
              setDocumentData(null);
              setAadhaarData({
                aadhaarNumber: '',
                otp: '',
                otpSent: false,
                otpVerified: false
              });
              setFacialVerified(false);
              setKycSession({
                userId: null,
                documentScanned: false,
                facialVerified: false,
                duplicateChecked: false,
                aadhaarVerified: false,
                submissionData: {}
              });
            }}>Start New KYC</button>
          </div>
        );
      default:
        return (
          <div className={`step-content ${transitionState}`}>
            <h2>Welcome to HDFC Digital KYC</h2>
            <p>Complete your identity verification in just a few simple steps.</p>
            <button className="nav-button" onClick={nextStep}>Get Started</button>
          </div>
        );
    }
  };

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>HDFC Digital KYC Onboarding</h1>
        <div className="user-info">
          <span>Welcome, {currentUser?.username || 'User'}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <div className="App-main">
        <KYCProgress currentStep={currentStep} totalSteps={totalSteps} steps={kycSteps} />
        {getStepContent()}
      </div>
      
      {/* Support Assistant */}
      <SupportAssistant 
        currentStep={currentStep} 
        onContactSupport={handleContactSupport} 
      />
      
      {/* Error Recovery Modal */}
      {showErrorRecovery && (
        <ErrorRecovery 
          error={error} 
          onRetry={handleRetry} 
          onRecover={handleRecover} 
        />
      )}
    </div>
  );
}

export default App;