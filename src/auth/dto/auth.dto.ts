import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
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
