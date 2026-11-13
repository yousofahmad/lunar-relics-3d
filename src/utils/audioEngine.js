const AMBIENT_LEVEL = 0.2;
const MASTER_LEVEL = 0.72;
const CROSSFADE_SECONDS = 1.5;
const VOICE_DUCK_LEVEL = 0.34;

let audioContext = null;
let masterGain = null;
let ambientBus = null;
let cueBus = null;
let soundscapeLayers = null;
let voidDroneLayer = null;
let spatialFxInput = null;
let activeSoundscape = 'Moon';
let isMuted = false;
let isStarted = false;
let unlockListenersInstalled = false;
let voiceSession = 0;
let voiceActive = false;
let voiceRadioBed = null;
let telemetryTimer = 0;
let signatureTimer = 0;
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

function createReverbBuffer(context, duration = 1.8, decay = 2.3) {
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      const envelope = (1 - index / length) ** decay;
      samples[index] = (Math.random() * 2 - 1) * envelope * (channel === 0 ? 1 : 0.94);
    }
  }
  return buffer;
}

function buildSpatialEffects(context) {
  const input = context.createGain();
  const delay = context.createDelay(1.6);
  const tone = context.createBiquadFilter();
  const feedback = context.createGain();
  const convolver = context.createConvolver();
  const wet = context.createGain();

  delay.delayTime.value = 0.37;
  tone.type = 'lowpass';
  tone.frequency.value = 2600;
  feedback.gain.value = 0.2;
  convolver.buffer = createReverbBuffer(context);
  wet.gain.value = 0.34;

  input.connect(cueBus);
  input.connect(delay);
  delay.connect(tone);
  tone.connect(feedback);
  feedback.connect(delay);
  tone.connect(convolver);
  convolver.connect(wet);
  wet.connect(cueBus);
  return input;
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
  spatialFxInput = buildSpatialEffects(audioContext);
  return audioContext;
}

function createNoiseBuffer(context, color = 'white', duration = 2) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let brownValue = 0;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let index = 0; index < frameCount; index += 1) {
    const whiteValue = Math.random() * 2 - 1;
    if (color === 'brown') {
      brownValue = (brownValue + 0.025 * whiteValue) / 1.025;
      samples[index] = brownValue * 3.2;
    } else if (color === 'pink') {
      b0 = 0.99886 * b0 + whiteValue * 0.0555179;
      b1 = 0.99332 * b1 + whiteValue * 0.0750759;
      b2 = 0.969 * b2 + whiteValue * 0.153852;
      b3 = 0.8665 * b3 + whiteValue * 0.3104856;
      b4 = 0.55 * b4 + whiteValue * 0.5329522;
      b5 = -0.7616 * b5 - whiteValue * 0.016898;
      samples[index] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + whiteValue * 0.5362) * 0.11;
      b6 = whiteValue * 0.115926;
    } else {
      samples[index] = whiteValue;
    }
  }
  return buffer;
}

