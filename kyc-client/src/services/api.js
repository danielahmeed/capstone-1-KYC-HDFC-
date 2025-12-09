// API service for communicating with the backend

// API service for communicating with the backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// Retry utility function
const retry = async (fn, retries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i === retries) break;

      console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError;
};

// Error handling utility
const handleApiError = (error) => {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      success: false,
      message: 'Network error. Please check your internet connection and try again.',
      type: 'NETWORK_ERROR'
    };
  }

  if (error.message.includes('HTTP error')) {
    const statusCode = error.message.match(/\d+/)[0];
    switch (statusCode) {
      case '401':
        return {
          success: false,
          message: 'Authentication failed. Please log in again.',
          type: 'AUTH_ERROR'
        };
      case '429':
        return {
          success: false,
          message: 'Too many requests. Please wait a moment and try again.',
          type: 'RATE_LIMIT_ERROR'
        };
      case '500':
        return {
          success: false,
          message: 'Server error. Please try again later.',
          type: 'SERVER_ERROR'
        };
      default:
        return {
          success: false,
          message: `Request failed with status ${statusCode}. Please try again.`,
          type: 'REQUEST_ERROR'
        };
    }
  }

  // Check for specific error messages
  if (error.message.includes('document')) {
    return {
      success: false,
      message: error.message,
      type: 'DOCUMENT_SCAN_ERROR'
    };
  }

  if (error.message.includes('facial') || error.message.includes('face')) {
    return {
      success: false,
      message: error.message,
      type: 'FACIAL_RECOGNITION_ERROR'
    };
  }

  if (error.message.includes('aadhaar') || error.message.includes('otp')) {
    return {
      success: false,
      message: error.message,
      type: 'AADHAAR_OTP_ERROR'
    };
  }

  return {
    success: false,
    message: error.message || 'An unexpected error occurred. Please try again.',
    type: 'UNKNOWN_ERROR'
  };
};

class APIService {
  // Store JWT token
  static token = null;

  // Set JWT token
  static setToken(token) {
    this.token = token;
  }

