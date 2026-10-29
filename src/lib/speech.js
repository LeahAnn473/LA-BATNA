export function speak(text, options = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'en-US';
  utterance.rate = options.rate ?? 1.03;
  utterance.pitch = options.pitch ?? 1.08;
  utterance.volume = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
}

export function refereeTone() {
  if (typeof window === 'undefined') return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(620, ctx.currentTime);
  osc.frequency.setValueAtTime(880, ctx.currentTime + 0.13);
  gain.gain.setValueAtTime(0.16, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
  osc.start();
  osc.stop(ctx.currentTime + 0.44);
  setTimeout(() => ctx.close(), 700);
}

export function announce(text) {
  refereeTone();
  speak(text);
}