function createNoiseSource(context, color = 'white', duration = 3) {
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

function buildVoidDrone(context) {
  if (voidDroneLayer) return voidDroneLayer;
  const layer = context.createGain();
  const lowPass = context.createBiquadFilter();
  const stereo = context.createStereoPanner ? context.createStereoPanner() : context.createGain();
  layer.gain.value = 0.5;
  lowPass.type = 'lowpass';
  lowPass.frequency.value = 150;
  lowPass.Q.value = 0.65;
  layer.connect(ambientBus);
  lowPass.connect(stereo);
  stereo.connect(layer);

  const first = createOscillator(context, 52, 'sine', lowPass, 0.22);
  const detuned = createOscillator(context, 52.4, 'sine', lowPass, 0.21);
  createOscillator(context, 78, 'triangle', lowPass, 0.095);

  const drift = context.createOscillator();
  const driftDepth = context.createGain();
  drift.type = 'sine';
  drift.frequency.value = 0.045;
  driftDepth.gain.value = 0.11;
  drift.connect(driftDepth);
  driftDepth.connect(first.oscillator.frequency);
  driftDepth.connect(detuned.oscillator.frequency);
  drift.start();

  if (context.createStereoPanner) {
    const panLfo = context.createOscillator();
    const panDepth = context.createGain();
    panLfo.frequency.value = 0.035;
    panDepth.gain.value = 0.12;
    panLfo.connect(panDepth);
    panDepth.connect(stereo.pan);
    panLfo.start();
  }
  voidDroneLayer = layer;
  return layer;
}

function buildMoonLayer(context) {
  const layer = makeLayer(context);
  const lowPass = context.createBiquadFilter();
  lowPass.type = 'lowpass';
  lowPass.frequency.value = 260;
  lowPass.Q.value = 0.62;
  lowPass.connect(layer);

  const heartbeat = createOscillator(context, 38, 'sine', lowPass, 0.1);
  const pulse = context.createOscillator();
  const pulseDepth = context.createGain();
  pulse.frequency.value = 0.62;
  pulseDepth.gain.value = 0.025;
  pulse.connect(pulseDepth);
  pulseDepth.connect(heartbeat.gain.gain);
  pulse.start();

  const staticNoise = createNoiseSource(context, 'white', 4);
  const staticHighPass = context.createBiquadFilter();
  const staticLowPass = context.createBiquadFilter();
  const staticGain = context.createGain();
  staticHighPass.type = 'highpass';
  staticHighPass.frequency.value = 1550;
  staticLowPass.type = 'lowpass';
  staticLowPass.frequency.value = 5200;
  staticGain.gain.value = 0.013;
  staticNoise.connect(staticHighPass);
  staticHighPass.connect(staticLowPass);
  staticLowPass.connect(staticGain);
  staticGain.connect(layer);
  staticNoise.start();

  const carrier = context.createOscillator();
  const carrierFilter = context.createBiquadFilter();
  const carrierGain = context.createGain();
  carrier.type = 'sine';
  carrier.frequency.value = 410;
  carrierFilter.type = 'bandpass';
  carrierFilter.frequency.value = 410;
  carrierFilter.Q.value = 5;
  carrierGain.gain.value = 0.006;
  carrier.connect(carrierFilter);
  carrierFilter.connect(carrierGain);
  carrierGain.connect(layer);
  carrier.start();
  return layer;
}

function buildMarsLayer(context) {
  const layer = makeLayer(context);
  const wind = createNoiseSource(context, 'pink', 5);
  const windBand = context.createBiquadFilter();
  const windGain = context.createGain();
  const windPan = context.createStereoPanner ? context.createStereoPanner() : context.createGain();
  windBand.type = 'bandpass';
  windBand.frequency.value = 255;
  windBand.Q.value = 0.52;
  windGain.gain.value = 0.31;
  wind.connect(windBand);
  windBand.connect(windGain);
  windGain.connect(windPan);
  windPan.connect(layer);
  wind.start();

  const gust = context.createOscillator();
  const gustDepth = context.createGain();
  gust.type = 'sine';
  gust.frequency.value = 0.085;
  gustDepth.gain.value = 180;
  gust.connect(gustDepth);
  gustDepth.connect(windBand.frequency);
  gust.start();

  if (context.createStereoPanner) {
    const panLfo = context.createOscillator();
    const panDepth = context.createGain();
    panLfo.frequency.value = 0.024;
    panDepth.gain.value = 0.72;
    panLfo.connect(panDepth);
    panDepth.connect(windPan.pan);
    panLfo.start();
  }

  const rumble = createNoiseSource(context, 'brown', 4);
  const rumbleFilter = context.createBiquadFilter();
  const rumbleGain = context.createGain();
  rumbleFilter.type = 'lowpass';
  rumbleFilter.frequency.value = 105;
  rumbleGain.gain.value = 0.14;
  rumble.connect(rumbleFilter);
  rumbleFilter.connect(rumbleGain);
  rumbleGain.connect(layer);
  rumble.start();

  const servoFilter = context.createBiquadFilter();
  const servoGain = context.createGain();
  servoFilter.type = 'bandpass';
  servoFilter.frequency.value = 540;
  servoFilter.Q.value = 2.4;
  servoGain.gain.value = 0.012;
  createOscillator(context, 92, 'triangle', servoFilter, 0.28);
  createOscillator(context, 138, 'sine', servoFilter, 0.16);
  servoFilter.connect(servoGain);
  servoGain.connect(layer);
  return layer;
}

function buildSpaceLayer(context) {
  const layer = makeLayer(context);
  const pan = context.createStereoPanner ? context.createStereoPanner() : context.createGain();
  pan.connect(layer);
  createOscillator(context, 65, 'sine', pan, 0.15);
  createOscillator(context, 98, 'triangle', pan, 0.06);
  createOscillator(context, 156, 'sine', pan, 0.018);

  if (context.createStereoPanner) {
    const drift = context.createOscillator();
    const driftDepth = context.createGain();
    drift.type = 'sine';
    drift.frequency.value = 0.055;
    driftDepth.gain.value = 0.34;
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
  buildVoidDrone(context);
  soundscapeLayers = {
    moon: buildMoonLayer(context),
    mars: buildMarsLayer(context),
    space: buildSpaceLayer(context),
  };
  fadeToSoundscape(activeSoundscape);
}

function makePanner(context, pan = 0) {
  if (!context.createStereoPanner) return context.createGain();
  const node = context.createStereoPanner();
  node.pan.value = pan;
  return node;
}

function createEventEnvelope(context, start, duration, level) {
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.linearRampToValueAtTime(level, start + Math.min(0.035, duration * 0.16));
  envelope.gain.setValueAtTime(level, start + duration * 0.66);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  return envelope;
}

function playTelemetryEvent(forcedKind = '') {
  const context = audioContext;
  if (!context || !isStarted || isMuted || !spatialFxInput) return;
  if (voiceActive && !forcedKind) return;

  const mars = activeSoundscape === 'Mars';
  const kinds = mars ? ['radio', 'morse', 'chime', 'creak'] : ['radio', 'morse', 'chime', 'sweep'];
  const kind = forcedKind || kinds[Math.floor(Math.random() * kinds.length)];
  const now = context.currentTime + 0.025;
  const pan = Math.random() * 1.5 - 0.75;
  const output = makePanner(context, pan);
  output.connect(spatialFxInput);

  if (kind === 'morse') {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const count = 3 + Math.floor(Math.random() * 4);
    const pulseLength = 0.055 + Math.random() * 0.035;
    const gap = 0.085 + Math.random() * 0.055;
    const end = now + count * gap + 0.025;
    oscillator.type = 'sine';
    oscillator.frequency.value = 710 + Math.random() * 1500;
    filter.type = 'bandpass';
    filter.frequency.value = oscillator.frequency.value;
    filter.Q.value = 3.8;
    for (let index = 0; index < count; index += 1) {
      const start = now + index * gap;
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.linearRampToValueAtTime(0.025, start + 0.008);
      envelope.gain.setValueAtTime(0.025, start + pulseLength - 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + pulseLength);
    }
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(output);
    oscillator.start(now);
    oscillator.stop(end);
    oscillator.onended = () => { try { output.disconnect(); } catch {} };
    return;
  }

  if (kind === 'chime') {
    const base = 420 + Math.random() * 760;
    [1, 1.5, 2.01].forEach((ratio, index) => {
      const oscillator = context.createOscillator();
      const envelope = createEventEnvelope(context, now, 0.82 + index * 0.17, 0.018 / (index + 1));
      oscillator.type = index === 2 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(base * ratio, now);
      oscillator.detune.value = (Math.random() - 0.5) * 7;
      oscillator.connect(envelope);
      envelope.connect(output);
      oscillator.start(now);
      oscillator.stop(now + 1.1 + index * 0.16);
      if (index === 2) oscillator.onended = () => { try { output.disconnect(); } catch {} };
    });
    return;
  }

  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const duration = kind === 'creak' ? 0.7 + Math.random() * 0.45 : 0.8 + Math.random() * 0.7;
  const envelope = createEventEnvelope(context, now, duration, kind === 'creak' ? 0.012 : 0.02);
  if (kind === 'radio') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1450 + Math.random() * 1700, now);
    oscillator.frequency.exponentialRampToValueAtTime(280 + Math.random() * 420, now + duration);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2100, now);
    filter.frequency.exponentialRampToValueAtTime(540, now + duration);
    filter.Q.value = 1.8;
  } else if (kind === 'creak') {
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(260 + Math.random() * 240, now);
    oscillator.frequency.exponentialRampToValueAtTime(90 + Math.random() * 60, now + duration);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(480, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + duration);
    filter.Q.value = 5.5;
  } else {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(210 + Math.random() * 230, now);
    oscillator.frequency.exponentialRampToValueAtTime(1500 + Math.random() * 800, now + duration);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(480, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + duration);
    filter.Q.value = 5.2;
  }
  oscillator.connect(filter);
  filter.connect(envelope);
  envelope.connect(output);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
  oscillator.onended = () => { try { output.disconnect(); } catch {} };
}

