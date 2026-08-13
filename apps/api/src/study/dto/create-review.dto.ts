import { IsIn, IsInt, IsUUID } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  sessionId!: string;

  @IsInt()
  learningItemId!: number;

  @IsIn([1, 2, 3, 4])
  rating!: 1 | 2 | 3 | 4;
}
