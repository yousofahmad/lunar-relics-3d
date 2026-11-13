import { beginVoiceCue, cancelVoiceCue, finishVoiceCue } from './audioEngine.js';

/* The old narration relied on the browser's speech synthesis, which sounds
   robotic and flattens every story. Instead we now "transmit" the text: the
   radio bed plays, subtitles reveal word by word at a human reading pace, and
   the reader keeps their own inner voice. Same signature, no TTS. */
export function transmitText(text, language, onDone = () => {}, onWordBoundary = () => {}) {
  const clean = String(text || '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const perWord = language === 'ar' ? 340 : 300;
  let cancelled = false;
  let index = 0;
  let timer = 0;
  let session = 0;

  if (!words.length) {
    onDone();
    return () => {};
  }

  const complete = () => {
    if (cancelled) return;
    cancelled = true;
    window.clearInterval(timer);
    onWordBoundary(clean);
    const done = () => onDone();
    if (session) Promise.resolve(finishVoiceCue(session)).then(done, done);
    else done();
  };

  beginVoiceCue().then((voiceSession) => {
    session = voiceSession;
    if (cancelled) cancelVoiceCue(voiceSession);
  }).catch(() => {});

  onWordBoundary('');
  timer = window.setInterval(() => {
    index += 1;
    onWordBoundary(words.slice(0, index).join(' '));
    if (index >= words.length) complete();
  }, perWord);

  return () => {
    if (cancelled) return;
    cancelled = true;
    window.clearInterval(timer);
    if (session) cancelVoiceCue(session);
    onDone();
  };
}
