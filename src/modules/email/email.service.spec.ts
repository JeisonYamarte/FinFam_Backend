import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { BrevoProvider } from './providers/brevo.provider';
import { LegacyGmailProvider } from './providers/legacy-gmail.provider';

describe('EmailService', () => {
  let service: EmailService;
  const brevoProviderMock = {
    sendEmail: jest.fn(),
  };
  const legacyGmailProviderMock = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: BrevoProvider,
          useValue: brevoProviderMock,
        },
        {
          provide: LegacyGmailProvider,
          useValue: legacyGmailProviderMock,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delegate sendEmail to active provider', async () => {
    await service.sendEmail('test@example.com', 'Subject', '<p>Hello</p>');

    expect(brevoProviderMock.sendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Subject',
      '<p>Hello</p>',
    );
  });
});
