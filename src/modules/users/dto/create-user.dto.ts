import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsDateString,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User first name',
    example: 'Jeison',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'García',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'Date of birth (ISO 8601 format)',
    example: '1995-06-15',
  })
  @IsDateString()
  @IsNotEmpty()
  birthDate: string;

  @ApiProperty({
    description: 'Unique user email address',
    example: 'jeison@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({
    description: 'email verification status',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  @IsOptional()
  emailVerified?: boolean;
}
