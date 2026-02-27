import { Controller, Get } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';

@Controller('tests')
export class TestsController {
  constructor(private readonly emailService: EmailService) {}
  @Get()
  async test() {
    const responnse = await this.emailService.sendEmail(
      'jeisonyamartedev@gmail.com',
      'Test Subject',
      '<p>Test Email</p>',
    );
    return {
      message: 'Email sent successfully',
      data: responnse,
    };
  }
}
