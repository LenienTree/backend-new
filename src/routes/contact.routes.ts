import { FastifyInstance } from 'fastify';
import { EmailService } from '../modules/email';
import { config } from '../config/config';
import { AppError } from '../utils/apiResponse';

export default async function contactRoutes(fastify: FastifyInstance) {
    // POST /api/contact
    fastify.post('/', async (request, reply) => {
        const { fullName, phoneNo, email, message } = request.body as {
            fullName: string;
            phoneNo?: string;
            email: string;
            message: string;
        };

        if (!fullName || !email || !message) {
            throw new AppError('Full Name, Email, and Message are required.', 400);
        }

        const supportEmail = config.smtp.user || 'support@lenienttree.com';
        const html = `
            <h2>New Contact Form Submission 📧</h2>
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Phone:</strong> ${phoneNo || 'N/A'}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: #061212; border: 1px solid #142e2e; padding: 20px; border-radius: 12px; margin: 15px 0; color: #cbd5e1; font-family: inherit;">
                ${message.replace(/\n/g, '<br>')}
            </div>
        `;

        await EmailService.send({
            to: supportEmail,
            subject: `[Contact Form] Message from ${fullName}`,
            html,
        });

        reply.status(200).send({ success: true, message: 'Message sent successfully' });
    });
}
