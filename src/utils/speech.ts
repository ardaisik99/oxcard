export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakEnglish(
  text: string,
  accent: 'en-US' | 'en-GB' = 'en-US',
  rate = 0.95,
): void {
  if (!isSpeechSupported() || !text.trim()) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = accent;
    utterance.rate = Math.max(0.5, Math.min(1.4, rate));
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const exactMatch =
        voices.find((v) => v.lang === accent && /natural|google|samantha|daniel|zira|aria/i.test(v.name)) ||
        voices.find((v) => v.lang === accent) ||
        voices.find((v) => v.lang.startsWith('en'));
      if (exactMatch) {
        utterance.voice = exactMatch;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // Gracefully ignore audio errors in restricted browsers
  }
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