  // Get headers with JWT token
  static getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Login endpoint
  static async login(credentials) {
    return retry(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data.token) {
          this.setToken(data.data.token);
        }

        return data;
      } catch (error) {
        console.error('Error logging in:', error);
        throw error;
      }
    });
  }

  // Save KYC progress
  static async saveKYCProgress(progressData) {
    return retry(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/kyc/save-progress`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ progressData }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error saving KYC progress:', error);
        throw error;
      }
    });
  }

  // Get KYC progress
  static async getKYCProgress() {
    return retry(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/kyc/progress`, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error getting KYC progress:', error);
        throw error;
      }
    });
  }

  // Document scanning
  static async scanDocument(documentData) {
    return retry(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/kyc/document-scan`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(documentData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error scanning document:', error);
        throw error;
      }
    });
  }

  // Facial recognition
  static async verifyFacialData(facialData) {
    return retry(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/kyc/facial-recognition`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(facialData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error verifying facial data:', error);
        throw error;
      }
    });
  }

  // Duplicate check
  static async checkForDuplicates(personalInfo) {
    return retry(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/kyc/duplicate-check`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(personalInfo),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error checking for duplicates:', error);
        throw error;
      }
    });
  }

  // Send Aadhaar OTP
  static async sendAadhaarOTP(aadhaarData) {
    return retry(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/kyc/aadhaar/send-otp`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(aadhaarData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error sending Aadhaar OTP:', error);
        throw error;
      }
    });
  }

  // Verify Aadhaar OTP
  static async verifyAadhaarOTP(verificationData) {
    return retry(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/kyc/aadhaar/verify-otp`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(verificationData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error verifying Aadhaar OTP:', error);
        throw error;
      }
    });
  }

  // Get KYC Dashboard Data
  static async getKYCDashboardData() {
    return retry(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/kyc/dashboard`, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error getting KYC dashboard data:', error);
        throw error;
      }
    });
  }

  // Submit KYC
  static async submitKYC(kycData) {
    return retry(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/kyc/submit`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(kycData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error submitting KYC:', error);
        throw error;
      }
    });
  }

  // Error recovery method
  static async recoverFromError(error) {
    const errorInfo = handleApiError(error);

    // Handle specific error types
    switch (errorInfo.type) {
      case 'AUTH_ERROR':
        // Clear token and redirect to login
        this.setToken(null);
        window.location.href = '/login';
        break;
      case 'NETWORK_ERROR':
        // Show offline message
        console.log('Showing offline message to user');
        break;
      case 'RATE_LIMIT_ERROR':
        // Show rate limit message
        console.log('Showing rate limit message to user');
        break;
      default:
        // Show generic error message
        console.log('Showing generic error message to user');
    }

    return errorInfo;
  }

  // Circuit breaker pattern implementation
  static circuitBreaker = {
    state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
    failureCount: 0,
    failureThreshold: 5,
    timeout: 60000, // 1 minute
    nextAttempt: Date.now()
  };

  // Enhanced retry with circuit breaker
  static async resilientCall(apiCall) {
    // Check circuit breaker state
    if (this.circuitBreaker.state === 'OPEN') {
      if (Date.now() > this.circuitBreaker.nextAttempt) {
        this.circuitBreaker.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN. Service temporarily unavailable.');
      }
    }

    try {
      const result = await apiCall();
      // Success - reset circuit breaker
      this.circuitBreaker.failureCount = 0;
      this.circuitBreaker.state = 'CLOSED';
      return result;
    } catch (error) {
      // Failure - increment failure count
      this.circuitBreaker.failureCount++;

      if (this.circuitBreaker.failureCount >= this.circuitBreaker.failureThreshold) {
        this.circuitBreaker.state = 'OPEN';
        this.circuitBreaker.nextAttempt = Date.now() + this.circuitBreaker.timeout;
      }

      throw error;
    }
  }

  // Fallback mechanisms for critical operations
  static async saveKYCProgressWithFallback(progressData) {
    try {
      return await this.saveKYCProgress(progressData);
    } catch (error) {
      console.warn('Primary save failed, attempting fallback...', error);

      // Fallback 1: Save to localStorage
      try {
        localStorage.setItem('kycProgressBackup', JSON.stringify(progressData));
        console.log('Saved to localStorage as fallback');
        return { success: true, message: 'Progress saved locally' };
      } catch (localStorageError) {
        console.error('LocalStorage fallback failed:', localStorageError);
      }

      // Fallback 2: Save to sessionStorage
      try {
        sessionStorage.setItem('kycProgressBackup', JSON.stringify(progressData));
        console.log('Saved to sessionStorage as fallback');
        return { success: true, message: 'Progress saved in session' };
      } catch (sessionStorageError) {
        console.error('SessionStorage fallback failed:', sessionStorageError);
      }

      // All fallbacks failed
      throw new Error('Unable to save progress. Please check your connection and try again.');
    }
  }

  // Auto-recovery mechanism
  static async autoRecover() {
    // Try to restore from localStorage backup
    try {
      const localStorageBackup = localStorage.getItem('kycProgressBackup');
      if (localStorageBackup) {
        const progressData = JSON.parse(localStorageBackup);
        await this.saveKYCProgress(progressData);
        localStorage.removeItem('kycProgressBackup');
        console.log('Recovered progress from localStorage backup');
        return { success: true, source: 'localStorage' };
      }
    } catch (error) {
      console.error('Failed to recover from localStorage:', error);
    }

    // Try to restore from sessionStorage backup
    try {
      const sessionStorageBackup = sessionStorage.getItem('kycProgressBackup');
      if (sessionStorageBackup) {
        const progressData = JSON.parse(sessionStorageBackup);
        await this.saveKYCProgress(progressData);
        sessionStorage.removeItem('kycProgressBackup');
        console.log('Recovered progress from sessionStorage backup');
        return { success: true, source: 'sessionStorage' };
      }
    } catch (error) {
      console.error('Failed to recover from sessionStorage:', error);
    }

    return { success: false, message: 'No backup data found' };
  }
}

export default APIService;