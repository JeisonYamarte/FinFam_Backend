import { Injectable } from '@nestjs/common';
import { envs } from 'src/config/app.config';
import { EmailProviderInterface } from './interfaces/email-provider.interface';
import { BrevoProvider } from './providers/brevo.provider';
import { LegacyGmailProvider } from './providers/legacy-gmail.provider';

@Injectable()
export class EmailService {
  private readonly provider: EmailProviderInterface;

  constructor(
    private readonly brevoProvider: BrevoProvider,
    private readonly legacyGmailProvider: LegacyGmailProvider,
  ) {
    this.provider =
      envs.EMAIL_PROVIDER === 'gmail'
        ? this.legacyGmailProvider
        : this.brevoProvider;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.provider.sendEmail(to, subject, html);
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
