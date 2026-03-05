import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class QueryAuthDto {
  @ApiProperty({
    description: 'UUID token sent to user email for verification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  token: string;
}
