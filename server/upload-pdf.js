require('dotenv').config();
const mongoose = require('mongoose');
const PDF = require('./models/PDF');
const fs = require('fs');
const path = require('path');

async function uploadPDF(filePath) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return;
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Copy file to uploads directory
        const fileName = path.basename(filePath);
        const targetPath = path.join(uploadsDir, fileName);
        fs.copyFileSync(filePath, targetPath);

        // Create a new PDF document
        const pdf = new PDF({
            name: fileName.replace('.pdf', ''),
            description: 'Uploaded PDF file',
            filePath: `uploads/${fileName}`,
            owner: '000000000000000000000000', // Replace with actual user ID
            isPublic: true
        });

        // Save the PDF to database
        const savedPDF = await pdf.save();
        console.log('\nPDF saved successfully:');
        console.log(`ID: ${savedPDF._id}`);
        console.log(`Name: ${savedPDF.name}`);
        console.log(`Path: ${savedPDF.filePath}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Get file path from command line argument
const filePath = process.argv[2];
if (!filePath) {
    console.log('Please provide a PDF file path');
    process.exit(1);
}

uploadPDF(filePath); 