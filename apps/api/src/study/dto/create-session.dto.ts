import { IsIn } from 'class-validator';

export const STUDY_MODES = ['daily', 'due', 'new', 'weak', 'category'] as const;
export type StudyMode = (typeof STUDY_MODES)[number];

export class CreateSessionDto {
  @IsIn(STUDY_MODES)
  mode!: StudyMode;
}
