import { Injectable } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { envs } from 'src/config/app.config';
import { EmailProviderInterface } from '../interfaces/email-provider.interface';

@Injectable()
export class LegacyGmailProvider implements EmailProviderInterface {
  private transporter: Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      family: 4,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
      auth: {
        user: envs.EMAIL_FROM,
        pass: envs.EMAIL_PASSWORD,
      },
    } as SMTPTransport.Options & { family: number });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"FinFam" <${envs.EMAIL_FROM}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('Error sending email with legacy Gmail:', error);
      throw new Error('Failed to send email');
    }
  }
}
