import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

const DEFAULT_BUDGET = { current: { level: 2, paused: false, reducedMotion: false } };
export const RenderBudgetContext = createContext(DEFAULT_BUDGET);
export const useRenderBudget = () => useContext(RenderBudgetContext);

export function AdaptiveRenderBudget({ compact = false, children }) {
  const { gl, setDpr } = useThree();
  const [settings, setSettings] = useState(() => ({
    level: compact ? 1 : 2,
    paused: document.hidden,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }));
  const telemetry = useMemo(() => new URLSearchParams(window.location.search).get('perf') === '1', []);
  const telemetryRef = useRef(null);
  const sample = useRef({ warmupUntil: 0, start: 0, frames: 0, slow: 0, good: 0 });
  const context = useMemo(() => ({ current: settings }), [settings]);

  useEffect(() => {
    const onVisibility = () => setSettings((value) => ({ ...value, paused: document.hidden }));
    const onMotion = (event) => setSettings((value) => ({ ...value, reducedMotion: event.matches }));
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.addEventListener('visibilitychange', onVisibility);
    query.addEventListener('change', onMotion);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      query.removeEventListener('change', onMotion);
    };
  }, []);

  useEffect(() => {
    const deviceDpr = window.devicePixelRatio || 1;
    setDpr(settings.level === 0 ? 1 : Math.min(deviceDpr, settings.level === 1 ? 1.25 : 1.75));
    sample.current = { warmupUntil: performance.now() + 1800, start: 0, frames: 0, slow: 0, good: 0 };
  }, [settings.level, settings.paused, setDpr, compact]);

  useFrame(() => {
    if (settings.paused) return;
    const now = performance.now();
    const counter = sample.current;
    if (now < counter.warmupUntil) return;
    if (!counter.start) { counter.start = now; return; }
    counter.frames += 1;
    const elapsed = now - counter.start;
    if (elapsed < 3000) return;
    const fps = counter.frames * 1000 / elapsed;
    const frameMs = elapsed / counter.frames;
    // Hysteresis avoids quality flicker. The 60 FPS target is not a claimed result.
    counter.slow = fps < 44 ? counter.slow + 1 : 0;
    counter.good = fps > 57 ? counter.good + 1 : 0;
    let nextLevel = settings.level;
    if (counter.slow >= 2) nextLevel = Math.max(0, nextLevel - 1);
    if (counter.good >= 5) nextLevel = Math.min(compact ? 1 : 2, nextLevel + 1);
    if (telemetry && telemetryRef.current) {
      const info = gl.info.render;
      telemetryRef.current.textContent = `PERF · ${fps.toFixed(1)} FPS (3s) · ${frameMs.toFixed(1)} ms avg · ${info.calls} draw · ${info.triangles} tris · DPR ${gl.getPixelRatio().toFixed(2)} · Q${settings.level}`;
    }
    counter.start = now;
    counter.frames = 0;
    if (nextLevel !== settings.level) setSettings((value) => ({ ...value, level: nextLevel }));
  }, -100); // Read the previous main pass before shadow helpers reset gl.info.

  return (
    <RenderBudgetContext.Provider value={context}>
      {children}
      {telemetry && (
        <Html fullscreen zIndexRange={[40, 40]} style={{ pointerEvents: 'none' }}>
          <output ref={telemetryRef} style={{ position: 'absolute', right: 10, bottom: 10, width: 'max-content', maxWidth: 'calc(100vw - 20px)', padding: '7px 9px', border: '1px solid #45607d', borderRadius: 7, color: '#dbeafe', background: 'rgba(2,6,23,.9)', font: '10px/1.5 ui-monospace, monospace', direction: 'ltr', pointerEvents: 'none' }}>PERF · measuring after warm-up…</output>
        </Html>
      )}
    </RenderBudgetContext.Provider>
  );
}
