import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from './auth.dto';
export class LoginResponseDto {
  @ApiProperty({ description: 'Authenticated user', type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;
}
