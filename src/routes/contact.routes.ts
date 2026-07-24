import { FastifyInstance } from 'fastify';
import { EmailService } from '../modules/email';
import { config } from '../config/config';
import { AppError } from '../utils/apiResponse';

// Escape user input before embedding it in the outbound email so a submitter can't
// inject arbitrary HTML/markup into the message we send to the support inbox.
const esc = (s: unknown): string =>
    String(s ?? '').replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
    );

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default async function contactRoutes(fastify: FastifyInstance) {
    // POST /api/contact — rate limited (spam / email-bombing target)
    fastify.post(
        '/',
        { config: { rateLimit: { max: 5, timeWindow: '10 minutes' } } },
        async (request, reply) => {
            const body = (request.body || {}) as {
                fullName?: string;
                phoneNo?: string;
                email?: string;
                message?: string;
            };
            const fullName = (body.fullName || '').trim();
            const email = (body.email || '').trim();
            const message = (body.message || '').trim();
            const phoneNo = (body.phoneNo || '').trim();

            if (!fullName || !email || !message) {
                throw new AppError('Full Name, Email, and Message are required.', 400);
            }
            if (fullName.length > 100 || email.length > 200 || phoneNo.length > 30 || message.length > 5000) {
                throw new AppError('One or more fields exceed the allowed length.', 400);
            }
            if (!EMAIL_RE.test(email)) {
                throw new AppError('Please provide a valid email address.', 400);
            }

            const supportEmail = config.smtp.user || 'support@lenienttree.com';
            const html = `
            <h2>New Contact Form Submission 📧</h2>
            <p><strong>Name:</strong> ${esc(fullName)}</p>
            <p><strong>Phone:</strong> ${esc(phoneNo) || 'N/A'}</p>
            <p><strong>Email:</strong> ${esc(email)}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: #061212; border: 1px solid #142e2e; padding: 20px; border-radius: 12px; margin: 15px 0; color: #cbd5e1; font-family: inherit;">
                ${esc(message).replace(/\n/g, '<br>')}
            </div>
        `;

            await EmailService.send({
                to: supportEmail,
                subject: `[Contact Form] Message from ${fullName.slice(0, 80)}`,
                replyTo: email,
                html,
            });

            reply.status(200).send({ success: true, message: 'Message sent successfully' });
        }
    );
}
