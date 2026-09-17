// Short display labels for Speaking Intent categories (the discovery
// screen's "무엇을 말하고 싶을 때" grid, §19 of the spec). Grows as new
// pattern families are added via seed content -- unknown intents fall
// back to the raw string via speakingIntentLabel(), so this map never
// needs to be exhaustive.
export const SPEAKING_INTENT_LABELS: Record<string, string> = {
  '과거 상황을 설명하고 싶을 때': '과거 상황 설명',
  '내 생각을 말하고 싶을 때': '내 생각 표현',
  '문제를 설명하고 싶을 때': '문제 설명',
};

export function speakingIntentLabel(intent: string): string {
  return SPEAKING_INTENT_LABELS[intent] ?? intent;
}
