import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Crosshair, Info, RadioTower } from 'lucide-react';
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
  const [celestialView, setCelestialView] = useState('Moon');
  const [archiveFilter, setArchiveFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);
  const [language, setLanguage] = useState(() => localStorage.getItem('lunar-relics-language') || 'en');
  const [badges, setBadges] = useState(readBadges);
  const [storyProgress, setStoryProgress] = useState({ index: 0, total: 1 });
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
  const storyMode = Boolean(selectedRelic);
  const visibleRelics = useMemo(
    () => relics.filter((item) => item.body === celestialView),
    [celestialView, relics],
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

  useEffect(() => {
    document.documentElement.classList.toggle('story-scroll-page', storyMode);
    document.body.classList.toggle('story-scroll-page', storyMode);
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.classList.remove('story-scroll-page');
      document.body.classList.remove('story-scroll-page');
    };
  }, [storyMode]);

  const openRelic = (item) => {
    setBadgeModalOpen(false);
    setCelestialView(item.body || 'Moon');
    setHotspot(null);
    setStoryProgress({ index: 0, total: 1 });
    setSelectedId(item.id);
  };

  const backToMap = () => {
    setHotspot(null);
    setStoryProgress({ index: 0, total: 1 });
    setSelectedId(null);
  };

  const changeCelestialView = (nextView) => {
    setCelestialView(nextView);
    setHotspot(null);
    setSelectedId(null);
  };

  const isArabic = language === 'ar';

  return (
    <div className={`app-shell ${storyMode ? 'story-mode' : ''} ${isArabic ? 'app-rtl' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-glow glow-one" aria-hidden="true" />
      <div className="ambient-glow glow-two" aria-hidden="true" />

      <TopNav
        celestialView={celestialView}
        setCelestialView={changeCelestialView}
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

      <main className={`workspace-grid ${storyMode ? 'story-mode' : ''}`}>
        <section className={`viewport-panel glass-panel ${selectedRelic ? 'inspection-mode' : ''}`} aria-label={isArabic ? 'المشهد ثلاثي الأبعاد' : '3D scene'}>
          <div className="canvas-stage">
            <Suspense fallback={<div className="canvas-chunk-loader"><SpaceLoader language={language} kind="model" compact /></div>}>
              <Space3DCanvas
                relics={visibleRelics}
                filter={celestialView}
                selectedRelic={selectedRelic}
                onSelect={openRelic}
                language={language}
                hotspot={hotspot}
                setHotspot={setHotspot}
                storyProgress={storyProgress}
              />
            </Suspense>
            {!selectedRelic && (
              <div className="map-instructions">
                <Crosshair size={14} />
                <span>{isArabic ? 'اختر نقطة مضيئة أو أثرًا من الأرشيف' : 'SELECT A LIT SURFACE BEACON OR A RELIC FROM THE ARCHIVE'}</span>
              </div>
            )}
            <div className="canvas-meta">
              <span><RadioTower size={12} /> {isArabic ? 'اتصال حي' : 'SIGNAL LINK'}</span>
              <span>{celestialView === 'Deep Space' ? 'DEEP SPACE' : celestialView.toUpperCase()}</span>
            </div>
            {selectedRelic && (
              <div className="story-scene-hud" aria-live="polite">
                <span>{isArabic ? 'حكاية المهمة · مرّر للمتابعة' : 'MISSION STORY · SCROLL TO CONTINUE'}</span>
                <strong dir="auto">{selectedRelic.nickname || selectedRelic.name}</strong>
                <div className="story-scene-progress" aria-hidden="true"><i style={{ width: `${storyProgress.total > 1 ? (storyProgress.index / (storyProgress.total - 1)) * 100 : 0}%` }} /></div>
                <small dir="ltr">{String(storyProgress.index + 1).padStart(2, '0')} / {String(storyProgress.total).padStart(2, '0')}</small>
              </div>
            )}
            {hotspot && (
              <div className="hotspot-readout" role="status">
                <button className="hotspot-close" type="button" onClick={() => setHotspot(null)} aria-label={isArabic ? 'إغلاق نقطة الفحص' : 'Close hotspot'}>×</button>
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
            relics={relics}
            archiveFilter={archiveFilter}
            setArchiveFilter={setArchiveFilter}
            selectedRelic={selectedRelic}
            language={language}
            badges={badges}
            onSelect={openRelic}
            onBack={backToMap}
            onUnlock={unlockBadge}
            hotspot={hotspot}
            setHotspot={setHotspot}
            onStoryProgress={setStoryProgress}
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
