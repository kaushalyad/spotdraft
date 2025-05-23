require('dotenv').config();
const mongoose = require('mongoose');
const PDF = require('./models/PDF');
const fs = require('fs');
const path = require('path');

async function checkPDFs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const pdfs = await PDF.find().select('_id name filePath');
        console.log('\nPDFs in database:', pdfs.length);
        pdfs.forEach(pdf => {
            console.log(`- ${pdf.name} (${pdf._id})`);
            console.log(`  Path: ${pdf.filePath}`);
        });

        const uploadsDir = path.join(__dirname, 'uploads');
        console.log('\nChecking uploads directory:', uploadsDir);
        
        if (!fs.existsSync(uploadsDir)) {
            console.log('Uploads directory does not exist');
            return;
        }

        const files = fs.readdirSync(uploadsDir);
        console.log('\nFiles in uploads directory:', files.length);
        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            console.log(`- ${file} (${stats.size} bytes)`);
        });

        console.log('\nChecking for missing files...');
        pdfs.forEach(pdf => {
            const filePath = path.join(uploadsDir, path.basename(pdf.filePath));
            if (!fs.existsSync(filePath)) {
                console.log(`Missing file: ${pdf.name}`);
                console.log(`Expected path: ${filePath}`);
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

checkPDFs(); 