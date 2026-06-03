import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { BrevoProvider } from './providers/brevo.provider';
import { LegacyGmailProvider } from './providers/legacy-gmail.provider';

@Module({
  providers: [BrevoProvider, LegacyGmailProvider, EmailService],
  exports: [EmailService],
})
export class EmailModule {}
