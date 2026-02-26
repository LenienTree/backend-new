import nodemailer from 'nodemailer';
import { config } from '../config/config';

const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
    },
});

interface MailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async (options: MailOptions): Promise<void> => {
    await transporter.sendMail({
        from: config.smtp.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
    });
};

export const emailTemplates = {
    verifyEmail: (name: string, link: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">Verify Your Email</h2>
      <p>Hi ${name},</p>
      <p>Please click the button below to verify your email address.</p>
      <a href="${link}" style="background:#6366f1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `,

    resetPassword: (name: string, link: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">Reset Your Password</h2>
      <p>Hi ${name},</p>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${link}" style="background:#6366f1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">
        Reset Password
      </a>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `,

    registrationConfirmed: (name: string, eventTitle: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">Registration Confirmed!</h2>
      <p>Hi ${name},</p>
      <p>Your registration for <strong>${eventTitle}</strong> has been confirmed.</p>
      <p>Good luck and see you there!</p>
    </div>
  `,

    eventApproved: (organizerName: string, eventTitle: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Event Approved!</h2>
      <p>Hi ${organizerName},</p>
      <p>Great news! Your event <strong>${eventTitle}</strong> has been approved and is now live.</p>
    </div>
  `,

    eventRejected: (organizerName: string, eventTitle: string, reason: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Event Not Approved</h2>
      <p>Hi ${organizerName},</p>
      <p>Unfortunately, your event <strong>${eventTitle}</strong> was not approved.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please make the necessary changes and resubmit.</p>
    </div>
  `,
};
