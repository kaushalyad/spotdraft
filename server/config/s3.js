const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Configure AWS
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// S3 bucket configuration
const bucketConfig = {
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION
};

// Test S3 connection
const testS3Connection = async () => {
    try {
        console.log('Testing S3 connection with config:', {
            region: process.env.AWS_REGION,
            bucket: process.env.AWS_S3_BUCKET,
            hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
        });

        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);
        console.log('Successfully connected to AWS S3. Available buckets:', response.Buckets.map(b => b.Name));
        return true;
    } catch (error) {
        console.error('Failed to connect to AWS S3:', {
            error: error.message,
            code: error.code,
            name: error.name,
            stack: error.stack
        });
        throw error;
    }
};

// Test connection on startup
testS3Connection().catch(error => {
    console.error('S3 connection test failed:', error);
});

module.exports = {
    s3Client,
    bucketConfig,
    testS3Connection
}; 