require('dotenv').config();
const mongoose = require('mongoose');
const PDF = require('./models/PDF');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log('Created uploads directory');
        }

        // List all PDFs
        console.log('\nListing all PDFs in database:');
        const pdfs = await PDF.find().select('_id name filePath createdAt');
        
        if (pdfs.length === 0) {
            console.log('No PDFs found in database');
        } else {
            pdfs.forEach((pdf, index) => {
                console.log(`\n${index + 1}. PDF Details:`);
                console.log(`ID: ${pdf._id}`);
                console.log(`Name: ${pdf.name}`);
                console.log(`Path: ${pdf.filePath}`);
                console.log(`Created: ${pdf.createdAt}`);

                // Check if file exists
                const filePath = path.join(__dirname, pdf.filePath);
                const fileExists = fs.existsSync(filePath);
                console.log(`File exists: ${fileExists}`);
                
                if (fileExists) {
                    const stats = fs.statSync(filePath);
                    console.log(`File size: ${stats.size} bytes`);
                }
            });
        }

        // Check uploads directory
        console.log('\nChecking uploads directory:');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            console.log('Files in uploads directory:');
            files.forEach(file => {
                const filePath = path.join(uploadsDir, file);
                const stats = fs.statSync(filePath);
                console.log(`- ${file} (${stats.size} bytes)`);
            });
        }

        // Fix any missing files
        console.log('\nChecking for missing files:');
        for (const pdf of pdfs) {
            const filePath = path.join(__dirname, pdf.filePath);
            if (!fs.existsSync(filePath)) {
                console.log(`Missing file for PDF: ${pdf.name} (${pdf._id})`);
                console.log(`Expected path: ${filePath}`);
            }
        }

        await mongoose.disconnect();
        console.log('\nDatabase connection closed');
    } catch (error) {
        console.error('Error:', error);
    }
}

main(); 