function clearProceduralTimers() {
  if (typeof window === 'undefined') return;
  window.clearTimeout(telemetryTimer);
  window.clearTimeout(signatureTimer);
  telemetryTimer = 0;
  signatureTimer = 0;
}

function scheduleProceduralEvents() {
  if (typeof window === 'undefined' || !isStarted || isMuted) return;
  if (!telemetryTimer) {
    telemetryTimer = window.setTimeout(() => {
      telemetryTimer = 0;
      playTelemetryEvent();
      scheduleProceduralEvents();
    }, 2000 + Math.random() * 2000);
  }

  if (!signatureTimer) {
    signatureTimer = window.setTimeout(() => {
      signatureTimer = 0;
      if (!voiceActive && activeSoundscape === 'Moon') {
        playTone(2525, 0.09, 0.018);
        window.setTimeout(() => playTone(2475, 0.09, 0.018), 250);
      } else if (!voiceActive && activeSoundscape === 'Mars') {
        playTelemetryEvent('creak');
      }
      scheduleProceduralEvents();
    }, 15000 + Math.random() * 10000);
  }
}

export function startAudioEngine() {
  const context = getContext();
  if (!context) return false;
  buildSoundscapes(context);
  context.resume().then(() => {
    isStarted = context.state === 'running';
    if (isStarted) {
      fadeToSoundscape(activeSoundscape);
      scheduleProceduralEvents();
    }
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
  if (isMuted) clearProceduralTimers();
  else if (startIfUnmuting) startAudioEngine();
  else if (isStarted) scheduleProceduralEvents();
  notifyStatus();
}

function setAmbientDuck(ducked) {
  if (ambientBus && audioContext) ramp(ambientBus.gain, AMBIENT_LEVEL * (ducked ? VOICE_DUCK_LEVEL : 1), 0.22);
}

function playTone(frequency, duration = 0.18, level = 0.075) {
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
    envelope.gain.linearRampToValueAtTime(level, now + Math.min(0.02, duration * 0.18));
    envelope.gain.setValueAtTime(level, now + duration * 0.72);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(cueBus);
    oscillator.onended = resolve;
    oscillator.start(now);
    oscillator.stop(now + duration + 0.005);
  });
}

