const fs = require('fs');
const path = require('path');

const filename = '1747937978010-94162899-Resume.pdf';
const uploadsDir = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    console.log('Creating uploads directory:', uploadsDir);
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Check both possible paths
const possiblePaths = [
    path.join(uploadsDir, filename),
    path.join(uploadsDir, 'uploads', filename)
];

console.log('Checking file paths:', possiblePaths.map(p => ({
    path: p,
    exists: fs.existsSync(p)
})));

// List all files in uploads directory
if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log('Files in uploads directory:', files);
} 