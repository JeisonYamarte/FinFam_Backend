import { Injectable } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';
import { envs } from 'src/config/app.config';
import { EmailProviderInterface } from '../interfaces/email-provider.interface';

@Injectable()
export class BrevoProvider implements EmailProviderInterface {
  private readonly client: BrevoClient;

  constructor() {
    if (!envs.BREVO_KEY_API) {
      throw new Error('Brevo API key is not configured.');
    }

    this.client = new BrevoClient({
      apiKey: envs.BREVO_KEY_API,
      timeoutInSeconds: 30,
      maxRetries: 3,
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.client.transactionalEmails.sendTransacEmail({
        sender: {
          name: 'FinFam',
          email: envs.EMAIL_FROM,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      });
    } catch (error) {
      console.error('Error sending email with Brevo:', error);
      throw new Error('Failed to send email');
    }
  }
}
