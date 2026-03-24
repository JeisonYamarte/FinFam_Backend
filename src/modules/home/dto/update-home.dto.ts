import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateHomeDto {
  @ApiPropertyOptional({ example: 'My Family Home' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  name?: string;
}
