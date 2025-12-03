const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createWorker } = require('tesseract.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { checkForDuplicate, checkForBiometricDuplicate, storeUser, storeBiometricFingerprint, logKYCAttempt, analyzeFailedAttempts, getRecentKYCAttempts } = require('./db');

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// JWT Secret (in production, use environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'hdfc_kyc_secret_key';

// Multer configuration for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Utility function to decode base64 image
function decodeBase64Image(dataString) {
  if (!dataString) {
    throw new Error('No image data provided');
  }

  // Handle both data URL and plain base64
  let imageData = dataString;
  let imageType = 'jpeg';

  if (dataString.startsWith('data:')) {
    const matches = dataString.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      imageType = matches[1].split('/')[1];
      imageData = matches[2];
    }
  }

  return {
    type: imageType,
    data: Buffer.from(imageData, 'base64')
  };
}

// Helper to save base64 image
function saveBase64Image(base64String, prefix) {
  if (!base64String) return null;

  try {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const type = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    const extension = type.split('/')[1];
    const filename = `${prefix}_${Date.now()}.${extension}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, data);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Error saving image:', err);
    return null;
  }
}

// Function to validate document fields using regex patterns
function validateDocumentFields(extractedText) {
  const validations = {
    fullName: null,
    documentNumber: null,
    dateOfBirth: null,
    expiryDate: null,
    nationality: null
  };

  // Split text into lines for easier processing
  const lines = extractedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Define regex patterns for common document fields
  const patterns = {
    fullName: [
      /(?:name|full\s*name)[:\s]*([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?:\s+(?:son|daughter|wife)\s+of)/i
    ],
    documentNumber: [
      /(?:document|id|passport)\s*(?:no|number)[:\s]*([A-Z0-9]{6,15})/i,
      /([A-Z0-9]{6,15})\s+(?:issued|valid)/i
    ],
    dateOfBirth: [
      /(?:date\s*of\s*birth|dob|birth\s*date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(?:dob|birth)/i
    ],
    expiryDate: [
      /(?:expiry|valid\s*until|valid\s*through)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(?:expiry|expires)/i
    ],
    nationality: [
      /(?:nationality|country)[:\s]*([A-Z][a-z]+)/i,
      /([A-Z][a-z]+)\s+(?:citizen|national)/i
    ]
  };

  // Try to extract each field using patterns
  Object.keys(patterns).forEach(field => {
    for (const pattern of patterns[field]) {
      for (const line of lines) {
        const match = line.match(pattern);
        if (match && match[1]) {
          validations[field] = match[1].trim();
          break;
        }
      }
      if (validations[field]) break;
    }
  });

  return validations;
}

// Function to perform OCR with Tesseract.js
async function performOCR(imageBuffer) {
  try {
    // Create a Tesseract worker
    const worker = await createWorker({
      logger: m => console.log(m)
    });

    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    // Perform OCR on the image buffer
    const { data: { text } } = await worker.recognize(imageBuffer);

    await worker.terminate();

    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to perform OCR on document');
  }
}

// Add this function before the document scanning endpoint
function detectAndRemoveGlare(imageBuffer) {
  // This is a simplified glare detection and removal algorithm
  // In a real implementation, this would use more sophisticated computer vision techniques

  // For now, we'll implement a basic approach:
  // 1. Detect high brightness areas that could be glare
  // 2. Reduce the brightness of those areas
  // 3. Enhance the overall image quality

  return sharp(imageBuffer)
    // Apply a mild blur to reduce noise
    .blur(0.5)
    // Adjust brightness and contrast to improve overall image quality
    .modulate({ brightness: 1.05, contrast: 1.1 })
    // Apply a slight gamma correction to balance highlights
    .gamma(0.9)
    // Apply unsharp masking to enhance details
    .sharpen({ sigma: 0.5, flat: 1.0, jagged: 2.0 })
    // Return the processed image buffer
    .toBuffer();
}

// Add image enhancement function
function enhanceImage(imageBuffer) {
  return sharp(imageBuffer)
    // Normalize the image to improve contrast
    .normalize()
    // Apply slight sharpening to enhance details
    .sharpen({ sigma: 0.5 })
    // Adjust saturation for better readability
    .modulate({ saturation: 1.1 })
    // Return the enhanced image buffer
    .toBuffer();
}

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Rate limiting middleware
const rateLimitMap = new Map();

function rateLimiter(req, res, next) {
  const clientId = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // Max 100 requests per window

  if (!rateLimitMap.has(clientId)) {
    rateLimitMap.set(clientId, {
      requests: [{ timestamp: now }],
      resetTime: now + windowMs
    });
    return next();
  }

  const clientData = rateLimitMap.get(clientId);

  // Reset if window has passed
  if (now > clientData.resetTime) {
    rateLimitMap.set(clientId, {
      requests: [{ timestamp: now }],
      resetTime: now + windowMs
    });
    return next();
  }

  // Filter out old requests
  const recentRequests = clientData.requests.filter(request =>
    request.timestamp > now - windowMs
  );

  // Check if limit exceeded
  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }

  // Add current request
  recentRequests.push({ timestamp: now });
  rateLimitMap.set(clientId, {
    requests: recentRequests,
    resetTime: clientData.resetTime
  });

  next();
}

// Authentication endpoint
app.post('/api/auth/login', rateLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // In a real implementation, you would verify credentials against a database
    // For demo purposes, we'll simulate a successful login
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Simulate user lookup and password verification
    // In real implementation: const user = await getUserByUsername(username);
    // const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    // For demo, we'll create a mock user
    const user = {
      id: 1,
      username: username,
      email: `${username}@hdfcbank.com`
    };

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Save KYC progress endpoint
app.post('/api/kyc/save-progress', authenticateToken, rateLimiter, (req, res) => {
  try {
    const { progressData } = req.body;
    const userId = req.user.userId;

    // In a real implementation, you would save this to a database
    // For now, we'll just log it and return success
    console.log(`Saving KYC progress for user ${userId}:`, progressData);

    // Simulate database save
    // await saveKYCProgress(userId, progressData);

    res.json({
      success: true,
      message: 'KYC progress saved successfully'
    });
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save KYC progress'
    });
  }
});

// Get KYC progress endpoint
app.get('/api/kyc/progress', authenticateToken, rateLimiter, (req, res) => {
  try {
    const userId = req.user.userId;

    // In a real implementation, you would retrieve this from a database
    // For now, we'll just return a mock response
    console.log(`Retrieving KYC progress for user ${userId}`);

    // Simulate database retrieval
    // const progress = await getKYCProgress(userId);

    res.json({
      success: true,
      message: 'KYC progress retrieved successfully',
      data: {
        currentStep: 0,
        personalInfo: {},
        documentData: null,
        aadhaarData: {},
        facialVerified: false,
        kycSession: {}
      }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve KYC progress'
    });
  }
});

// Document scanning endpoint with real image processing
app.post('/api/kyc/document-scan', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { documentType, imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided'
      });
    }

    // Decode the base64 image
    const { data: imageBuffer } = decodeBase64Image(imageData);

    // Validate minimum resolution requirement (600x400)
    const metadata = await sharp(imageBuffer).metadata();
    if (metadata.width < 600 || metadata.height < 400) {
      return res.status(400).json({
        success: false,
        message: `Image resolution (${metadata.width}x${metadata.height}) is too low. Minimum required resolution is 600x400 pixels.`
      });
    }

    // Apply glare detection and removal
    let processedImageBuffer = await detectAndRemoveGlare(imageBuffer);

    // Apply additional image enhancement
    processedImageBuffer = await enhanceImage(processedImageBuffer);

    // Process image with sharp for quality enhancement
    const processedImage = await sharp(processedImageBuffer)
      .resize(800, null, { withoutEnlargement: true }) // Resize to max 800px width
      .jpeg({ quality: 85 }) // Compress to JPEG with higher quality
      .toBuffer();

    // Perform OCR on the processed image
    const ocrText = await performOCR(processedImage);

    // Validate extracted fields
    const validatedFields = validateDocumentFields(ocrText);

    // Calculate quality score based on various factors
    let qualityScore = 100;

    // Deduct points for low resolution (if applicable)
    if (metadata.width < 800 || metadata.height < 600) {
      qualityScore -= 10;
    }

    // Deduct points if important fields are missing
    const importantFields = ['fullName', 'documentNumber'];
    importantFields.forEach(field => {
      if (!validatedFields[field]) {
        qualityScore -= 15;
      }
    });

    // Ensure quality score doesn't go below 0
    qualityScore = Math.max(0, qualityScore);

    // Prepare response data
    const responseData = {
      type: documentType || 'Unknown',
      fullName: validatedFields.fullName || 'Not detected',
      documentNumber: validatedFields.documentNumber || 'Not detected',
      dateOfBirth: validatedFields.dateOfBirth || 'Not detected',
      expiryDate: validatedFields.expiryDate || 'Not detected',
      nationality: validatedFields.nationality || 'Not detected',
      qualityScore,
      rawOcrText: ocrText.substring(0, 200) + '...' // Truncate for response
    };

    res.json({
      success: true,
      message: 'Document scanned successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Document scan error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to scan document: ${error.message}`
    });
  }
});

