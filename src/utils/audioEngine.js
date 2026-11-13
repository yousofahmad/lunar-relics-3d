const AMBIENT_LEVEL = 0.24;
const MASTER_LEVEL = 0.72;
const CROSSFADE_SECONDS = 1.5;
const VOICE_DUCK_LEVEL = 0.4;

let audioContext = null;
let masterGain = null;
let ambientBus = null;
let cueBus = null;
let soundscapeLayers = null;
let activeSoundscape = 'Moon';
let isMuted = false;
let isStarted = false;
let unlockListenersInstalled = false;
let voiceSession = 0;
const statusListeners = new Set();

const SOUNDSCAPES = {
  moon: 'Moon',
  mars: 'Mars',
  space: 'Deep Space',
};

function normalizeSoundscape(target) {
  if (target === 'Mars' || target === 'mars') return 'Mars';
  if (target === 'Deep Space' || target === 'space' || target === 'Space') return 'Deep Space';
  return 'Moon';
}

function statusSnapshot() {
  return {
    soundscape: activeSoundscape,
    muted: isMuted,
    started: isStarted && audioContext?.state === 'running',
  };
}

function notifyStatus() {
  const status = statusSnapshot();
  statusListeners.forEach((listener) => listener(status));
}

export function subscribeAudioEngine(listener) {
  statusListeners.add(listener);
  listener(statusSnapshot());
  return () => statusListeners.delete(listener);
}

function ramp(param, target, seconds = 0.2) {
  if (!audioContext || !param) return;
  const now = audioContext.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(target, now + seconds);
}

function getContext() {
  if (typeof window === 'undefined') return null;
  if (audioContext) return audioContext;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  audioContext = new AudioContextClass();
  masterGain = audioContext.createGain();
  masterGain.gain.value = isMuted ? 0 : MASTER_LEVEL;
  masterGain.connect(audioContext.destination);

  ambientBus = audioContext.createGain();
  ambientBus.gain.value = AMBIENT_LEVEL;
  ambientBus.connect(masterGain);

  cueBus = audioContext.createGain();
  cueBus.gain.value = 0.55;
  cueBus.connect(masterGain);
  return audioContext;
}

function createNoiseBuffer(context, color = 'white', duration = 2) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let brownValue = 0;
  for (let index = 0; index < frameCount; index += 1) {
    const whiteValue = Math.random() * 2 - 1;
    if (color === 'brown') {
      brownValue = (brownValue + 0.025 * whiteValue) / 1.025;
      samples[index] = brownValue * 3.2;
    } else {
      samples[index] = whiteValue;
    }
  }
  return buffer;
}

function createNoiseSource(context, color = 'white', duration = 2) {
  const source = context.createBufferSource();
  source.buffer = createNoiseBuffer(context, color, duration);
  source.loop = true;
  return source;
}

function createOscillator(context, frequency, type, output, level) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = level;
  oscillator.connect(gain);
  gain.connect(output);
  oscillator.start();
  return { oscillator, gain };
}

function makeLayer(context) {
  const level = context.createGain();
  level.gain.value = 0;
  level.connect(ambientBus);
  return level;
}

function buildMoonLayer(context) {
  const layer = makeLayer(context);
  const lowPass = context.createBiquadFilter();
  lowPass.type = 'lowpass';
  lowPass.frequency.value = 180;
  lowPass.Q.value = 0.55;
  lowPass.connect(layer);
  createOscillator(context, 55, 'sine', lowPass, 0.24);
  createOscillator(context, 110, 'triangle', lowPass, 0.065);

  const shimmer = createNoiseSource(context, 'white');
  const shimmerHighPass = context.createBiquadFilter();
  shimmerHighPass.type = 'highpass';
  shimmerHighPass.frequency.value = 1250;
  const shimmerLowPass = context.createBiquadFilter();
  shimmerLowPass.type = 'lowpass';
  shimmerLowPass.frequency.value = 3200;
  const shimmerLevel = context.createGain();
  shimmerLevel.gain.value = 0.012;
  shimmer.connect(shimmerHighPass);
  shimmerHighPass.connect(shimmerLowPass);
  shimmerLowPass.connect(shimmerLevel);
  shimmerLevel.connect(layer);
  shimmer.start();

  const carrier = context.createOscillator();
  const carrierFilter = context.createBiquadFilter();
  const carrierLevel = context.createGain();
  carrier.type = 'sine';
  carrier.frequency.value = 410;
  carrierFilter.type = 'bandpass';
  carrierFilter.frequency.value = 410;
  carrierFilter.Q.value = 4;
  carrierLevel.gain.value = 0.009;
  carrier.connect(carrierFilter);
  carrierFilter.connect(carrierLevel);
  carrierLevel.connect(layer);
  carrier.start();
  return layer;
}

