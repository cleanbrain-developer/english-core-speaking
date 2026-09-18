// Drill 5 (Free Speaking, spec §13): a Korean situational cue plus a short
// list of recommended Speaking Pattern ids as scaffolding -- the learner
// speaks freely, referencing whichever recommended chunks fit, with no
// reveal/scoring (unlike Drills 1-4, there's no single correct answer to
// check against). Purely static content: no backend table, no per-user
// progress tracking, consistent with treating this as a practice sandbox
// rather than a graded drill. Recommended pattern ids are resolved against
// already-loaded pattern data by SpeakingPatternFreeSpeakingView.vue -- keep
// every id here in sync with data/speaking_patterns_v1.json.
export interface FreeSpeakingPrompt {
  id: string;
  cue: string;
  recommendedPatternIds: string[];
}

export const FREE_SPEAKING_PROMPTS: FreeSpeakingPrompt[] = [
  {
    id: 'hard-problem',
    cue: '최근 해결하기 어려웠던 문제를 설명해봐.',
    recommendedPatternIds: [
      'there-was-a-problem-with',
      'it-was-difficult-to',
      'the-problem-was',
      'it-was-because',
      'what-i-did-was',
      'it-turned-out',
    ],
  },
  {
    id: 'current-work',
    cue: '요즘 하고 있는 일이나 프로젝트를 설명해봐.',
    recommendedPatternIds: ['im-trying-to', 'im-working-on', 'ive-been-working-on', 'its-getting', 'im-planning-to'],
  },
  {
    id: 'past-habit',
    cue: '예전에 자주 했던 습관이나 경험을 얘기해봐.',
    recommendedPatternIds: ['i-used-to', 'i-used-to-be', 'there-was-a-time-when', 'i-remember'],
  },
  {
    id: 'opinion',
    cue: '지금 고민하고 있는 것에 대해 네 생각을 말해봐.',
    recommendedPatternIds: ['i-think', 'i-agree-that', 'i-dont-think', 'im-not-sure-if', 'it-depends-on'],
  },
  {
    id: 'misunderstanding',
    cue: '누군가에게 무언가를 설명하다가 오해가 생겼던 상황을 얘기해봐.',
    recommendedPatternIds: ['what-i-mean-is', 'actually', 'the-thing-is', 'i-realized', 'it-turned-out'],
  },
  {
    id: 'plans',
    cue: '다가오는 계획이나 기대되는 일을 말해봐.',
    recommendedPatternIds: ['im-going-to', 'im-planning-to', 'i-cant-wait-to', 'im-looking-forward-to'],
  },
  {
    id: 'surprise',
    cue: '최근에 놀랍거나 예상 밖이었던 일을 말해봐.',
    recommendedPatternIds: ['i-cant-believe', 'im-surprised', 'it-turned-out', 'i-realized'],
  },
  {
    id: 'comparison',
    cue: '두 가지를 비교해서 설명해봐 (예: 예전 방식 vs 지금 방식).',
    recommendedPatternIds: ['compared-to', 'its-different-from', 'its-similar-to', 'the-difference-is'],
  },
];