function startVoiceRadioBed() {
  if (!audioContext || isMuted || voiceRadioBed) return;
  const context = audioContext;
  const output = context.createGain();
  output.gain.setValueAtTime(0.0001, context.currentTime);
  output.gain.linearRampToValueAtTime(0.55, context.currentTime + 0.16);
  output.connect(cueBus);

  const staticNoise = createNoiseSource(context, 'white', 1.4);
  const staticBand = context.createBiquadFilter();
  const staticGain = context.createGain();
  staticBand.type = 'bandpass';
  staticBand.frequency.value = 1850;
  staticBand.Q.value = 0.62;
  staticGain.gain.value = 0.026;
  staticNoise.connect(staticBand);
  staticBand.connect(staticGain);
  staticGain.connect(output);
  staticNoise.start();

  const humFilter = context.createBiquadFilter();
  const humGain = context.createGain();
  humFilter.type = 'bandpass';
  humFilter.frequency.value = 540;
  humFilter.Q.value = 2.8;
  humGain.gain.value = 0.012;
  const humA = context.createOscillator();
  const humB = context.createOscillator();
  humA.type = 'sine';
  humA.frequency.value = 520;
  humB.type = 'triangle';
  humB.frequency.value = 526;
  humA.connect(humFilter);
  humB.connect(humFilter);
  humFilter.connect(humGain);
  humGain.connect(output);
  humA.start();
  humB.start();
  voiceRadioBed = { output, sources: [staticNoise, humA, humB] };
}

function stopVoiceRadioBed(fadeSeconds = 0.13) {
  const bed = voiceRadioBed;
  if (!bed || !audioContext) return;
  voiceRadioBed = null;
  ramp(bed.output.gain, 0, fadeSeconds);
  const stop = () => bed.sources.forEach((source) => { try { source.stop(); } catch {} });
  if (typeof window !== 'undefined') window.setTimeout(stop, Math.ceil(fadeSeconds * 1000) + 30);
  else stop();
}

