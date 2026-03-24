import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateHomeDto {
  @ApiProperty({ example: 'My Family Home' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;
}
