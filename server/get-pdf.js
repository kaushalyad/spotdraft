require('dotenv').config();
const mongoose = require('mongoose');
const PDF = require('./models/PDF');
const fs = require('fs');
const path = require('path');

async function getPDF(pdfId) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find PDF by ID
        const pdf = await PDF.findById(pdfId);
        if (!pdf) {
            console.log('PDF not found');
            return;
        }

        console.log('\nPDF found:');
        console.log(`ID: ${pdf._id}`);
        console.log(`Name: ${pdf.name}`);
        console.log(`Path: ${pdf.filePath}`);

        // Check if file exists
        const filePath = path.join(__dirname, pdf.filePath);
        const fileExists = fs.existsSync(filePath);
        console.log(`\nFile exists: ${fileExists}`);
        if (fileExists) {
            const stats = fs.statSync(filePath);
            console.log(`File size: ${stats.size} bytes`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Get PDF ID from command line argument
const pdfId = process.argv[2];
if (!pdfId) {
    console.log('Please provide a PDF ID');
    process.exit(1);
}

getPDF(pdfId); 