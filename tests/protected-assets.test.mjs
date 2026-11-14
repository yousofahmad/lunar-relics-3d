import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('./fixtures/protected-assets.json', import.meta.url), 'utf8'));
for (const [path, expected] of Object.entries(manifest)) {
  test(`protected file unchanged: ${path}`, () => {
    const bytes = readFileSync(new URL(path, root));
    assert.equal(bytes.byteLength, expected.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.sha256);
  });
}
test('InSight points to the optimized deployed model', () => {
  const map = readFileSync(new URL('src/utils/relicModelMap.js', root), 'utf8');
  assert.match(map, /'insight-lander':\s*\{\s*modelPath:\s*'\/models\/insight_lander_deployed_optimized\.glb'/);
});
test('large source is omitted; old and optimized InSight models remain', () => {
  assert.equal(existsSync(new URL('public/models/insight_lander_deployed.glb', root)), false);
  assert.equal(existsSync(new URL('public/models/insight_lander.glb', root)), true);
  assert.ok(readFileSync(new URL('public/models/insight_lander_deployed_optimized.glb', root)).byteLength < 3_000_000);
});
test('NASA source and credit remain documented', () => {
  const sources = readFileSync(new URL('public/models/ASSET_SOURCES.md', root), 'utf8');
  assert.ok(sources.includes('https://science.nasa.gov/resource/insight-lander-3d-model/'));
  assert.ok(sources.includes('24880_InSight_deployed.glb'));
  assert.ok(sources.includes('NASA/JPL-Caltech'));
});
