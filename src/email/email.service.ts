import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { envs } from 'src/env.model';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(envs.RESEND_API_KEY);
  }

  async sendEmail(to: string, subject: string, html: string) {
    const from = envs.EMAIL_FROM;
    try {
      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });
      console.log('Email sent successfully:', data);

      if (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
      }

      return data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(to: string, uuid: string) {
    const subject = 'Verify Your Email Address';
    const html = `
      <p>Thank you for registering! Please verify your email address by clicking the link below:</p>
      <a href="http://localhost:3000/api/auth/verify-email?token=${uuid}">Verify Email</a>
    `;
    return this.sendEmail(to, subject, html);
  }
}
