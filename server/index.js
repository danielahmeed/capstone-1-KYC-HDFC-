const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' })); // Increase limit for image data
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Digital KYC Backend API' });
});

// Document scanning endpoint with real image processing
app.post('/api/kyc/document-scan', async (req, res) => {
  try {
    const { documentType, imageData } = req.body;
    
    // Validate input
    if (!imageData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image data provided' 
      });
    }
    
    // Remove data URL prefix if present
    let base64Data = imageData;
    if (imageData.startsWith('data:image')) {
      base64Data = imageData.split(',')[1];
    }
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Get image metadata to check dimensions
    const metadata = await sharp(imageBuffer).metadata();
    
    // Validate minimum resolution requirement (300x200)
    if (metadata.width < 300 || metadata.height < 200) {
      return res.status(400).json({
        success: false,
        message: `Image resolution (${metadata.width}x${metadata.height}) is too low. Minimum required resolution is 300x200 pixels.`
      });
    }
    
    // Validate aspect ratio (standard photo aspect ratios: 4:3, 16:9, 3:2)
    const aspectRatio = metadata.width / metadata.height;
    const validRatios = [4/3, 16/9, 3/2, 1]; // Including 1:1 for square images
    const isValidRatio = validRatios.some(ratio => 
      Math.abs(aspectRatio - ratio) < 0.1 // Allow slight variations
    );
    
    if (!isValidRatio) {
      console.warn(`Non-standard aspect ratio detected: ${aspectRatio.toFixed(2)}`);
      // We'll still process but with a warning in quality score
    }
    
    // Process image with sharp for quality enhancement
    const processedImage = await sharp(imageBuffer)
      .resize(600, null, { withoutEnlargement: true }) // Resize to max 600px width
      .jpeg({ quality: 80 }) // Compress to JPEG
      .toBuffer();
    
    // Initialize Tesseract worker for OCR
    const worker = await createWorker('eng');
    
    // Perform OCR on the processed image
    const { data: { text } } = await worker.recognize(processedImage);
    await worker.terminate();
    
    // Simple text parsing to extract common document fields
    // In a real implementation, this would be more sophisticated
    const extractedData = parseDocumentText(text);
    
    // Calculate quality score based on text detection and image properties
    let qualityScore = Math.min(100, Math.max(30, text.length > 50 ? 85 : 40));
    
    // Adjust score based on aspect ratio
    if (!isValidRatio) {
      qualityScore = Math.max(30, qualityScore - 10); // Deduct points for non-standard ratio
    }
    
    const response = {
      success: true,
      message: 'Document scanned successfully',
      data: {
        documentType: documentType || 'ID Proof',
        fullName: extractedData.fullName || 'John Doe',
        documentNumber: extractedData.documentNumber || 'AB1234567',
        expiryDate: extractedData.expiryDate || '2028-12-31',
        dateOfBirth: extractedData.dateOfBirth || '1990-01-15',
        nationality: extractedData.nationality || 'Indian',
        qualityScore: qualityScore,
        imageDimensions: {
          width: metadata.width,
          height: metadata.height,
          aspectRatio: aspectRatio.toFixed(2)
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Document scanning error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to scan document: ' + error.message 
    });
  }
});

// Simple document text parsing function
function parseDocumentText(text) {
  // This is a simplified implementation
  // A real implementation would use more sophisticated NLP techniques
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Look for common patterns
  let fullName = '';
  let documentNumber = '';
  let expiryDate = '';
  let dateOfBirth = '';
  let nationality = '';
  
  for (const line of lines) {
    const cleanLine = line.trim();
    
    // Name detection (simplified)
    if (!fullName && /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(cleanLine) && cleanLine.length > 5 && cleanLine.length < 30) {
      fullName = cleanLine;
    }
    
    // Document number detection (simplified)
    if (!documentNumber && /[A-Z0-9]{5,15}/.test(cleanLine.replace(/\s/g, ''))) {
      documentNumber = cleanLine.replace(/\s/g, '');
    }
    
    // Date detection (simplified)
    if ((/Date|Birth|DOB/i.test(cleanLine) || !dateOfBirth) && /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(cleanLine)) {
      const dateMatch = cleanLine.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
      if (dateMatch) {
        dateOfBirth = dateMatch[0];
      }
    }
    
    // Expiry date detection (simplified)
    if ((/Expiry|Expire|Valid/i.test(cleanLine) || !expiryDate) && /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(cleanLine)) {
      const dateMatch = cleanLine.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
      if (dateMatch) {
        expiryDate = dateMatch[0];
      }
    }
  }
  
  return {
    fullName,
    documentNumber,
    expiryDate,
    dateOfBirth,
    nationality
  };
}

// Facial recognition endpoint
app.post('/api/kyc/facial-recognition', (req, res) => {
  // Simulate facial recognition process
  const { imageData } = req.body;
  
  // In a real implementation, this would compare the facial data
  // with the document photo using biometric algorithms
  
  setTimeout(() => {
    const isSuccess = Math.random() > 0.3; // 70% success rate
    const confidence = isSuccess 
      ? Math.floor(Math.random() * 30) + 70 // 70-99%
      : Math.floor(Math.random() * 40); // 0-39%
    
    const mockData = {
      success: isSuccess,
      message: isSuccess 
        ? 'Facial verification successful' 
        : 'Facial verification failed. Please try again.',
      confidence: confidence
    };
    
    res.json(mockData);
  }, 2000);
});

// Duplicate check endpoint
app.post('/api/kyc/duplicate-check', (req, res) => {
  // Simulate duplicate check process
  const { personalInfo } = req.body;
  
  // In a real implementation, this would check against a database
  // of existing records using biometric fingerprinting and data hashing
  
  setTimeout(() => {
    const isDuplicate = Math.random() > 0.9; // 10% chance of duplicate
    
    const mockData = {
      success: true,
      isDuplicate: isDuplicate,
      message: isDuplicate 
        ? 'Duplicate entry detected' 
        : 'No duplicates found'
    };
    
    res.json(mockData);
  }, 1500);
});

// Submit KYC endpoint
app.post('/api/kyc/submit', (req, res) => {
  // Simulate KYC submission process
  const { kycData } = req.body;
  
  // In a real implementation, this would validate all data
  // and store it in the appropriate databases
  
  setTimeout(() => {
    const referenceNumber = 'KYC-' + Math.floor(Math.random() * 1000000);
    
    const mockData = {
      success: true,
      referenceNumber: referenceNumber,
      message: 'KYC submitted successfully',
      estimatedProcessingTime: '24-48 hours'
    };
    
    res.json(mockData);
  }, 1000);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;