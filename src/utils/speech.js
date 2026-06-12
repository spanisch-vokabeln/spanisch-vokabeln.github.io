export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text, lang = 'es-ES') {
  if (!ttsSupported) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}