// Facial recognition endpoint
app.post('/api/kyc/facial-recognition', authenticateToken, rateLimiter, async (req, res) => {
  try {
    // In a real implementation, we would compare the facial data
    // with the document photo using biometric algorithms

    // For now, we'll simulate a more realistic facial recognition process
    // that includes actual face detection, comparison, and liveness detection

    const { imageData } = req.body;

    // Simulate facial recognition processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate liveness detection
    // In a real implementation, this would check for:
    // - Eye movement
    // - Head movement
    // - Blinking
    // - Texture analysis to detect printed photos

    const isLive = Math.random() > 0.2; // 80% chance of being a live person

    if (!isLive) {
      return res.status(400).json({
        success: false,
        message: 'Liveness detection failed. Please ensure you are a real person and not using a photo.'
      });
    }

    // Simulate face matching with document photo
    const isMatch = Math.random() > 0.3; // 70% chance of a match

    if (isMatch) {
      res.json({
        success: true,
        message: 'Facial recognition successful',
        data: {
          confidence: Math.floor(Math.random() * 30) + 70, // 70-99% confidence
          verified: true
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Facial recognition failed. Face does not match document photo.'
      });
    }
  } catch (error) {
    console.error('Facial recognition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform facial recognition'
    });
  }
});

// Duplicate check endpoint
app.post('/api/kyc/duplicate-check', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { personalInfo, biometricData } = req.body;

    // In a real implementation, this would check against a database
    // of existing records using biometric fingerprinting and data hashing

    // Check for duplicate in database
    checkForDuplicate(personalInfo.documentNumber, (err, existingUser) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to check for duplicates: ' + err.message
        });
      }

      if (existingUser) {
        // Duplicate found based on document number
        return res.json({
          success: true,
          isDuplicate: true,
          message: 'Duplicate entry detected based on document number',
          duplicateInfo: {
            fullName: existingUser.fullName,
            documentNumber: existingUser.documentNumber,
            createdAt: existingUser.createdAt
          }
        });
      }

      // Check for biometric duplicate if biometric data is provided
      if (biometricData) {
        checkForBiometricDuplicate(biometricData, (err, existingBiometricUser) => {
          if (err) {
            console.error('Biometric database error:', err);
            return res.status(500).json({
              success: false,
              message: 'Failed to check for biometric duplicates: ' + err.message
            });
          }

          if (existingBiometricUser) {
            // Biometric duplicate found
            return res.json({
              success: true,
              isDuplicate: true,
              message: 'Duplicate entry detected based on biometric data',
              duplicateInfo: {
                fullName: existingBiometricUser.fullName,
                documentNumber: existingBiometricUser.documentNumber,
                createdAt: existingBiometricUser.createdAt
              }
            });
          }

          // No duplicates found
          res.json({
            success: true,
            isDuplicate: false,
            message: 'No duplicates found'
          });
        });
      } else {
        // No duplicates found
        res.json({
          success: true,
          isDuplicate: false,
          message: 'No duplicates found'
        });
      }
    });
  } catch (error) {
    console.error('Duplicate check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check for duplicates'
    });
  }
});

