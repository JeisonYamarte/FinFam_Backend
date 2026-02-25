import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: 'ef8f6b9c-1a2b-4c5d-8e9f-0a1b2c3d4e5f',
  })
  id: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Jeison',
  })
  name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Garcia',
  })
  lastName: string;

  @ApiProperty({
    description: 'User birth date (ISO 8601)',
    example: '1995-06-15',
  })
  birthDate: Date;

  @ApiProperty({
    description: 'User email address',
    example: 'jeison@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601)',
    example: '2024-02-20T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp (ISO 8601)',
    example: '2024-02-21T15:30:00.000Z',
  })
  updatedAt: Date;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Authenticated user', type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;
}
