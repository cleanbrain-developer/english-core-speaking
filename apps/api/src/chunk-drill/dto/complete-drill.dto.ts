import { ArrayMaxSize, ArrayNotEmpty, IsInt } from 'class-validator';

export class CompleteDrillDto {
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsInt({ each: true })
  chunkItemIds!: number[];
}