function playSquelchTail() {
  const context = audioContext;
  if (!context || isMuted || !cueBus) return;
  const duration = 0.08;
  const source = context.createBufferSource();
  const band = context.createBiquadFilter();
  const envelope = context.createGain();
  source.buffer = createNoiseBuffer(context, 'white', 0.12);
  band.type = 'bandpass';
  band.frequency.value = 2400;
  band.Q.value = 0.7;
  const now = context.currentTime;
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.linearRampToValueAtTime(0.035, now + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(band);
  band.connect(envelope);
  envelope.connect(cueBus);
  source.start(now);
  source.stop(now + duration + 0.01);
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
  voiceActive = true;
  setAmbientDuck(true);
  await waitForTone(playTone(2525, 0.18), 0.18);
  if (session !== voiceSession) return 0;
  startVoiceRadioBed();
  return session;
}

export async function finishVoiceCue(session) {
  if (!session || session !== voiceSession) return;
  await waitForTone(playTone(2475, 0.18), 0.18);
  if (session !== voiceSession) return;
  playSquelchTail();
  await new Promise((resolve) => window.setTimeout(resolve, 100));
  if (session !== voiceSession) return;
  voiceActive = false;
  stopVoiceRadioBed();
  setAmbientDuck(false);
}

export function cancelVoiceCue(session) {
  if (!session || session !== voiceSession) return;
  voiceSession += 1;
  voiceActive = false;
  stopVoiceRadioBed(0.07);
  setAmbientDuck(false);
}

export function playUiChirp() {
  const context = audioContext;
  if (!context || !isStarted || isMuted || !cueBus) return;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const panner = makePanner(context, (Math.random() - 0.5) * 0.18);
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1800, now);
  oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.025);
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.linearRampToValueAtTime(0.026, now + 0.004);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.034);
  oscillator.connect(envelope);
  envelope.connect(panner);
  panner.connect(cueBus);
  oscillator.onended = () => { try { panner.disconnect(); } catch {} };
  oscillator.start(now);
  oscillator.stop(now + 0.04);
}

export function playScrollWhoosh(direction = 1) {
  const context = audioContext;
  if (!context || !isStarted || isMuted || !cueBus) return;
  const source = context.createBufferSource();
  source.buffer = createNoiseBuffer(context, 'brown', 0.55);
  const highPass = context.createBiquadFilter();
  const lowPass = context.createBiquadFilter();
  const envelope = context.createGain();
  const panner = makePanner(context, direction >= 0 ? -0.72 : 0.72);
  const now = context.currentTime;
  highPass.type = 'highpass';
  highPass.frequency.value = 48;
  lowPass.type = 'lowpass';
  lowPass.frequency.setValueAtTime(1450, now);
  lowPass.frequency.exponentialRampToValueAtTime(250, now + 0.42);
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.linearRampToValueAtTime(0.052, now + 0.07);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
  if (panner.pan) {
    panner.pan.setValueAtTime(direction >= 0 ? -0.72 : 0.72, now);
    panner.pan.linearRampToValueAtTime(direction >= 0 ? 0.72 : -0.72, now + 0.43);
  }
  source.connect(highPass);
  highPass.connect(lowPass);
  lowPass.connect(envelope);
  envelope.connect(panner);
  panner.connect(cueBus);
  source.onended = () => { try { panner.disconnect(); } catch {} };
  source.start(now);
  source.stop(now + 0.5);
}

export function playSonarLock() {
  const context = audioContext;
  if (!context || !isStarted || isMuted || !cueBus) return;
  const now = context.currentTime;
  [520, 790, 1180].forEach((frequency, index) => {
    const start = now + index * 0.085;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(0.045, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
    oscillator.connect(envelope);
    envelope.connect(cueBus);
    oscillator.start(start);
    oscillator.stop(start + 0.145);
  });
  const thud = context.createOscillator();
  const thudGain = context.createGain();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(72, now);
  thud.frequency.exponentialRampToValueAtTime(38, now + 0.22);
  thudGain.gain.setValueAtTime(0.0001, now);
  thudGain.gain.linearRampToValueAtTime(0.08, now + 0.018);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.31);
  thud.connect(thudGain);
  thudGain.connect(cueBus);
  thud.start(now);
  thud.stop(now + 0.33);
}

export function getAudioEngineStatus() {
  return statusSnapshot();
}

export const soundscapeNames = SOUNDSCAPES;
