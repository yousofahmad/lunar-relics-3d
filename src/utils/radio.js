function chooseNaturalVoice(voices, language) {
  const prefix = language === 'ar' ? 'ar' : 'en';
  const sameLanguage = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(prefix));
  const naturalProvider = /(google|microsoft).*(natural|neural|online)|natural.*(google|microsoft)/i;
  return sameLanguage.find((voice) => naturalProvider.test(voice.name))
    || sameLanguage.find((voice) => /(google|microsoft)/i.test(voice.name))
    || sameLanguage.find((voice) => voice.default)
    || sameLanguage[0]
    || null;
}

function loadVoices(synthesis) {
  const available = synthesis.getVoices();
  if (available.length) return Promise.resolve(available);

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      synthesis.removeEventListener?.('voiceschanged', finish);
      resolve(synthesis.getVoices());
    };
    const timer = window.setTimeout(finish, 800);
    synthesis.addEventListener?.('voiceschanged', finish, { once: true });
  });
}

export function transmitText(text, language, onDone = () => {}, onWordBoundary = () => {}) {
  let cancelled = false;
  let utterance;
  let wordTimer = 0;
  let voiceTimer = 0;
  const complete = () => {
    if (cancelled) return;
    cancelled = true;
    window.clearInterval(wordTimer);
    window.clearTimeout(voiceTimer);
    onDone();
  };

  if (!('speechSynthesis' in window)) {
    onWordBoundary(text);
    voiceTimer = window.setTimeout(complete, 350);
    return () => {
      if (cancelled) return;
      cancelled = true;
      window.clearTimeout(voiceTimer);
      onDone();
    };
  }

  window.speechSynthesis.cancel();
  loadVoices(window.speechSynthesis).then((voices) => {
    if (cancelled) return;
    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ar' ? 'ar-EG' : 'en-US';
    utterance.voice = chooseNaturalVoice(voices, language);
    utterance.pitch = 0.92;
    utterance.rate = 0.95;
    utterance.volume = 0.92;

    const words = text.trim().split(/\s+/).filter(Boolean);
    let fallbackWord = 0;
    let nativeBoundariesAvailable = false;
    const fallbackWordDuration = 390;
    utterance.onstart = () => {
      wordTimer = window.setInterval(() => {
        if (nativeBoundariesAvailable) {
          window.clearInterval(wordTimer);
          return;
        }
        fallbackWord = Math.min(fallbackWord + 1, words.length);
        onWordBoundary(words.slice(0, fallbackWord).join(' '));
        if (fallbackWord >= words.length) window.clearInterval(wordTimer);
      }, 390);
    };
    utterance.onboundary = (event) => {
      if (!Number.isFinite(event.charIndex)) return;
      nativeBoundariesAvailable = true;
      window.clearInterval(wordTimer);
      const start = Math.max(0, event.charIndex);
      let end = start + (Number(event.charLength) || 0);
      if (end <= start) {
        const nextSpace = text.indexOf(' ', start);
        end = nextSpace < 0 ? text.length : nextSpace;
      }
      const visibleText = text.slice(0, end).trimStart();
      fallbackWord = Math.max(fallbackWord, visibleText.trim().split(/\s+/).filter(Boolean).length);
      onWordBoundary(visibleText);
    };
    utterance.onend = () => {
      window.clearInterval(wordTimer);
      onWordBoundary(text);
      complete();
    };
    utterance.onerror = () => {
      if (cancelled) return;
      window.clearInterval(wordTimer);
      const remainingWords = Math.max(0, words.length - fallbackWord);
      if (remainingWords > 0) {
        wordTimer = window.setInterval(() => {
          fallbackWord = Math.min(fallbackWord + 1, words.length);
          onWordBoundary(words.slice(0, fallbackWord).join(' '));
          if (fallbackWord >= words.length) window.clearInterval(wordTimer);
        }, fallbackWordDuration);
      }
      voiceTimer = window.setTimeout(() => {
        onWordBoundary(text);
        complete();
      }, Math.max(650, remainingWords * fallbackWordDuration));
    };
    window.speechSynthesis.speak(utterance);
  }).catch(complete);

  return () => {
    if (cancelled) return;
    cancelled = true;
    window.clearInterval(wordTimer);
    window.clearTimeout(voiceTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    onDone();
  };
}
