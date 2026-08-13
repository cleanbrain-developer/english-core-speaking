import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const LEARNING_ITEM_CATEGORIES = [
  'Conversation Chunk',
  'Phrasal Verb',
  'Core Word',
  'Work English',
] as const;

export class ListLearningItemsDto {
  @IsOptional()
  @IsIn(LEARNING_ITEM_CATEGORIES)
  category?: (typeof LEARNING_ITEM_CATEGORIES)[number];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
