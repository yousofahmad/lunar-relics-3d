import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, Box, ChevronDown, CircleDot, Globe2, Headphones, MapPin, Mic2, Moon, Orbit,
  Pause, Play, Search, Sparkles, VolumeX, Waves, X,
} from 'lucide-react';
import { fetchRelics, LOCAL_RELICS } from './services/api.js';
import BadgeModal from './components/BadgeModal.jsx';
import TopNav from './components/TopNav.jsx';
import StoryAndArchivePanel from './components/StoryAndArchivePanel.jsx';
import SpaceLoader from './components/SpaceLoader.jsx';
import { setAmbientEnabled as updateAmbientPad, transmitText } from './utils/radio.js';

const Space3DCanvas = lazy(() => import('./components/Space3DCanvas.jsx'));

const FILTERS = [
  { id: 'All', en: 'All', ar: 'الكل', icon: Orbit },
  { id: 'Moon', en: 'Moon', ar: 'القمر', icon: Moon },
  { id: 'Mars', en: 'Mars', ar: 'المريخ', icon: Globe2 },
  { id: 'Deep Space', en: 'Deep Space', ar: 'الفضاء العميق', icon: CircleDot },
  { id: '3D Models', en: '3D Models', ar: 'نماذج 3D', icon: Box },
];

