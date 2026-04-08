import { IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PayerDto {
  @IsString()
  @IsUUID()
  userId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amountPaid: number;
}
