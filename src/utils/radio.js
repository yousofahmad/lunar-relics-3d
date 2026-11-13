function playQuindar(context, when, duration = 0.12) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(2525, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(0.055, when + 0.012);
  gain.gain.setValueAtTime(0.055, when + duration - 0.018);
  gain.gain.linearRampToValueAtTime(0.0001, when + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.01);
}

function addRadioStatic(context, when) {
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.floor(sampleRate * 0.22), sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i += 1) channel[i] = (Math.random() * 2 - 1) * 0.28;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = 'lowpass';
  filter.frequency.value = 2600;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(0.018, when + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.21);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(when);
  source.stop(when + 0.23);
}

export function transmitText(text, language, onDone = () => {}) {
  let cancelled = false;
  let context;
  let utterance;
  let startTimer = 0;
  const finish = () => {
    if (cancelled) return;
    cancelled = true;
    if (context && context.state !== 'closed') context.close().catch(() => {});
    onDone();
  };

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      context = new AudioContextClass();
      const now = context.currentTime + 0.015;
      addRadioStatic(context, now);
      playQuindar(context, now + 0.035, 0.12);
    }
  } catch {
    context = undefined;
  }

  startTimer = window.setTimeout(() => {
    if (cancelled) return;
    if (!('speechSynthesis' in window)) {
      window.setTimeout(finish, 450);
      return;
    }
    window.speechSynthesis.cancel();
    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ar' ? 'ar-EG' : 'en-US';
    utterance.pitch = 0.72;
    utterance.rate = 0.88;
    utterance.volume = 0.96;
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith(language === 'ar' ? 'ar' : 'en'));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onend = () => {
      if (context && context.state === 'running') playQuindar(context, context.currentTime + 0.03, 0.12);
      window.setTimeout(finish, 240);
    };
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  }, 320);

  return () => {
    if (cancelled) return;
    cancelled = true;
    window.clearTimeout(startTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (context && context.state !== 'closed') context.close().catch(() => {});
    onDone();
  };
}
