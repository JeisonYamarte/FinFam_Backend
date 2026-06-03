export interface EmailProviderInterface {
  sendEmail(to: string, subject: string, html: string): Promise<void>;
}
