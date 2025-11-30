# Digital KYC Onboarding System

A modern, AI-powered Know Your Customer (KYC) onboarding solution that addresses the challenges of traditional KYC processes with smart document scanning, facial recognition, and intelligent duplicate detection.

## Features

- **AI-Powered Document Scanning**: Advanced computer vision for glare removal, edge detection, and quality scoring
- **Facial Recognition**: Real-time face matching with uploaded documents
- **Duplicate Detection**: Intelligent duplicate prevention using biometric fingerprinting
- **Adaptive Retry System**: Guided assistance for error correction
- **Progressive Disclosure UX**: Step-by-step workflow with clear progress indicators
- **Real-time Validation**: OCR preview before submission

## Project Structure

```
.
├── kyc-client/          # React frontend application
│   ├── public/          # Static assets
│   └── src/             # Source code
│       ├── components/  # React components
│       ├── services/    # API services
│       ├── App.js       # Main application component
│       └── index.js     # Entry point
├── server/              # Node.js backend server
│   ├── index.js         # Main server file
│   └── package.json     # Server dependencies
├── DIGITAL_KYC_SOLUTION.md # Technical documentation
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd digital-kyc-system
   ```

2. Install client dependencies:
   ```bash
   cd kyc-client
   npm install
   ```

3. Install server dependencies:
   ```bash
   cd ../server
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. In a new terminal, start the frontend:
   ```bash
   cd kyc-client
   npm start
   ```

3. Open your browser to http://localhost:3000

## API Endpoints

- `POST /api/kyc/document-scan` - Scan and extract data from documents
- `POST /api/kyc/facial-recognition` - Verify facial data
- `POST /api/kyc/duplicate-check` - Check for duplicate entries
- `POST /api/kyc/submit` - Submit KYC data

## Technical Documentation

For detailed technical information about the solution, please refer to [DIGITAL_KYC_SOLUTION.md](DIGITAL_KYC_SOLUTION.md).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with React and Node.js
- Uses modern web technologies for optimal performance
- Implements best practices for security and scalability