require('dotenv').config();
const { S3Client, ListBucketsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

// Create S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function testS3Connection() {
    try {
        console.log('Testing S3 connection...');
        console.log('Configuration:', {
            region: process.env.AWS_REGION,
            bucket: process.env.AWS_S3_BUCKET,
            hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
        });

        // List buckets
        const listCommand = new ListBucketsCommand({});
        const { Buckets } = await s3Client.send(listCommand);
        console.log('Available buckets:', Buckets.map(b => b.Name));

        // Test write to bucket
        const testCommand = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: 'test-connection.txt',
            Body: 'Test connection successful',
            ContentType: 'text/plain'
        });

        await s3Client.send(testCommand);
        console.log('Successfully wrote test file to bucket');

    } catch (error) {
        console.error('S3 Connection Test Failed:', {
            error: error.message,
            code: error.code,
            name: error.name,
            stack: error.stack
        });
    }
}

testS3Connection(); 