function readBadges() {
  try {
    const saved = JSON.parse(localStorage.getItem('lunar-relics-badges') || '[]');
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

function MissionDock({ relics, filter, setFilter, selectedRelic, language, onSelect, onCloseSelected }) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const isArabic = language === 'ar';
  const filteredRelics = useMemo(() => {
    const matchesFilter = (item) => {
      if (filter === '3D Models') return Boolean(item.has3DModel);
      if (filter === 'All') return true;
      return item.body === filter;
    };
    const needle = query.trim().toLocaleLowerCase(isArabic ? 'ar' : 'en');
    return relics.filter((item) => {
      if (!matchesFilter(item)) return false;
      if (!needle) return true;
      return [item.id, item.name, item.nickname, item.type, item.body, item.launchYear, item.location?.siteName]
        .filter(Boolean).join(' ').toLocaleLowerCase(isArabic ? 'ar' : 'en').includes(needle);
    });
  }, [filter, isArabic, query, relics]);

  return (
    <aside className={`mission-dock glass-panel ${collapsed ? 'is-collapsed' : ''}`} aria-label={isArabic ? 'قائمة المهمات' : 'Mission selector'}>
      <div className="dock-heading">
        <div><span className="dock-kicker"><i />{isArabic ? 'مركز المهمة' : 'MISSION CONTROL'}</span><h2>{isArabic ? 'سجلّ الاستكشاف' : 'Mission log'}</h2></div>
        <span className="dock-count" dir="ltr">{String(filteredRelics.length).padStart(2, '0')}<small> / {relics.length}</small></span>
        <button className="dock-collapse" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? (isArabic ? 'توسيع قائمة المهمات' : 'Expand mission dock') : (isArabic ? 'طي قائمة المهمات' : 'Collapse mission dock')} aria-expanded={!collapsed}><ChevronDown size={14} /></button>
      </div>

      <div className="dock-filter-row" role="group" aria-label={isArabic ? 'تصفية المهمات' : 'Mission filters'}>
        {FILTERS.map(({ id, en, ar, icon: Icon }) => (
          <button key={id} type="button" className={`dock-filter ${filter === id ? 'active' : ''}`} onClick={() => { setFilter(id); setQuery(''); }} aria-pressed={filter === id}>
            <Icon size={13} /><span>{isArabic ? ar : en}</span>
          </button>
        ))}
      </div>

      <label className="mission-search">
        <Search size={14} aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isArabic ? 'ابحث في المهمات' : 'Search missions'} aria-label={isArabic ? 'ابحث في المهمات' : 'Search missions'} />
        {query && <button type="button" onClick={() => setQuery('')} aria-label={isArabic ? 'مسح البحث' : 'Clear search'}><X size={13} /></button>}
      </label>

      <div className="mission-list">
        {filteredRelics.map((item, index) => (
          <button className={`mission-item ${selectedRelic?.id === item.id ? 'selected' : ''}`} key={item.id} type="button" onClick={() => onSelect(item)} aria-current={selectedRelic?.id === item.id ? 'true' : undefined}>
            <span className={`mission-item-icon ${item.has3DModel ? '' : 'is-hologram'}`} aria-hidden="true">{item.has3DModel ? <Box size={16} /> : <Sparkles size={16} />}</span>
            <span className="mission-item-copy"><span className="mission-item-name" dir="auto">{item.nickname || item.name}</span><span className="mission-item-meta"><span>{item.body === 'Moon' ? (isArabic ? 'القمر' : 'MOON') : item.body === 'Mars' ? (isArabic ? 'المريخ' : 'MARS') : (isArabic ? 'الفضاء العميق' : 'DEEP SPACE')}</span><i />{item.launchYear}</span></span>
            <span className="mission-item-index" dir="ltr">{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
        {!filteredRelics.length && <p className="mission-empty">{isArabic ? 'لا توجد نتائج.' : 'No missions found.'}</p>}
      </div>

      {selectedRelic && <button className="dock-back-button" type="button" onClick={onCloseSelected}>{isArabic ? 'العودة إلى الشبكة' : 'Return to network'}<span aria-hidden="true">↗</span></button>}
      <div className="dock-foot"><span><Activity size={12} />{isArabic ? 'قاعدة بيانات ناسا' : 'NASA MISSION DATA'}</span><span className="dock-live"><i /> LIVE</span></div>
    </aside>
  );
}

function CinemaBar({ selectedRelic, language, caption, isTransmitting, onPlay, onStop, voiceEnabled, onToggleVoice, ambientEnabled, onToggleAmbient }) {
  const isArabic = language === 'ar';
  const title = selectedRelic ? (selectedRelic.nickname || selectedRelic.name) : (isArabic ? 'اختر مهمة لبدء الإرسال' : 'Select a mission to begin transmission');
  return (
    <section className={`cinema-bar glass-panel ${isTransmitting ? 'is-speaking' : ''}`} aria-label={isArabic ? 'مشغل الإرسال الصوتي' : 'Mission transmission player'}>
      <button className="cinema-play" type="button" onClick={isTransmitting ? onStop : onPlay} disabled={!selectedRelic} aria-label={isTransmitting ? (isArabic ? 'إيقاف الإرسال' : 'Stop transmission') : (isArabic ? 'تشغيل إرسال المهمة' : 'Play mission transmission')}>
        {isTransmitting ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
      </button>
      <div className="cinema-copy">
        <div className="cinema-meta"><span className="cinema-kicker"><Headphones size={12} />{isArabic ? 'إرسال المركبة' : 'SPACECRAFT TRANSMISSION'}</span><span className="cinema-title" dir="auto">{title}</span></div>
        <div className="cinema-subtitle" aria-live="polite" aria-atomic="true" dir="auto">
          {caption || (isTransmitting ? '' : (isArabic ? 'النص الحي سيظهر هنا أثناء الإرسال.' : 'Live captions appear here during the transmission.'))}
          {isTransmitting && <span className="subtitle-caret" aria-hidden="true" />}
        </div>
      </div>
      <div className={`cinema-waveform ${isTransmitting ? 'active' : ''}`} aria-hidden="true">{Array.from({ length: 13 }, (_, index) => <i key={index} style={{ '--bar': index }} />)}</div>
      <div className="cinema-controls">
        <button className={`audio-toggle ${voiceEnabled ? 'active' : ''}`} type="button" onClick={onToggleVoice} aria-pressed={voiceEnabled} title={voiceEnabled ? (isArabic ? 'كتم الصوت' : 'Mute voice') : (isArabic ? 'تشغيل الصوت' : 'Enable voice')}>
          {voiceEnabled ? <Mic2 size={15} /> : <VolumeX size={15} />}<span>{voiceEnabled ? (isArabic ? 'الصوت' : 'Voice') : (isArabic ? 'مكتوم' : 'Muted')}</span>
        </button>
        <button className={`audio-toggle ambient-toggle ${ambientEnabled ? 'active' : ''}`} type="button" onClick={onToggleAmbient} aria-pressed={ambientEnabled} title={isArabic ? 'خلفية فضائية هادئة' : 'Subtle ambient space pad'}>
          <Waves size={15} /><span>{isArabic ? 'الأجواء' : 'Ambient'}</span>
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const [relics, setRelics] = useState(LOCAL_RELICS);
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);
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

  useEffect(() => {
    let active = true;
    fetchRelics().then((records) => {
      if (!active) return;
      setRelics(records);
      setApiState(records === LOCAL_RELICS ? 'local' : 'online');
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
      onProgress: (index) => {
        if (audioTokenRef.current === token) setCaption(safeText.slice(0, index));
      },
    });
  }, [language, voiceEnabled]);

  useEffect(() => {
    void updateAmbientPad(ambientEnabled);
  }, [ambientEnabled]);

  useEffect(() => () => {
    stopAudioRef.current?.();
    void updateAmbientPad(false);
  }, []);

  useEffect(() => {
    stopTransmission();
    setCaption('');
  }, [selectedId, language, stopTransmission]);

  const selectedRelic = useMemo(() => relics.find((item) => item.id === selectedId) || null, [relics, selectedId]);
  const visibleRelics = useMemo(() => {
    if (filter === 'All') return relics;
    if (filter === '3D Models') return relics.filter((item) => item.has3DModel);
    return relics.filter((item) => item.body === filter);
  }, [filter, relics]);
  const sceneFilter = filter === '3D Models' ? 'All' : filter;
  const isArabic = language === 'ar';
  const isProceduralHologram = Boolean(selectedRelic && !selectedRelic.has3DModel);
  const activeStory = selectedRelic?.story?.[language] || selectedRelic?.story?.en || '';

  const openRelic = useCallback((item) => {
    setBadgeModalOpen(false);
    setHotspot(null);
    setSelectedId(item.id);
  }, []);
  const backToMap = useCallback(() => { setHotspot(null); setSelectedId(null); }, []);
  const unlockBadge = useCallback((relicId) => {
    setBadges((current) => {
      if (current.has(relicId)) return current;
      const next = new Set(current);
      next.add(relicId);
      return next;
    });
  }, []);
  const toggleVoice = () => {
    if (voiceEnabled && isTransmitting) stopTransmission();
    setVoiceEnabled((value) => !value);
  };
  const toggleAmbient = async () => {
    const next = !ambientEnabled;
    setAmbientEnabled(next);
    if (next) {
      const available = await updateAmbientPad(true);
      if (!available) setAmbientEnabled(false);
    }
  };

  return (
    <div className={`app-shell cinematic-shell ${isArabic ? 'app-rtl' : ''}`} id="mission-control" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="scene-backdrop" aria-label={isArabic ? 'مشهد فضائي ثلاثي الأبعاد تفاعلي' : 'Interactive 3D space scene'}>
        <Suspense fallback={<div className="canvas-chunk-loader"><SpaceLoader language={language} kind="model" compact /></div>}>
          <Space3DCanvas relics={visibleRelics} filter={sceneFilter} selectedRelic={selectedRelic} onSelect={openRelic} language={language} hotspot={hotspot} setHotspot={setHotspot} />
        </Suspense>
        <div className="scene-vignette" aria-hidden="true" />
        {isProceduralHologram && <div className="hologram-overlay" aria-hidden="true"><span className="hologram-corner corner-nw" /><span className="hologram-corner corner-ne" /><span className="hologram-corner corner-sw" /><span className="hologram-corner corner-se" /><span className="hologram-radar-ring ring-outer" /><span className="hologram-radar-ring ring-inner" /><span className="hologram-scanlines" /><span className="hologram-frame-label">{isArabic ? 'مخطط هولوغرافي' : 'HOLOGRAPHIC BLUEPRINT'}</span></div>}
        {hotspot && <div className="hotspot-readout" role="status"><button className="hotspot-close" type="button" onClick={() => setHotspot(null)} aria-label={isArabic ? 'إغلاق' : 'Close'}>×</button><span className="hotspot-kicker">{isArabic ? 'نقطة فحص الجهاز' : 'HARDWARE HOTSPOT'}</span><strong dir="auto">{hotspot.title || hotspot.part}</strong><p dir="auto">{hotspot.description}</p></div>}
      </div>

      <div className="mission-hud">
        <TopNav filter={filter} language={language} setLanguage={setLanguage} relics={relics} badges={badges} onOpenBadges={() => setBadgeModalOpen(true)} badgesOpen={badgeModalOpen} />
        <main className="hud-layout">
          <MissionDock relics={relics} filter={filter} setFilter={(next) => { setFilter(next); setHotspot(null); }} selectedRelic={selectedRelic} language={language} onSelect={openRelic} onCloseSelected={backToMap} />
          {selectedRelic && <aside className="archive-panel glass-panel" aria-label={isArabic ? 'تفاصيل المهمة' : 'Mission details'}><StoryAndArchivePanel relics={visibleRelics} selectedRelic={selectedRelic} language={language} badges={badges} onSelect={openRelic} onBack={backToMap} onUnlock={unlockBadge} hotspot={hotspot} setHotspot={setHotspot} isTransmitting={isTransmitting} onTransmit={startTransmission} onStopAudio={stopTransmission} /></aside>}
        </main>

        <div className="scene-instrument scene-instrument-left"><span className="instrument-crosshair">+</span><span>{isArabic ? 'استكشاف فوري' : 'LIVE EXPLORATION'}</span><i /></div>
        <div className="scene-instrument scene-instrument-right"><span>{filter === 'All' ? (isArabic ? 'النظام الشمسي' : 'SOL / SYSTEM') : filter.toUpperCase()}</span><span className="instrument-divider" /><MapPin size={12} /><span>{isArabic ? 'المشهد التفاعلي' : 'INTERACTIVE SCENE'}</span></div>

        <CinemaBar selectedRelic={selectedRelic} language={language} caption={caption} isTransmitting={isTransmitting} onPlay={() => startTransmission(activeStory)} onStop={stopTransmission} voiceEnabled={voiceEnabled} onToggleVoice={toggleVoice} ambientEnabled={ambientEnabled} onToggleAmbient={toggleAmbient} />
        <footer className="app-footer"><span>SPACE APPS CAIRO 2026 <i /> LUNAR RELICS</span><span className={`api-indicator ${apiState === 'online' ? 'is-online' : ''}`}><span />{apiState === 'online' ? (isArabic ? 'مزامنة بيانات عن بُعد' : 'REMOTE DATA SYNCED') : (isArabic ? 'الأرشيف المحلي جاهز' : 'LOCAL ARCHIVE READY')}</span></footer>
      </div>

      {badgeModalOpen && <BadgeModal relics={relics} badges={badges} language={language} onClose={() => setBadgeModalOpen(false)} onSelect={openRelic} />}
      {isInitialLoading && <SpaceLoader language={language} overlay />}
    </div>
  );
}
