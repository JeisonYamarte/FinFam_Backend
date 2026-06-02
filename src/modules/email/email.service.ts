import { Injectable } from '@nestjs/common';
import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import { envs } from 'src/config/app.config';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: envs.EMAIL_FROM,
        pass: envs.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    const from = envs.EMAIL_FROM;
    try {
      const info: SentMessageInfo = await this.transporter.sendMail({
        from: `"FinFam" <${from}>`,
        to,
        subject,
        html,
      });

      return info;
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

    try {
      await this.sendEmail(to, subject, html);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(to: string, uuid: string) {
    const subject = 'Reset Your Password';
    const html = `
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${envs.FRONTEND_URL}/reset-password?token=${uuid}">Reset Password</a>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    try {
      await this.sendEmail(to, subject, html);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
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

    try {
      await this.sendEmail(to, subject, html);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw new Error('Failed to send invitation email');
    }
  }
}
