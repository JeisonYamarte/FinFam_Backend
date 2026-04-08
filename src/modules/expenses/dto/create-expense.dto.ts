import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PayerDto } from './payer.dto';
import { SplitDto } from './split.dto';

export class CreateExpenseDto {
  @IsString()
  @IsUUID()
  householdId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
    const parsed =
      typeof value === 'string'
        ? (JSON.parse(value) as object[])
        : (value as object[]);
    return plainToInstance(PayerDto, parsed);
  })
  payers: PayerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
    const parsed =
      typeof value === 'string'
        ? (JSON.parse(value) as object[])
        : (value as object[]);
    return plainToInstance(SplitDto, parsed);
  })
  splits: SplitDto[];

  @IsOptional()
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Receipt image file (jpg, png, pdf, etc.)',
  })
  receipt?: Express.Multer.File;
}
