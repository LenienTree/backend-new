export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

    jwt: {
        secret: process.env.JWT_SECRET || 'fallback_secret_dev_only',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshSecret:
            process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_dev_only',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },

    pagination: {
        defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10),
        maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
    },

    s3: {
        bucketName: process.env.S3_BUCKET_NAME || '',
        region: process.env.S3_REGION || 'us-east-1',
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },

    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.EMAIL_FROM || 'no-reply@lenienttree.com',
    },
};
