// Short display labels for Speaking Intent categories (the discovery
// screen's "무엇을 말하고 싶을 때" grid, §19 of the spec). The raw
// `speakingIntent` string in the seed content is a full sentence ("~하고
// 싶을 때"), meant for prose/UI copy elsewhere, not a card label -- every
// entry here MUST stay short (2-6 글자) so the intent grid stays scannable.
// unknown intents fall back to the raw string via speakingIntentLabel(),
// so a newly-added family without a registered label degrades gracefully
// (long text, not a crash) rather than blocking a deploy, but keep this
// map in sync with data/speaking_patterns_v1.json's distinct
// `speakingIntent` values when adding content.
export const SPEAKING_INTENT_LABELS: Record<string, string> = {
  '과거 상황을 설명하고 싶을 때': '과거 상황 설명',
  '내 생각을 말하고 싶을 때': '내 생각 표현',
  '문제를 설명하고 싶을 때': '문제 설명',
  '과거 내 상태를 설명하고 싶을 때': '과거 내 상태',
  '지금 하는 일을 설명하고 싶을 때': '지금 하는 일',
  '해야 할 일을 말하고 싶을 때': '해야 할 일',
  '원하는 것을 말하고 싶을 때': '원하는 것',
  '이유를 설명하고 싶을 때': '이유 설명',
  '예전 경험을 말하고 싶을 때': '예전 경험',
  '최근에 해온 일을 말하고 싶을 때': '최근 한 일',
  '추측을 말하고 싶을 때': '추측',
  '확실하지 않다고 말하고 싶을 때': '불확실함',
  '예시를 들고 싶을 때': '예시 들기',
  '설명을 자연스럽게 이어가고 싶을 때': '설명 이어가기',
  '결정한 것을 말하고 싶을 때': '결정 말하기',
  '시도한 것을 말하고 싶을 때': '시도한 것',
  '예전 기억을 떠올리며 말하고 싶을 때': '기억 회상',
  '동의하거나 반대 의견을 말하고 싶을 때': '동의·반대',
  '비교하고 싶을 때': '비교하기',
  '지금 상황이 변하고 있다고 말하고 싶을 때': '변화 설명',
  '내 경우를 말하고 싶을 때': '내 경우',
  '감정이나 직관을 말하고 싶을 때': '감정·직관',
  '명확히 확인하고 싶을 때': '명확히 확인',
  '관심이나 걱정을 말하고 싶을 때': '관심·걱정',
  '깨달은 것을 말하고 싶을 때': '깨달음',
  '내가 한 일을 설명하고 싶을 때': '한 일 설명',
  '정정하거나 강조하고 싶을 때': '정정·강조',
  '일정을 조율하고 싶을 때': '일정 조율',
  '놀라움이나 감탄을 말하고 싶을 때': '놀라움 표현',
  '저절로 그렇게 된다고 말하고 싶을 때': '자꾸 그럴 때',
  '진행 상황을 확인하고 싶을 때': '진행 확인',
  '기대감을 말하고 싶을 때': '기대감',
};

export function speakingIntentLabel(intent: string): string {
  return SPEAKING_INTENT_LABELS[intent] ?? intent;
}
