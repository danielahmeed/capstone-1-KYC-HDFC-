# Digital KYC Onboarding System

A comprehensive Digital KYC (Know Your Customer) onboarding solution that addresses critical challenges in customer onboarding including high rejection rates, abandonment issues, and inefficient processing times.

## Features

### AI-Powered Document Scanning
- Smart document capture with real-time guidance
- Glare detection and removal
- Edge detection and perspective correction
- Quality scoring with immediate feedback
- Auto-enhancement for better readability
- Real-time validation feedback during scanning

### Facial Recognition & Biometric Verification
- Multi-modal biometric verification
- Liveness detection to prevent photo spoofing
- Real-time face matching with document photo
- Secure biometric template storage

### Intelligent Duplicate Detection
- Document number based duplicate checking
- Biometric fingerprinting for advanced duplicate prevention
- Real-time duplicate detection before processing

### Adaptive Retry Guidance System
- Failure pattern analysis
- Personalized retry suggestions
- Context-specific assistance for common error scenarios

### Progressive UX Flow
- Step-by-step workflow with clear progress indicators
- Smooth transitions and animations between steps
- Responsive design for all devices
- Real-time status updates

### Real-time OCR Validation
- Field-specific validation for document data
- Quality scoring based on multiple factors
- Immediate feedback on extracted information

## Technology Stack

### Frontend
- React.js for user interface
- Tesseract.js for client-side OCR
- HTML5 Canvas for image processing
- CSS3 for styling and animations

### Backend
- Node.js with Express.js framework
- SQLite for data storage
- Sharp.js for image processing
- Tesseract.js for server-side OCR
- Face-API.js for facial recognition

### DevOps
- NPM for package management
- ESLint for code quality
- Git for version control

## Project Structure

```
.
├── kyc-client/              # React frontend application
│   ├── public/              # Static assets
│   ├── src/                 # Source code
│   │   ├── components/      # React components
│   │   ├── services/        # API service layer
│   │   └── ...              # Other frontend files
│   └── package.json         # Frontend dependencies
├── server/                  # Node.js backend server
│   ├── index.js             # Main server file
│   ├── db.js                # Database operations
│   └── package.json         # Backend dependencies
├── DIGITAL_KYC_SOLUTION.md  # Technical documentation
└── README.md                # This file
```

## Getting Started

### Prerequisites
- Node.js v14 or higher
- NPM v6 or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/danielahmeed/capstone-1-KYC-HDFC-.git
cd capstone-1-KYC-HDFC-
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Install frontend dependencies:
```bash
cd ../kyc-client
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```
The server will start on port 5000.

2. Start the frontend development server:
```bash
cd kyc-client
npm start
```
The frontend will start on port 3000.

3. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Document Scanning
- `POST /api/kyc/document-scan` - Process document image and extract data

### Facial Recognition
- `POST /api/kyc/facial-recognition` - Verify user identity through facial recognition

### Duplicate Check
- `POST /api/kyc/duplicate-check` - Check for existing records

### Retry Guidance
- `POST /api/kyc/retry-guidance` - Get personalized retry suggestions

### KYC Submission
- `POST /api/kyc/submit` - Submit completed KYC for processing

## Key Components

### Document Scanner
The document scanner component provides:
- Camera access with real-time guidance
- File upload as alternative input method
- Real-time validation feedback (brightness, contrast)
- Quality scoring based on image characteristics
- OCR processing with field-specific validation

### Facial Recognition
The facial recognition component includes:
- Live camera feed for selfie capture
- Liveness detection to prevent spoofing
- Face matching with document photo
- Confidence scoring for verification

### KYC Progress Tracker
The progress tracker shows:
- Current step in the KYC process
- Completed steps
- Navigation between steps
- Smooth transitions and animations

## Expected Business Impact

- **40% reduction** in drop-off rates
- **30% improvement** in scanning success rates
- **20-25% increase** in overall KYC acceptance rates
- **Under 45 seconds** total KYC processing time
- **95% accuracy** in duplicate detection

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who participated in this project
- Special recognition to the HDFC team for their support and guidance