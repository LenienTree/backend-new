import nodemailer from 'nodemailer';
import { emailConfig } from '../config';

let transporter: nodemailer.Transporter | null = null;

export const getTransporter = (): nodemailer.Transporter => {
    if (!transporter) {
        const { smtp } = emailConfig;
        transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: {
                user: smtp.auth.user,
                pass: smtp.auth.pass,
            },
            pool: true, // Connection pooling
            maxConnections: 5,
            maxMessages: 100,
            rateLimit: 10, // Rate limiting: Max 10 messages per second
        });
    }
    return transporter;
};

export const verifyConnection = async (): Promise<boolean> => {
    try {
        const client = getTransporter();
        await client.verify();
        console.log('✅ [Email] SMTP connection verified successfully');
        return true;
    } catch (error) {
        console.error('❌ [Email] SMTP verification failed:', error);
        return false;
    }
};
