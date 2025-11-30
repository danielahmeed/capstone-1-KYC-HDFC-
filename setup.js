const fs = require('fs');
const path = require('path');

// Create a setup script to initialize the project
console.log('Setting up Digital KYC System...');

// Check if required directories exist
const requiredDirs = ['kyc-client', 'server'];

for (const dir of requiredDirs) {
  if (!fs.existsSync(path.join(__dirname, dir))) {
    console.error(`Error: ${dir} directory not found!`);
    process.exit(1);
  }
}

console.log('✓ Project structure verified');

// Check if package.json exists in client directory
if (!fs.existsSync(path.join(__dirname, 'kyc-client', 'package.json'))) {
  console.error('Error: kyc-client/package.json not found!');
  process.exit(1);
}

console.log('✓ Client package.json verified');

// Check if package.json exists in server directory
if (!fs.existsSync(path.join(__dirname, 'server', 'package.json'))) {
  console.error('Error: server/package.json not found!');
  process.exit(1);
}

console.log('✓ Server package.json verified');

// Check if index.js exists in server directory
if (!fs.existsSync(path.join(__dirname, 'server', 'index.js'))) {
  console.error('Error: server/index.js not found!');
  process.exit(1);
}

console.log('✓ Server index.js verified');

console.log('\nDigital KYC System setup complete!');
console.log('\nTo run the application:');
console.log('1. Start the backend server:');
console.log('   cd server');
console.log('   npm run dev');
console.log('\n2. In a new terminal, start the frontend:');
console.log('   cd kyc-client');
console.log('   npm start');
console.log('\n3. Open your browser to http://localhost:3000');