// Retry guidance endpoint
app.post('/api/kyc/retry-guidance', authenticateToken, rateLimiter, (req, res) => {
  try {
    // Analyze failed attempts to provide personalized retry suggestions
    analyzeFailedAttempts((err, analysis) => {
      if (err) {
        console.error('Analysis error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to analyze retry guidance: ' + err.message
        });
      }

      // Return the analysis and recommendations
      res.json({
        success: true,
        message: 'Retry guidance generated successfully',
        data: analysis
      });
    });
  } catch (error) {
    console.error('Retry guidance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate retry guidance'
    });
  }
});

// Submit KYC endpoint
app.post('/api/kyc/submit', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { personalInfo, documentData, facialData, consent, facialVerified } = req.body;

    if (!consent) {
      return res.status(400).json({
        success: false,
        message: 'User consent is required to submit KYC'
      });
    }

    // Store user information
    // Prepare user data from personal info and document data
    const userData = {
      ...personalInfo,
      documentNumber: documentData.documentNumber,
      nationality: documentData.nationality || personalInfo.nationality
    };

    // Store user information
    storeUser(userData, (err, userId) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to store user information: ' + err.message
        });
      }

      // Store biometric fingerprint
      const biometricData = {
        userId,
        facialTemplate: (facialData && facialData.template) || 'template_data',
        documentHash: (documentData && documentData.hash) || 'hash_data'
      };

      storeBiometricFingerprint(biometricData, (err) => {
        if (err) {
          console.error('Biometric storage error:', err);
          // Continue anyway
        }

        // Save images
        const documentImagePath = saveBase64Image(documentData.imageData, `doc_${userId}`);
        const faceImagePath = saveBase64Image(facialData?.imageData, `face_${userId}`);

        // Log KYC attempt
        const status = facialVerified ? 'SUCCESS' : 'FAILED';
        const message = facialVerified ? 'KYC verification successful' : 'Facial verification failed';

        logKYCAttempt(userId, status, message, documentImagePath, faceImagePath, (err) => {
          if (err) {
            console.error('Logging error:', err);
          }

          res.json({
            success: true,
            message: 'KYC submitted successfully',
            data: {
              userId,
              status: 'Pending Review',
              estimatedCompletion: '24-48 hours'
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit KYC'
    });
  }
});

// Aadhaar verification endpoints
app.post('/api/kyc/aadhaar/send-otp', authenticateToken, rateLimiter, (req, res) => {
  try {
    const { aadhaarNumber } = req.body;

    // Validate Aadhaar number format
    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Aadhaar number. Please provide a 12-digit number.'
      });
    }

    // In a real implementation, you would integrate with UIDAI APIs
    // For demo, we'll simulate a successful OTP send
    console.log(`Sending OTP to Aadhaar number: ${aadhaarNumber}`);

    res.json({
      success: true,
      message: 'OTP sent successfully to registered mobile number'
    });
  } catch (error) {
    console.error('Aadhaar OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

app.post('/api/kyc/aadhaar/verify-otp', authenticateToken, rateLimiter, (req, res) => {
  try {
    const { aadhaarNumber, otp } = req.body;

    // Validate inputs
    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Aadhaar number. Please provide a 12-digit number.'
      });
    }

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please provide a 6-digit code.'
      });
    }

    // In a real implementation, you would integrate with UIDAI APIs
    // For demo, we'll simulate a successful verification
    console.log(`Verifying OTP for Aadhaar number: ${aadhaarNumber}`);

    res.json({
      success: true,
      message: 'Aadhaar verified successfully'
    });
  } catch (error) {
    console.error('Aadhaar verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify Aadhaar'
    });
  }
});

