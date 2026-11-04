// Thai text-to-speech through the browser's built-in voices.

export type SpeakResult = 'ok' | 'no-thai-voice' | 'unsupported';

let thaiVoice: SpeechSynthesisVoice | undefined;

function findThaiVoice() {
  thaiVoice = window.speechSynthesis.getVoices().find(v => /^th/i.test(v.lang));
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  findThaiVoice();
  window.speechSynthesis.addEventListener('voiceschanged', findThaiVoice);
}

export function speakThai(text: string, slow = false): SpeakResult {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return 'unsupported';
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'th-TH';
    u.rate = slow ? 0.55 : 0.9;
    if (thaiVoice) u.voice = thaiVoice;
    window.speechSynthesis.speak(u);
    return thaiVoice ? 'ok' : 'no-thai-voice';
  } catch {
    return 'unsupported';
  }
}
