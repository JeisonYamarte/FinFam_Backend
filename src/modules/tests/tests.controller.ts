/// <reference types="multer" />
import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { EmailService } from 'src/modules/email/email.service';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';

@Controller('tests')
export class TestsController {
  constructor(
    private readonly emailService: EmailService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  test() {
    return {
      message: 'Test endpoint is working',
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadFile(
      file.buffer,
      'tests',
    );
    return result;
  }
}