function buildMarsLayer(context) {
  const layer = makeLayer(context);
  const wind = createNoiseSource(context, 'brown');
  const windBand = context.createBiquadFilter();
  windBand.type = 'bandpass';
  windBand.frequency.value = 285;
  windBand.Q.value = 0.65;
  const windLevel = context.createGain();
  windLevel.gain.value = 0.58;
  wind.connect(windBand);
  windBand.connect(windLevel);
  windLevel.connect(layer);
  wind.start();

  const sweep = context.createOscillator();
  const sweepDepth = context.createGain();
  sweep.type = 'sine';
  sweep.frequency.value = 0.12;
  sweepDepth.gain.value = 165;
  sweep.connect(sweepDepth);
  sweepDepth.connect(windBand.frequency);
  sweep.start();

  const lowRumble = createNoiseSource(context, 'brown');
  const rumbleFilter = context.createBiquadFilter();
  rumbleFilter.type = 'lowpass';
  rumbleFilter.frequency.value = 105;
  const rumbleLevel = context.createGain();
  rumbleLevel.gain.value = 0.12;
  lowRumble.connect(rumbleFilter);
  rumbleFilter.connect(rumbleLevel);
  rumbleLevel.connect(layer);
  lowRumble.start();
  return layer;
}

function buildSpaceLayer(context) {
  const layer = makeLayer(context);
  const pan = context.createStereoPanner ? context.createStereoPanner() : context.createGain();
  pan.connect(layer);
  createOscillator(context, 65, 'sine', pan, 0.19);
  createOscillator(context, 98, 'triangle', pan, 0.055);

  if (context.createStereoPanner) {
    const drift = context.createOscillator();
    const driftDepth = context.createGain();
    drift.type = 'sine';
    drift.frequency.value = 0.055;
    driftDepth.gain.value = 0.24;
    drift.connect(driftDepth);
    driftDepth.connect(pan.pan);
    drift.start();
  }
  return layer;
}

function fadeToSoundscape(target) {
  if (!audioContext || !soundscapeLayers) return;
  const normalized = normalizeSoundscape(target);
  const layerKey = normalized === 'Moon' ? 'moon' : normalized === 'Mars' ? 'mars' : 'space';
  const now = audioContext.currentTime;
  Object.entries(soundscapeLayers).forEach(([key, layer]) => {
    const param = layer.gain;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(key === layerKey ? 1 : 0, now + CROSSFADE_SECONDS);
  });
}

function buildSoundscapes(context) {
  if (soundscapeLayers) return;
  soundscapeLayers = {
    moon: buildMoonLayer(context),
    mars: buildMarsLayer(context),
    space: buildSpaceLayer(context),
  };
  fadeToSoundscape(activeSoundscape);
}

export function startAudioEngine() {
  const context = getContext();
  if (!context) return false;
  buildSoundscapes(context);
  context.resume().then(() => {
    isStarted = context.state === 'running';
    if (isStarted) fadeToSoundscape(activeSoundscape);
    notifyStatus();
  }).catch(() => {});
  return true;
}