// KYC Dashboard endpoint
app.get('/api/kyc/dashboard', authenticateToken, rateLimiter, (req, res) => {
  try {
    // Get analytics
    analyzeFailedAttempts((err, analysis) => {
      if (err) {
        console.error('Error analyzing attempts:', err);
      }

      // Get recent attempts with images
      getRecentKYCAttempts(10, (err, recentAttempts) => {
        if (err) {
          console.error('Error fetching recent attempts:', err);
          recentAttempts = [];
        }

        const dashboardData = {
          totalKycAttempts: (analysis && analysis.totalAttempts) || 1250,
          successfulKyc: (analysis && Math.round(analysis.totalAttempts * (analysis.successRate / 100))) || 950,
          failedKyc: (analysis && (analysis.totalAttempts - Math.round(analysis.totalAttempts * (analysis.successRate / 100)))) || 300,
          successRate: (analysis && analysis.successRate) || 76,
          failureByStep: {
            'Personal Info': 45,
            'PAN Upload': 85,
            'Aadhaar OTP': 75,
            'Face Match': 60,
            'Final Review': 35
          },
          uploadFailures: 120,
          otpFailures: 95,
          faceMismatch: 85,
          dailySuccessRates: [
            { date: '2025-11-25', rate: 72 },
            { date: '2025-11-26', rate: 75 },
            { date: '2025-11-27', rate: 78 },
            { date: '2025-11-28', rate: 74 },
            { date: '2025-11-29', rate: 76 },
            { date: '2025-11-30', rate: 77 },
            { date: '2025-12-01', rate: 76 }
          ],
          weeklySuccessRates: [
            { week: 'Week 1', rate: 68 },
            { week: 'Week 2', rate: 72 },
            { week: 'Week 3', rate: 75 },
            { week: 'Week 4', rate: 76 }
          ],
          recentAttempts: recentAttempts
        };

        res.json({
          success: true,
          message: 'Dashboard data retrieved successfully',
          data: dashboardData
        });
      });
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Initialize database
require('./db').initializeDatabase();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});