import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Headphones, Mic2, Pause, Play, VolumeX, Waves,
} from 'lucide-react';
import { fetchRelics, LOCAL_RELICS } from './services/api.js';
import BadgeModal from './components/BadgeModal.jsx';
import TopNav from './components/TopNav.jsx';
import ScrollytellingExperience from './components/ScrollytellingExperience.jsx';
import SpaceLoader from './components/SpaceLoader.jsx';
import { setAmbientEnabled as updateAmbientPad, setTelemetryMuted, transmitText } from './utils/radio.js';

const Space3DCanvas = lazy(() => import('./components/Space3DCanvas.jsx'));
const CINEMA_WAVE_HEIGHTS = [6, 11, 15, 8, 19, 12, 22, 9, 17, 7, 14, 20, 10];

function readBadges() {
  try {
    const saved = JSON.parse(localStorage.getItem('lunar-relics-badges') || '[]');
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

function CinemaBar({ selectedRelic, activeMission, language, caption, isTransmitting, onPlay, onStop, voiceEnabled, onToggleVoice, ambientEnabled, onToggleAmbient }) {
  const isArabic = language === 'ar';
  const current = selectedRelic || activeMission;
  const title = current ? (current.nickname || current.name) : (isArabic ? 'اختر مهمة لبدء الإرسال' : 'Select a mission to begin transmission');
  return (
    <section className={`cinema-bar glass-panel ${isTransmitting ? 'is-speaking' : ''}`} aria-label={isArabic ? 'مشغل الإرسال الصوتي' : 'Mission transmission player'}>
      <button className="cinema-play" type="button" onClick={isTransmitting ? onStop : onPlay} disabled={!current} aria-label={isTransmitting ? (isArabic ? 'إيقاف الإرسال' : 'Stop transmission') : (isArabic ? 'تشغيل إرسال المهمة' : 'Play mission transmission')}>
        {isTransmitting ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      <div className="cinema-copy">
        <div className="cinema-meta"><span className="cinema-kicker"><Headphones size={12} />{isArabic ? 'إرسال المركبة' : 'SPACECRAFT TRANSMISSION'}</span><span className="cinema-title" dir="auto">{title}</span></div>
        <div className="cinema-subtitle" aria-live="polite" aria-atomic="true" dir="auto">{caption || (isTransmitting ? '' : (isArabic ? 'النص الحي سيظهر هنا أثناء الإرسال.' : 'Live captions appear here during the transmission.'))}{isTransmitting && <span className="subtitle-caret" aria-hidden="true" />}</div>
      </div>
      <div className={`cinema-waveform ${isTransmitting ? 'active' : ''}`} aria-hidden="true">{Array.from({ length: 13 }, (_, index) => <i key={index} style={{ '--bar': index, '--bar-height': `${CINEMA_WAVE_HEIGHTS[index % CINEMA_WAVE_HEIGHTS.length]}px` }} />)}</div>
      <div className="cinema-controls">
        <button className={`audio-toggle ${voiceEnabled ? 'active' : ''}`} type="button" onClick={onToggleVoice} aria-pressed={voiceEnabled} title={voiceEnabled ? (isArabic ? 'كتم الصوت' : 'Mute voice') : (isArabic ? 'تشغيل الصوت' : 'Enable voice')}>
          {voiceEnabled ? <Mic2 size={14} /> : <VolumeX size={14} />}<span>{voiceEnabled ? (isArabic ? 'الصوت' : 'Voice') : (isArabic ? 'مكتوم' : 'Muted')}</span>
        </button>
        <button className={`audio-toggle ambient-toggle ${ambientEnabled ? 'active' : ''}`} type="button" onClick={onToggleAmbient} disabled={!voiceEnabled} aria-pressed={ambientEnabled} title={isArabic ? 'خلفية فضائية هادئة' : 'Subtle ambient space pad'}>
          <Waves size={14} /><span>{isArabic ? 'الأجواء' : 'Ambient'}</span>
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const [relics, setRelics] = useState(LOCAL_RELICS);
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);
  const [activeMission, setActiveMission] = useState(null);
  const [language, setLanguage] = useState(() => localStorage.getItem('lunar-relics-language') || 'en');
  const [badges, setBadges] = useState(readBadges);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [hotspot, setHotspot] = useState(null);
  const [apiState, setApiState] = useState('local');
  const [isInitialLoading, setIsInitialLoading] = useState(() => Boolean(import.meta.env.VITE_API_URL?.trim()));
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [caption, setCaption] = useState('');
  const audioTokenRef = useRef(0);
  const stopAudioRef = useRef(null);
  const journeyRef = useRef({
    exploreProgress: 0,
    cameraItems: LOCAL_RELICS,
    activeMissionId: null,
    chapter: 0,
    hotspotIndex: -1,
    timelineIndex: 0,
    isScrolling: false,
  });

  useEffect(() => {
    let active = true;
    fetchRelics().then((records) => {
      if (!active) return;
      setRelics(records);
      setApiState(records === LOCAL_RELICS ? 'local' : 'online');
      journeyRef.current.cameraItems = records;
    }).finally(() => { if (active) setIsInitialLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('lunar-relics-language', language);
  }, [language]);

  useEffect(() => { localStorage.setItem('lunar-relics-badges', JSON.stringify([...badges])); }, [badges]);

  const stopTransmission = useCallback(() => {
    audioTokenRef.current += 1;
    const stop = stopAudioRef.current;
    stopAudioRef.current = null;
    stop?.();
    setIsTransmitting(false);
  }, []);

  const startTransmission = useCallback((text) => {
    const safeText = String(text || '').trim();
    if (!safeText) return;
    const token = audioTokenRef.current + 1;
    audioTokenRef.current = token;
    stopAudioRef.current?.();
    setCaption('');
    setIsTransmitting(true);
    stopAudioRef.current = transmitText(safeText, language, () => {
      if (audioTokenRef.current !== token) return;
      stopAudioRef.current = null;
      setIsTransmitting(false);
      setCaption(safeText);
    }, {
      voiceEnabled,
      onProgress: (index) => { if (audioTokenRef.current === token) setCaption(safeText.slice(0, index)); },
    });
  }, [language, voiceEnabled]);

  useEffect(() => () => {
    stopAudioRef.current?.();
    void updateAmbientPad(false);
  }, []);
  useEffect(() => {
    stopTransmission();
    setCaption('');
    setHotspot(null);
    journeyRef.current.chapter = 0;
    journeyRef.current.hotspotIndex = -1;
    journeyRef.current.timelineIndex = 0;
  }, [selectedId, language, stopTransmission]);

  const selectedRelic = useMemo(() => relics.find((item) => item.id === selectedId) || null, [relics, selectedId]);
  const visibleRelics = useMemo(() => {
    if (filter === 'All') return relics;
    if (filter === '3D Models') return relics.filter((item) => item.has3DModel);
    return relics.filter((item) => item.body === filter);
  }, [filter, relics]);
  const sceneFilter = filter === '3D Models' ? 'All' : filter;
  const isArabic = language === 'ar';
  const activeStory = selectedRelic?.story?.[language] || selectedRelic?.story?.en || activeMission?.story?.[language] || activeMission?.story?.en || '';

  const openRelic = useCallback((item) => {
    setBadgeModalOpen(false);
    setHotspot(null);
    setSelectedId(item.id);
    journeyRef.current.chapter = 0;
    journeyRef.current.hotspotIndex = -1;
    journeyRef.current.timelineIndex = 0;
    journeyRef.current.isScrolling = false;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);
  const backToMap = useCallback(() => {
    setHotspot(null);
    setSelectedId(null);
    journeyRef.current.chapter = 0;
    journeyRef.current.isScrolling = false;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);
  const unlockBadge = useCallback((relicId) => {
    setBadges((current) => {
      if (current.has(relicId)) return current;
      const next = new Set(current);
      next.add(relicId);
      return next;
    });
  }, []);
  const toggleVoice = useCallback(() => {
    const nextEnabled = !voiceEnabled;
    setTelemetryMuted(!nextEnabled);
    if (!nextEnabled) {
      if (isTransmitting) stopTransmission();
      if (ambientEnabled) {
        setAmbientEnabled(false);
        void updateAmbientPad(false);
      }
    }
    setVoiceEnabled((value) => !value);
  }, [ambientEnabled, isTransmitting, stopTransmission, voiceEnabled]);
  const toggleAmbient = async () => {
    if (!voiceEnabled) return;
    const next = !ambientEnabled;
    const available = await updateAmbientPad(next);
    if (next && !available) return;
    setAmbientEnabled(next);
  };
  const handleActiveMissionChange = useCallback((item) => setActiveMission(item), []);
  const handleSetHotspot = useCallback((nextSpot) => {
    setHotspot(nextSpot);
    const index = nextSpot ? (selectedRelic?.hotspots || []).findIndex((spot) => (spot.part && spot.part === nextSpot.part) || spot.title === nextSpot.title) : -1;
    journeyRef.current.hotspotIndex = index;
  }, [selectedRelic]);

  return (
    <div className={`app-shell cinematic-shell scrolly-app ${isArabic ? 'app-rtl' : ''}`} id="mission-control" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="scene-backdrop" aria-label={isArabic ? 'مشهد فضائي ثلاثي الأبعاد تفاعلي' : 'Interactive 3D space scene'}>
        <Suspense fallback={<div className="canvas-chunk-loader"><SpaceLoader language={language} kind="model" compact /></div>}>
          <Space3DCanvas relics={visibleRelics} filter={sceneFilter} selectedRelic={selectedRelic} onSelect={openRelic} language={language} hotspot={hotspot} setHotspot={handleSetHotspot} journeyRef={journeyRef} />
        </Suspense>
        <div className="scene-vignette" aria-hidden="true" />
        {hotspot && <div className="hotspot-readout" role="status"><button className="hotspot-close" type="button" onClick={() => handleSetHotspot(null)} aria-label={isArabic ? 'إغلاق' : 'Close'}>×</button><span className="hotspot-kicker">{isArabic ? 'نقطة فحص الجهاز' : 'HARDWARE HOTSPOT'}</span><strong dir="auto">{hotspot.title || hotspot.part}</strong><p dir="auto">{hotspot.description}</p></div>}
      </div>

      <div className="mission-hud">
        <TopNav filter={filter} language={language} setLanguage={setLanguage} relics={relics} badges={badges} onOpenBadges={() => setBadgeModalOpen(true)} badgesOpen={badgeModalOpen} voiceEnabled={voiceEnabled} onToggleVoice={toggleVoice} apiState={apiState} />
        <div className="scrolly-content">
          <ScrollytellingExperience
            relics={visibleRelics}
            selectedRelic={selectedRelic}
            language={language}
            filter={filter}
            setFilter={setFilter}
            onOpen={openRelic}
            onBack={backToMap}
            badges={badges}
            onUnlock={unlockBadge}
            hotspot={hotspot}
            setHotspot={handleSetHotspot}
            journeyRef={journeyRef}
            onActiveMissionChange={handleActiveMissionChange}
            isTransmitting={isTransmitting}
            onTransmit={startTransmission}
            onStopAudio={stopTransmission}
            voiceEnabled={voiceEnabled}
            caption={caption}
          />
        </div>
        {!selectedRelic && <footer className="app-footer"><span>SPACE APPS CAIRO 2026 <i /> LUNAR RELICS</span><span className={`api-indicator ${apiState === 'online' ? 'is-online' : ''}`}><span />{apiState === 'online' ? (isArabic ? 'مزامنة بيانات عن بُعد' : 'REMOTE DATA SYNCED') : (isArabic ? 'الأرشيف المحلي جاهز' : 'LOCAL ARCHIVE READY')}</span></footer>}
        <CinemaBar selectedRelic={selectedRelic} activeMission={activeMission} language={language} caption={caption} isTransmitting={isTransmitting} onPlay={() => startTransmission(activeStory)} onStop={stopTransmission} voiceEnabled={voiceEnabled} onToggleVoice={toggleVoice} ambientEnabled={ambientEnabled} onToggleAmbient={toggleAmbient} />
      </div>

      {badgeModalOpen && <BadgeModal relics={relics} badges={badges} language={language} onClose={() => setBadgeModalOpen(false)} onSelect={openRelic} />}
      {isInitialLoading && <SpaceLoader language={language} overlay />}
    </div>
  );
}
