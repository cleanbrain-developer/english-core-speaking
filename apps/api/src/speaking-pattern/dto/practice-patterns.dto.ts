import { ArrayMaxSize, ArrayNotEmpty, IsString } from 'class-validator';

export class PracticePatternsDto {
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  patternIds!: string[];
}