export function initializeAudioEngine() {
  if (typeof document === 'undefined' || unlockListenersInstalled) return () => {};
  unlockListenersInstalled = true;
  const events = ['pointerdown', 'click', 'wheel', 'touchstart', 'touchmove', 'keydown'];
  const unlock = (event) => {
    if (event.type === 'keydown' && event.repeat) return;
    events.forEach((eventName) => document.removeEventListener(eventName, unlock, true));
    unlockListenersInstalled = false;
    startAudioEngine();
  };
  events.forEach((eventName) => document.addEventListener(eventName, unlock, { capture: true, passive: true }));
  return () => {
    events.forEach((eventName) => document.removeEventListener(eventName, unlock, true));
    unlockListenersInstalled = false;
  };
}

export function setSoundscape(target) {
  activeSoundscape = normalizeSoundscape(target);
  if (audioContext && soundscapeLayers) fadeToSoundscape(activeSoundscape);
  notifyStatus();
}

export function setAudioMuted(muted, { startIfUnmuting = false } = {}) {
  isMuted = Boolean(muted);
  if (masterGain && audioContext) ramp(masterGain.gain, isMuted ? 0 : MASTER_LEVEL, 0.12);
  if (!isMuted && startIfUnmuting) startAudioEngine();
  notifyStatus();
}

function setAmbientDuck(ducked) {
  if (ambientBus && audioContext) ramp(ambientBus.gain, AMBIENT_LEVEL * (ducked ? VOICE_DUCK_LEVEL : 1), 0.22);
}

function playTone(frequency, duration = 0.18) {
  const context = getContext();
  if (!context || isMuted || !cueBus) return Promise.resolve();
  context.resume().catch(() => {});
  return new Promise((resolve) => {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.linearRampToValueAtTime(0.075, now + 0.018);
    envelope.gain.setValueAtTime(0.075, now + duration - 0.035);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(cueBus);
    oscillator.onended = resolve;
    oscillator.start(now);
    oscillator.stop(now + duration + 0.005);
  });
}

function waitForTone(promise, duration) {
  if (typeof window === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, duration * 1000 + 120);
    Promise.resolve(promise).then(finish, finish);
  });
}

export async function beginVoiceCue() {
  const session = ++voiceSession;
  if (!audioContext) startAudioEngine();
  setAmbientDuck(true);
  await waitForTone(playTone(2525, 0.18), 0.18);
  return session;
}

export function finishVoiceCue(session) {
  if (!session || session !== voiceSession) return;
  waitForTone(playTone(2475, 0.18), 0.18).finally(() => {
    if (session !== voiceSession) return;
    setAmbientDuck(false);
  });
}

export function cancelVoiceCue(session) {
  if (!session || session !== voiceSession) return;
  voiceSession += 1;
  setAmbientDuck(false);
}

export function playScrollWhoosh() {
  if (!audioContext || !isStarted || isMuted || !cueBus) return;
  const source = audioContext.createBufferSource();
  source.buffer = createNoiseBuffer(audioContext, 'brown', 0.55);
  const highPass = audioContext.createBiquadFilter();
  highPass.type = 'highpass';
  highPass.frequency.value = 55;
  const lowPass = audioContext.createBiquadFilter();
  lowPass.type = 'lowpass';
  lowPass.frequency.value = 980;
  lowPass.frequency.setValueAtTime(420, audioContext.currentTime);
  lowPass.frequency.linearRampToValueAtTime(980, audioContext.currentTime + 0.16);
  lowPass.frequency.linearRampToValueAtTime(300, audioContext.currentTime + 0.46);
  const envelope = audioContext.createGain();
  const now = audioContext.currentTime;
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.linearRampToValueAtTime(0.055, now + 0.08);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
  source.connect(highPass);
  highPass.connect(lowPass);
  lowPass.connect(envelope);
  envelope.connect(cueBus);
  source.start(now);
  source.stop(now + 0.5);
}

export function playSonarLock() {
  if (!audioContext || !isStarted || isMuted || !cueBus) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.24);
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.linearRampToValueAtTime(0.045, now + 0.018);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  oscillator.connect(envelope);
  envelope.connect(cueBus);
  oscillator.start(now);
  oscillator.stop(now + 0.3);
}

export function getAudioEngineStatus() {
  return statusSnapshot();
}

export const soundscapeNames = SOUNDSCAPES;
