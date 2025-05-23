require('dotenv').config();
const mongoose = require('mongoose');
const PDF = require('./models/PDF');
const fs = require('fs');
const path = require('path');

async function listPDFs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all PDFs
        const pdfs = await PDF.find().select('_id name filePath createdAt');
        console.log('\nPDFs in database:');
        
        if (pdfs.length === 0) {
            console.log('No PDFs found in database');
            return;
        }

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

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

listPDFs(); 