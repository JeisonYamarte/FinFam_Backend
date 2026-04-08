import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SplitDto } from './split.dto';

export class UpdateSplitsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitDto)
  splits: SplitDto[];
}
