const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or connect to the database
const db = new sqlite3.Database(path.join(__dirname, 'kyc.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the KYC database.');
  }
});

// Initialize the database schema
function initializeDatabase() {
  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    documentNumber TEXT UNIQUE NOT NULL,
    dateOfBirth TEXT,
    nationality TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table created or already exists.');
    }
  });

  // Create biometric_fingerprints table
  db.run(`CREATE TABLE IF NOT EXISTS biometric_fingerprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    facialTemplate TEXT,
    documentHash TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating biometric_fingerprints table:', err.message);
    } else {
      console.log('Biometric fingerprints table created or already exists.');
    }
  });

  // Create kyc_attempts table
  db.run(`CREATE TABLE IF NOT EXISTS kyc_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    status TEXT,
    message TEXT,
    documentImagePath TEXT,
    faceImagePath TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating kyc_attempts table:', err.message);
    } else {
      console.log('KYC attempts table created or already exists.');

      // Check if columns exist (for existing database)
      db.all("PRAGMA table_info(kyc_attempts)", (err, rows) => {
        if (!err) {
          const columns = rows.map(r => r.name);
          if (!columns.includes('documentImagePath')) {
            db.run("ALTER TABLE kyc_attempts ADD COLUMN documentImagePath TEXT", (err) => {
              if (!err) console.log("Added documentImagePath column");
            });
          }
          if (!columns.includes('faceImagePath')) {
            db.run("ALTER TABLE kyc_attempts ADD COLUMN faceImagePath TEXT", (err) => {
              if (!err) console.log("Added faceImagePath column");
            });
          }
        }
      });
    }
  });

  // Create indexes for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_documentNumber ON users(documentNumber)`, (err) => {
    if (err) {
      console.error('Error creating index on users.documentNumber:', err.message);
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_biometric_facialTemplate ON biometric_fingerprints(facialTemplate)`, (err) => {
    if (err) {
      console.error('Error creating index on biometric_fingerprints.facialTemplate:', err.message);
    }
  });
}

// Check for duplicate based on document number
function checkForDuplicate(documentNumber, callback) {
  const sql = `SELECT * FROM users WHERE documentNumber = ?`;
  db.get(sql, [documentNumber], (err, row) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, row);
    }
  });
}

// Check for biometric duplicate using facial template
function checkForBiometricDuplicate(biometricData, callback) {
  // In a real implementation, we would compare biometric templates using specialized algorithms
  // For this demo, we'll do a simple string comparison

  const sql = `SELECT u.* FROM biometric_fingerprints bf 
               JOIN users u ON bf.userId = u.id 
               WHERE bf.facialTemplate = ?`;

  db.get(sql, [biometricData.facialTemplate], (err, row) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, row);
    }
  });
}

// Store user information
function storeUser(userData, callback) {
  const sql = `INSERT INTO users (fullName, documentNumber, dateOfBirth, nationality) 
               VALUES (?, ?, ?, ?)`;

  db.run(sql, [
    userData.fullName,
    userData.documentNumber,
    userData.dateOfBirth,
    userData.nationality
  ], function (err) {
    if (err) {
      if (err.message.includes('SQLITE_CONSTRAINT')) {
        // User already exists, get the ID
        db.get('SELECT id FROM users WHERE documentNumber = ?', [userData.documentNumber], (err, row) => {
          if (err) {
            callback(err, null);
          } else if (row) {
            callback(null, row.id);
          } else {
            callback(new Error('Failed to retrieve existing user'), null);
          }
        });
      } else {
        callback(err, null);
      }
    } else {
      callback(null, this.lastID);
    }
  });
}

// Store biometric fingerprint
function storeBiometricFingerprint(biometricData, callback) {
  const sql = `INSERT INTO biometric_fingerprints (userId, facialTemplate, documentHash) 
               VALUES (?, ?, ?)`;

  db.run(sql, [
    biometricData.userId,
    biometricData.facialTemplate,
    biometricData.documentHash
  ], function (err) {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}

// Log KYC attempt
function logKYCAttempt(userId, status, message, documentImagePath, faceImagePath, callback) {
  const sql = `INSERT INTO kyc_attempts (userId, status, message, documentImagePath, faceImagePath) 
               VALUES (?, ?, ?, ?, ?)`;

  db.run(sql, [userId, status, message, documentImagePath, faceImagePath], function (err) {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}

// Get recent KYC attempts
function getRecentKYCAttempts(limit, callback) {
  const sql = `
    SELECT k.*, u.fullName, u.documentNumber 
    FROM kyc_attempts k
    JOIN users u ON k.userId = u.id
    ORDER BY k.createdAt DESC
    LIMIT ?
  `;

  db.all(sql, [limit], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

// Analyze failed attempts to identify common patterns
function analyzeFailedAttempts(callback) {
  const sql = `
    SELECT status, COUNT(*) as count, GROUP_CONCAT(message) as messages
    FROM kyc_attempts 
    WHERE createdAt > datetime('now', '-30 days')
    GROUP BY status
    ORDER BY count DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      // Process the results to identify patterns
      const analysis = {
        totalAttempts: 0,
        successRate: 0,
        commonFailures: [],
        recommendations: []
      };

      let total = 0;
      let successes = 0;

      rows.forEach(row => {
        total += row.count;
        if (row.status === 'SUCCESS') {
          successes = row.count;
        } else {
          analysis.commonFailures.push({
            status: row.status,
            count: row.count,
            messages: row.messages.split(',').slice(0, 3) // Get first 3 messages
          });
        }
      });

      analysis.totalAttempts = total;
      analysis.successRate = total > 0 ? Math.round((successes / total) * 100) : 0;

      // Generate recommendations based on common failures
      analysis.commonFailures.forEach(failure => {
        if (failure.status === 'DOCUMENT_QUALITY') {
          analysis.recommendations.push('Improve document scanning guidance with real-time quality feedback');
        } else if (failure.status === 'FACIAL_MISMATCH') {
          analysis.recommendations.push('Provide better instructions for facial capture positioning');
        } else if (failure.status === 'DUPLICATE') {
          analysis.recommendations.push('Enhance duplicate detection with earlier validation');
        }
      });

      callback(null, analysis);
    }
  });
}

module.exports = {
  initializeDatabase,
  checkForDuplicate,
  checkForBiometricDuplicate,
  storeUser,
  storeBiometricFingerprint,
  logKYCAttempt,
  getRecentKYCAttempts,
  analyzeFailedAttempts
};