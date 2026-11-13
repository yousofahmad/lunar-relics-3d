import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Crosshair, Info, RadioTower } from 'lucide-react';
import { fetchRelics, LOCAL_RELICS } from './services/api.js';
import BadgeModal from './components/BadgeModal.jsx';
import TopNav from './components/TopNav.jsx';
import StoryAndArchivePanel from './components/StoryAndArchivePanel.jsx';
import SpaceLoader from './components/SpaceLoader.jsx';

const Space3DCanvas = lazy(() => import('./components/Space3DCanvas.jsx'));

function readBadges() {
  try {
    const saved = JSON.parse(localStorage.getItem('lunar-relics-badges') || '[]');
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
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

  useEffect(() => {
    let active = true;
    fetchRelics().then((records) => {
      if (!active) return;
      setRelics(records);
      setApiState(records === LOCAL_RELICS ? 'local' : 'online');
    }).finally(() => {
      if (active) setIsInitialLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('lunar-relics-language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('lunar-relics-badges', JSON.stringify([...badges]));
  }, [badges]);

  const selectedRelic = useMemo(() => relics.find((item) => item.id === selectedId) || null, [relics, selectedId]);
  const visibleRelics = useMemo(
    () => filter === 'All' ? relics : relics.filter((item) => item.body === filter),
    [filter, relics],
  );

  const unlockBadge = (relicId) => {
    setBadges((current) => {
      if (current.has(relicId)) return current;
      const next = new Set(current);
      next.add(relicId);
      return next;
    });
  };

  const closeBadgeModal = useCallback(() => setBadgeModalOpen(false), []);

  const openRelic = (item) => {
    setBadgeModalOpen(false);
    setHotspot(null);
    setSelectedId(item.id);
  };

  const backToMap = () => {
    setHotspot(null);
    setSelectedId(null);
  };

  const isArabic = language === 'ar';
  const isProceduralHologram = Boolean(selectedRelic && !selectedRelic.has3DModel);

  return (
    <div className={`app-shell ${isArabic ? 'app-rtl' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-glow glow-one" aria-hidden="true" />
      <div className="ambient-glow glow-two" aria-hidden="true" />

      <TopNav
        filter={filter}
        setFilter={(next) => { setFilter(next); setHotspot(null); }}
        language={language}
        setLanguage={setLanguage}
        relics={relics}
        badges={badges}
        onOpenBadges={() => setBadgeModalOpen(true)}
        badgesOpen={badgeModalOpen}
      />
      {badgeModalOpen && (
        <BadgeModal relics={relics} badges={badges} language={language} onClose={closeBadgeModal} onSelect={openRelic} />
      )}

      <main className="workspace-grid">
        <section className={`viewport-panel glass-panel ${selectedRelic ? 'inspection-mode' : ''}`}>
          <div className="viewport-header">
            <div className="viewport-heading">
              <span className="eyebrow"><span className="live-dot" />{isArabic ? 'استكشاف ثلاثي الأبعاد' : 'LIVE 3D EXPLORATION'}</span>
              <h1>{selectedRelic ? (isArabic ? 'غرفة الذاكرة' : 'MEMORY ROOM') : (isArabic ? 'شبكة الآثار' : 'RELIC NETWORK')}</h1>
            </div>
            <div className="viewport-status">
              <span className="status-pill"><Activity size={13} /> {isArabic ? 'عرض تفاعلي' : 'INTERACTIVE VIEW'}</span>
              <span className="status-dot" />
            </div>
          </div>

          <div className={`canvas-stage ${isProceduralHologram ? 'hologram-active' : ''}`}>
            <Suspense fallback={<div className="canvas-chunk-loader"><SpaceLoader language={language} kind="model" compact /></div>}>
              <Space3DCanvas
                relics={visibleRelics}
                filter={filter}
                selectedRelic={selectedRelic}
                onSelect={openRelic}
                language={language}
                hotspot={hotspot}
                setHotspot={setHotspot}
              />
            </Suspense>
            {isProceduralHologram && (
              <div className="hologram-overlay" aria-hidden="true">
                <span className="hologram-corner corner-nw" />
                <span className="hologram-corner corner-ne" />
                <span className="hologram-corner corner-sw" />
                <span className="hologram-corner corner-se" />
                <span className="hologram-radar-ring ring-outer" />
                <span className="hologram-radar-ring ring-inner" />
                <span className="hologram-scanlines" />
                <span className="hologram-frame-label">{isArabic ? 'مخطط هولوغرافي' : 'HOLOGRAPHIC BLUEPRINT'}</span>
              </div>
            )}
            {!selectedRelic && (
              <div className="map-instructions">
                <Crosshair size={14} />
                <span>{isArabic ? 'اختر نقطة مضيئة أو أثرًا من القائمة' : 'SELECT A GLOWING SITE OR A RELIC FROM THE ARCHIVE'}</span>
              </div>
            )}
            <div className="canvas-meta">
              <span><RadioTower size={12} /> {isArabic ? 'اتصال حي' : 'SIGNAL LINK'}</span>
              <span>{filter === 'All' ? 'SOL / SYSTEM' : filter.toUpperCase()}</span>
            </div>
            {hotspot && (
              <div className="hotspot-readout" role="status">
                <button className="hotspot-close" type="button" onClick={() => setHotspot(null)} aria-label="Close hotspot">×</button>
                <span className="hotspot-kicker">{isArabic ? 'نقطة فحص الجهاز' : 'HARDWARE HOTSPOT'}</span>
                <strong dir="auto">{hotspot.title || hotspot.part}</strong>
                <p dir="auto">{hotspot.description}</p>
              </div>
            )}
          </div>
          <div className="viewport-footer">
            <div className="control-hint"><span className="mouse-glyph">◎</span>{isArabic ? 'اسحب للتدوير' : 'DRAG TO ORBIT'} <i /> {isArabic ? 'مرّر للتقريب' : 'SCROLL TO ZOOM'}</div>
            <div className="data-source-tag"><Info size={12} /> {isArabic ? <>بيانات <bdi dir="ltr">NASA NSSDCA</bdi></> : <bdi dir="ltr">NASA NSSDCA DATA</bdi>}</div>
          </div>
        </section>

        <aside className="archive-panel glass-panel">
          <StoryAndArchivePanel
            relics={visibleRelics}
            selectedRelic={selectedRelic}
            language={language}
            badges={badges}
            onSelect={openRelic}
            onBack={backToMap}
            onUnlock={unlockBadge}
            hotspot={hotspot}
            setHotspot={setHotspot}
          />
        </aside>
      </main>

      <footer className="app-footer">
        <span>SPACE APPS CAIRO 2026 <i /> LUNAR RELICS 3D</span>
        <span className={`api-indicator ${apiState === 'online' ? 'is-online' : ''}`}><span />{apiState === 'online' ? (isArabic ? 'بيانات متصلة' : 'REMOTE DATA SYNCED') : (isArabic ? 'أرشيف محلي' : 'LOCAL ARCHIVE READY')}</span>
      </footer>
      {isInitialLoading && <SpaceLoader language={language} overlay />}
    </div>
  );
}
