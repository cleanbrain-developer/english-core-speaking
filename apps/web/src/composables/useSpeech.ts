export function speak(text: string, lang = 'en-US'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Plays `text` `times` times back-to-back, chaining on each utterance's `end` event (shadowing drill). */
export function speakTimes(text: string, times: number, lang = 'en-US'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || times < 1) return;
  window.speechSynthesis.cancel();

  let remaining = times;
  const playNext = () => {
    remaining -= 1;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    if (remaining > 0) utterance.onend = playNext;
    window.speechSynthesis.speak(utterance);
  };
  playNext();
}
