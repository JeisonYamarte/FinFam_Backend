import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PayerDto } from './payer.dto';

export class UpdatePayersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayerDto)
  payers: PayerDto[];
}
