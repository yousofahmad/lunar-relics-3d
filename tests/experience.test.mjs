import test from 'node:test';
import assert from 'node:assert/strict';
import { readLaunchLocation, readPreference, savePreference } from '../src/utils/experience.js';

const records = [{ id: 'insight-lander', body: 'Mars' }, { id: 'eagle', body: 'Moon' }];

test('valid mission links open the correct world and language', () => {
  assert.deepEqual(readLaunchLocation('?mission=insight-lander&view=Moon&lang=ar', records), {
    missionId: 'insight-lander', view: 'Mars', language: 'ar', hasDestination: true,
  });
});
test('world links support all three public destinations', () => {
  for (const view of ['Moon', 'Mars', 'Deep Space']) {
    const launch = readLaunchLocation(`?view=${encodeURIComponent(view)}&lang=en`, records);
    assert.equal(launch.view, view);
    assert.equal(launch.hasDestination, true);
    assert.equal(launch.language, 'en');
  }
});
test('unknown IDs and languages never become application state', () => {
  assert.deepEqual(readLaunchLocation('?mission=not-a-mission&view=unknown&lang=xx', records), {
    missionId: null, view: 'Moon', language: null, hasDestination: false,
  });
});
test('ordinary visitors retain the intentional first-run opening', () => {
  assert.equal(readLaunchLocation('', records).hasDestination, false);
  assert.equal(readLaunchLocation('?perf=1', records).hasDestination, false);
});
test('blocked localStorage is nonfatal and does not attempt deletion', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
  assert.equal(readPreference('badges', 'saved-default'), 'saved-default');
  assert.equal(savePreference('badges', 'new-value'), false);
  if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
  else delete globalThis.localStorage;
});
test('normal preference storage preserves exact values', () => {
  const values = new Map([['old-progress', 'untouched']]);
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } });
  assert.equal(savePreference('language', 'ar'), true);
  assert.equal(readPreference('language'), 'ar');
  assert.equal(values.get('old-progress'), 'untouched');
  if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
  else delete globalThis.localStorage;
});
