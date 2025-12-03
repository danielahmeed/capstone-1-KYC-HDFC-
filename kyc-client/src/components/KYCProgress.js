import React from 'react';
import './KYCProgress.css';

const KYCProgress = ({ currentStep, totalSteps, steps }) => {
  // Default steps if not provided
  const defaultSteps = [
    { id: 0, name: 'Welcome', description: 'Start your KYC process' },
    { id: 1, name: 'Personal Info', description: 'Enter your personal details' },
    { id: 2, name: 'PAN Upload', description: 'Upload your PAN card' },
    { id: 3, name: 'Aadhaar OTP', description: 'Verify your Aadhaar number' },
    { id: 4, name: 'Face Match', description: 'Verify your identity with facial recognition' },
    { id: 5, name: 'Final Review', description: 'Review and submit your information' },
    { id: 6, name: 'Completion', description: 'KYC process completed' }
  ];
  
  const progressSteps = steps || defaultSteps;

  return (
    <div className="kyc-progress">
      <h2>KYC Progress</h2>
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${totalSteps > 0 ? (currentStep / (totalSteps - 1)) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="step-indicators">
          {progressSteps.map((step, index) => (
            <div 
              key={step.id} 
              className={`step ${index < currentStep ? 'completed' : index === currentStep ? 'active' : ''}`}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-label">{step.name}</div>
              <div className="step-description">{step.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KYCProgress;