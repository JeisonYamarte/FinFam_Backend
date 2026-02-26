import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from './auth.dto';

export class RegisterResponseDto {
  @ApiProperty({ description: 'Registered user', type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;
}
