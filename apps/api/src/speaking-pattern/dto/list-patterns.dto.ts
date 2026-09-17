import { IsOptional, IsString } from 'class-validator';

export class ListPatternsDto {
  @IsOptional()
  @IsString()
  intent?: string;

  @IsOptional()
  @IsString()
  familyId?: string;
}
