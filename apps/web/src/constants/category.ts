export const CATEGORIES = ['Conversation Chunk', 'Phrasal Verb', 'Core Word', 'Work English'] as const;

export const CATEGORY_SHORT_LABELS: Record<string, string> = {
  'Conversation Chunk': '회화',
  'Phrasal Verb': '구동사',
  'Core Word': '단어',
  'Work English': '비즈니스',
};

export function categoryLabel(category: string): string {
  return CATEGORY_SHORT_LABELS[category] ?? category;
}
