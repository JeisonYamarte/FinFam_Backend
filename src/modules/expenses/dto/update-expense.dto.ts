import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PayerDto } from './payer.dto';
import { SplitDto } from './split.dto';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayerDto)
  @Transform(({ value }) =>
    typeof value === 'string'
      ? (JSON.parse(value) as PayerDto[])
      : (value as PayerDto[]),
  )
  payers?: PayerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitDto)
  @Transform(({ value }) =>
    typeof value === 'string'
      ? (JSON.parse(value) as SplitDto[])
      : (value as SplitDto[]),
  )
  splits?: SplitDto[];

  @IsOptional()
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Receipt image file (jpg, png, pdf, etc.)',
  })
  receipt?: Express.Multer.File;
}
