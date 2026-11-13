let ambientContext;
let ambientOscillator;
let ambientFilter;
let ambientGain;
let ambientCloseTimer;
let telemetryContext;
let telemetryMuted = false;

export function setTelemetryMuted(muted) {
  telemetryMuted = Boolean(muted);
}

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function getAudioContextClass() {
  return typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
}

function waitForVoices(timeout = 900) {
  const synth = window.speechSynthesis;
  const available = synth.getVoices();
  if (available.length) return Promise.resolve(available);

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      synth.removeEventListener?.('voiceschanged', finish);
      resolve(synth.getVoices());
    };
    const timer = window.setTimeout(finish, timeout);
    synth.addEventListener?.('voiceschanged', finish, { once: true });
  });
}

function chooseVoice(voices, language) {
  const arabic = language === 'ar';
  const priorities = arabic
    ? [/google\s*العربية/i, /microsoft\s*hamed/i, /microsoft\s*salma/i]
    : [/google\s*uk\s*english\s*male/i, /google\s*us\s*english/i, /microsoft.*natural/i, /\bdaniel\b/i, /\bsamantha\b/i];

  for (const priority of priorities) {
    const match = voices.find((voice) => priority.test(voice.name));
    if (match) return match;
  }

  const localePrefix = arabic ? 'ar' : 'en';
  const localVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(localePrefix));
  const natural = localVoices.find((voice) => /natural|neural|enhanced|premium|google|microsoft/i.test(voice.name));
  return natural || localVoices[0] || null;
}

/**
 * Speaks a clean mission transmission while progressively revealing its caption.
 * Returns a cancellation function. No radio static or harsh transition tones are generated.
 */
export function transmitText(text, language, onDone = () => {}, options = {}) {
  let cancelled = false;
  let utterance;
  let progressTimer;
  let fallbackTimer;
  let lastProgress = 0;
  let startedAt = Date.now();
  const safeText = String(text || '').trim();
  const { voiceEnabled = true, onProgress = () => {} } = options;
  const estimatedDuration = Math.max(1600, safeText.length * (language === 'ar' ? 72 : 54));
  let speechStarted = !voiceEnabled || !('speechSynthesis' in window);

  const reportProgress = (index) => {
    const next = clamp(Math.floor(index), 0, safeText.length);
    if (next <= lastProgress) return;
    lastProgress = next;
    onProgress(next);
  };

  const finish = () => {
    if (cancelled) return;
    cancelled = true;
    window.clearInterval(progressTimer);
    window.clearTimeout(fallbackTimer);
    reportProgress(safeText.length);
    onDone();
  };

  if (!safeText) {
    finish();
    return () => {};
  }

  progressTimer = window.setInterval(() => {
    if (!speechStarted) return;
    const elapsed = Date.now() - startedAt;
    reportProgress((elapsed / estimatedDuration) * safeText.length);
  }, 72);

  if (!voiceEnabled || !('speechSynthesis' in window)) {
    fallbackTimer = window.setTimeout(finish, estimatedDuration);
  } else {
    (async () => {
      const voices = await waitForVoices();
      if (cancelled) return;
      window.speechSynthesis.cancel();
      utterance = new SpeechSynthesisUtterance(safeText);
      utterance.lang = language === 'ar' ? 'ar-EG' : 'en-US';
      utterance.pitch = 0.92;
      utterance.rate = 0.95;
      utterance.volume = 0.82;
      const voice = chooseVoice(voices, language);
      if (voice) utterance.voice = voice;
      utterance.onboundary = (event) => {
        if (Number.isFinite(event.charIndex)) reportProgress(event.charIndex + (event.charLength || 1));
      };
      utterance.onend = finish;
      utterance.onerror = () => {
        if (cancelled) return;
        window.clearTimeout(fallbackTimer);
        speechStarted = true;
        startedAt = Date.now();
        const remaining = Math.max(650, estimatedDuration * (1 - lastProgress / Math.max(1, safeText.length)));
        fallbackTimer = window.setTimeout(finish, remaining);
      };
      try {
        startedAt = Date.now();
        speechStarted = true;
        window.speechSynthesis.speak(utterance);
      } catch {
        startedAt = Date.now();
        speechStarted = true;
        fallbackTimer = window.setTimeout(finish, estimatedDuration);
      }
    })();
    fallbackTimer = window.setTimeout(finish, estimatedDuration + 1800);
  }

  return () => {
    if (cancelled) return;
    cancelled = true;
    window.clearInterval(progressTimer);
    window.clearTimeout(fallbackTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    onDone();
  };
}

/** Soft, optional sine-wave ambience capped at gain 0.03 and low-pass filtered. */
export async function setAmbientEnabled(enabled) {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) return false;

  if (!enabled) {
    if (!ambientContext || !ambientGain) return true;
    window.clearTimeout(ambientCloseTimer);
    const context = ambientContext;
    const oscillator = ambientOscillator;
    ambientGain.gain.cancelScheduledValues(context.currentTime);
    ambientGain.gain.setTargetAtTime(0, context.currentTime, 0.2);
    ambientCloseTimer = window.setTimeout(() => {
      if (ambientContext !== context) return;
      try { oscillator?.stop(); } catch { /* already stopped */ }
      context.close().catch(() => {});
      ambientContext = undefined;
      ambientOscillator = undefined;
      ambientFilter = undefined;
      ambientGain = undefined;
    }, 950);
    return true;
  }

  if (!ambientContext || ambientContext.state === 'closed') {
    ambientContext = new AudioContextClass();
    ambientOscillator = ambientContext.createOscillator();
    ambientFilter = ambientContext.createBiquadFilter();
    ambientGain = ambientContext.createGain();
    ambientOscillator.type = 'sine';
    ambientOscillator.frequency.value = 65.4;
    ambientFilter.type = 'lowpass';
    ambientFilter.frequency.value = 180;
    ambientFilter.Q.value = 0.35;
    ambientGain.gain.value = 0.0001;
    ambientOscillator.connect(ambientFilter);
    ambientFilter.connect(ambientGain);
    ambientGain.connect(ambientContext.destination);
    ambientOscillator.start();
  }

  window.clearTimeout(ambientCloseTimer);
  try { await ambientContext.resume(); } catch { return false; }
  ambientGain.gain.cancelScheduledValues(ambientContext.currentTime);
  ambientGain.gain.setTargetAtTime(0.03, ambientContext.currentTime, 0.8);
  return true;
}

/** Tiny, optional UI cue for chapter and hardware transitions. Peak gain stays below 0.005. */
export async function playTelemetryTick(kind = 'tick') {
  if (telemetryMuted) return false;
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) return false;

  try {
    if (!telemetryContext || telemetryContext.state === 'closed') telemetryContext = new AudioContextClass();
    if (telemetryContext.state === 'suspended') await telemetryContext.resume();
    const context = telemetryContext;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const duration = kind === 'whoosh' ? 0.13 : 0.055;
    const peak = kind === 'whoosh' ? 0.0035 : 0.0045;
    oscillator.type = kind === 'whoosh' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(kind === 'whoosh' ? 520 : 880, now);
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'whoosh' ? 150 : 660, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    return true;
  } catch {
    return false;
  }
}
