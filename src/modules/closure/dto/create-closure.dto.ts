import { IsString, IsUUID } from 'class-validator';

export class CreateClosureDto {
  @IsString()
  @IsUUID()
  householdId: string;
}
