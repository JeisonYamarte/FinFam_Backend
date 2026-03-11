import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EmailService } from 'src/email/email.service';

@Controller('tests')
export class TestsController {
  constructor(private readonly emailService: EmailService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  test() {
    return {
      message: 'Test endpoint is working',
    };
  }
}
