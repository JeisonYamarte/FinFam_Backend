import { Injectable } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { envs } from 'src/config/app.config';

@Injectable()
export class EmailService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      family: 4,
      auth: {
        user: envs.EMAIL_FROM,
        pass: envs.EMAIL_PASSWORD,
      },
    } as SMTPTransport.Options & { family: number });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const from: string = envs.EMAIL_FROM;
    try {
      await this.transporter.sendMail({
        from: `"FinFam" <${from}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(to: string, uuid: string) {
    const subject = 'Verify Your Email Address';
    const html = `
      <p>Thank you for registering! Please verify your email address by clicking the link below:</p>
      <a href="${envs.FRONTEND_URL}/verify-email?token=${uuid}">Verify Email</a>
    `;
    await this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, uuid: string) {
    const subject = 'Reset Your Password';
    const html = `
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${envs.FRONTEND_URL}/reset-password?token=${uuid}">Reset Password</a>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;
    await this.sendEmail(to, subject, html);
  }

  async sendInvitationEmail(to: string, invitationId: string) {
    const subject = 'You have been invited to a FinFam household';
    const html = `
      <p>You have been invited to join a household on FinFam.</p>
      <p>Click the link the invitation:</p>
      <a href="${envs.FRONTEND_URL}/invitations/${invitationId}">Invitation</a>
      <br/>
      <p>This invitation will expire in 24 hours.</p>
    `;
    await this.sendEmail(to, subject, html);
  }
}
