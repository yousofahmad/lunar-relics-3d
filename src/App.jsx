import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Crosshair, Info, RadioTower } from 'lucide-react';
import { fetchRelics, LOCAL_RELICS } from './services/api.js';
import BadgeModal from './components/BadgeModal.jsx';
import TopNav from './components/TopNav.jsx';
import StoryAndArchivePanel from './components/StoryAndArchivePanel.jsx';
import WhatsNewDialog from './components/WhatsNewDialog.jsx';
import SpaceLoader from './components/SpaceLoader.jsx';
import { initializeAudioEngine, playUiChirp, setAudioMuted, setSoundscape, subscribeAudioEngine } from './utils/audioEngine.js';
import { getModelHonestyLabel, getRelicModelInfo } from './utils/relicModelMap.js';

const Space3DCanvas = lazy(() => import('./components/Space3DCanvas.jsx'));

function readBadges() {
  try {
    const saved = JSON.parse(localStorage.getItem('lunar-relics-badges') || '[]');
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

const APOLLO_LM_ID = 'apollo-11-eagle-descent-stage';
const APOLLO_LM_PRESENTATION = {
  name: 'Apollo 11 Lunar Module (Eagle)',
  nickname: 'Apollo 11 Lunar Module',
  has3DModel: true,
  model3dFile: '/models/apollo_lunar_module.glb',
  status: 'Eagle landed in Mare Tranquillitatis on July 20, 1969. Its descent stage remained on the Moon after the ascent stage lifted off the next day. After docking with Columbia, the Lunar Module was jettisoned in lunar orbit; NASA reports that its later fate is unknown.',
  story: {
    en: 'I am Eagle, the Apollo 11 Lunar Module. Launched from Earth on July 16, 1969, I carried Neil Armstrong and Buzz Aldrin down to Mare Tranquillitatis on July 20. My descent stage set us down and stayed behind on the Moon. The ascent stage carried the astronauts back to lunar orbit the next day. After rejoining Columbia, I was jettisoned; NASA does not know what happened to me afterward.',
    ar: 'أنا Eagle، وحدة Apollo 11 القمرية. انطلقت من الأرض في 16 يوليو 1969 حاملةً نيل أرمسترونغ وباز ألدرن إلى Mare Tranquillitatis يوم 20 يوليو. أنزلتنا مرحلة الهبوط إلى السطح، ثم بقيت هناك. وفي اليوم التالي، حملت مرحلة الصعود الرائدين إلى المدار القمري. بعد الالتحام بمركبة Columbia، تخلّص الطاقم من الوحدة القمرية؛ ولا تعرف NASA ما حدث لها بعد ذلك.',
  },
  hotspots: [
    {
      part: 'Descent stage',
      title: 'Landing platform and descent propulsion',
      description: 'The lower stage carried Eagle’s descent propulsion system, propellant tanks, and surface equipment. It brought Armstrong and Aldrin to Mare Tranquillitatis and remained on the Moon.',
    },
    {
      part: 'Landing legs & footpads',
      title: 'Lunar touchdown supports',
      description: 'Four extendable legs and broad footpads supported the Lunar Module at touchdown and kept the crew cabin clear of the lunar surface.',
    },
    {
      part: 'Early Apollo Scientific Experiment Package (EASEP)',
      title: 'Experiments deployed beside Eagle',
      description: 'The Apollo 11 crew deployed EASEP beside the descent stage, including a passive seismometer and laser-ranging retroreflector. It sits next to the lander, not on its body.',
    },
  ],
};

const WHATS_NEW_VERSION = '2026-11-13-mobile-touch-audio-story';
const WHATS_NEW_STORAGE_KEY = 'lunar-relics-whats-new';

function presentRelic(item) {
  return item.id === APOLLO_LM_ID ? { ...item, ...APOLLO_LM_PRESENTATION } : item;
}

export default function App() {
  const [relics, setRelics] = useState(LOCAL_RELICS);
  const [celestialView, setCelestialView] = useState('Moon');
  const [archiveFilter, setArchiveFilter] = useState('All');
  const [archiveOpen, setArchiveOpen] = useState(() => typeof window === 'undefined' || !window.matchMedia('(max-width: 760px)').matches);
  const [selectedId, setSelectedId] = useState(null);
  const [language, setLanguage] = useState(() => localStorage.getItem('lunar-relics-language') || 'en');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);
  const [entryPortalOpen, setEntryPortalOpen] = useState(true);
  const [autoPilotOn, setAutoPilotOn] = useState(false);
  const [badges, setBadges] = useState(readBadges);
  const [storyProgress, setStoryProgress] = useState({ index: 0, total: 1 });
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
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
    if (localStorage.getItem(WHATS_NEW_STORAGE_KEY) !== WHATS_NEW_VERSION) setWhatsNewOpen(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('lunar-relics-language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('lunar-relics-badges', JSON.stringify([...badges]));
  }, [badges]);

  const displayRelics = useMemo(() => relics.map(presentRelic), [relics]);
  const selectedRelic = useMemo(() => displayRelics.find((item) => item.id === selectedId) || null, [displayRelics, selectedId]);
  const storyMode = Boolean(selectedRelic);
  const visibleRelics = useMemo(
    () => celestialView === 'Deep Space' ? displayRelics : displayRelics.filter((item) => item.body === celestialView),
    [celestialView, displayRelics],
  );
  const activeSoundscape = selectedRelic?.body || celestialView;

  useEffect(() => initializeAudioEngine(), []);

  useEffect(() => subscribeAudioEngine(({ started }) => setAudioStarted(started)), []);

  useEffect(() => setSoundscape(activeSoundscape), [activeSoundscape]);

  useEffect(() => setAudioMuted(!audioEnabled), [audioEnabled]);

  const unlockBadge = (relicId) => {
    setBadges((current) => {
      if (current.has(relicId)) return current;
      const next = new Set(current);
      next.add(relicId);
      return next;
    });
  };

  const closeBadgeModal = useCallback(() => setBadgeModalOpen(false), []);
  const closeWhatsNew = useCallback(() => {
    localStorage.setItem(WHATS_NEW_STORAGE_KEY, WHATS_NEW_VERSION);
    setWhatsNewOpen(false);
  }, []);

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
    setAutoPilotOn(true);
    setHotspot(null);
    setStoryProgress({ index: 0, total: 1 });
    setSelectedId(item.id);
  };

  const backToMap = () => {
    setAutoPilotOn(false);
    setHotspot(null);
    setStoryProgress({ index: 0, total: 1 });
    setSelectedId(null);
  };

  const changeCelestialView = (nextView) => {
    setAutoPilotOn(false);
    setCelestialView(nextView);
    setHotspot(null);
    setSelectedId(null);
  };

  const isArabic = language === 'ar';
  const hotspotTitle = hotspot
    ? isArabic ? hotspot.titleAr || hotspot.partAr || hotspot.title || hotspot.part : hotspot.title || hotspot.part
    : '';
  const hotspotDescription = hotspot
    ? isArabic ? hotspot.descriptionAr || hotspot.description : hotspot.description
    : '';
  const enterArchive = () => {
    setEntryPortalOpen(false);
    setAudioEnabled(true);
    setAudioMuted(false, { startIfUnmuting: true });
  };
  const emitUiCue = (event, hover = false) => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const control = target?.closest('button, a, [role="button"]');
    if (!control) return;
    if (hover && event.relatedTarget instanceof Node && control.contains(event.relatedTarget)) return;
    playUiChirp();
  };

  return (
    <div className={`app-shell ${storyMode ? 'story-mode' : ''} ${isArabic ? 'app-rtl' : ''}`} dir={isArabic ? 'rtl' : 'ltr'} onClickCapture={(event) => emitUiCue(event)} onPointerOverCapture={(event) => emitUiCue(event, true)}>
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-glow glow-one" aria-hidden="true" />
      <div className="ambient-glow glow-two" aria-hidden="true" />

      <TopNav
        celestialView={celestialView}
        setCelestialView={changeCelestialView}
        language={language}
        setLanguage={setLanguage}
        relics={displayRelics}
        badges={badges}
        onOpenBadges={() => setBadgeModalOpen(true)}
        badgesOpen={badgeModalOpen}
        onOpenWhatsNew={() => setWhatsNewOpen(true)}
        whatsNewOpen={whatsNewOpen}
        storyMode={storyMode}
        soundscape={activeSoundscape}
        audioStarted={audioStarted}
        archiveOpen={archiveOpen}
        onOpenMissions={() => {
          if (storyMode) {
            backToMap();
            setArchiveOpen(true);
          } else {
            setArchiveOpen((open) => !open);
          }
        }}
        audioEnabled={audioEnabled}
        autoPilotOn={autoPilotOn}
        onToggleAutoPilot={() => setAutoPilotOn((current) => !current)}
        onToggleAudio={() => {
          if (!audioStarted && audioEnabled) {
            setAudioMuted(false, { startIfUnmuting: true });
            return;
          }
          const nextEnabled = !audioEnabled;
          setAudioEnabled(nextEnabled);
          setAudioMuted(!nextEnabled, { startIfUnmuting: true });
        }}
      />
      {badgeModalOpen && (
        <BadgeModal relics={displayRelics} badges={badges} language={language} onClose={closeBadgeModal} onSelect={openRelic} />
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
                archiveOpen={archiveOpen}
              />
            </Suspense>
            {!selectedRelic && (
              <div className="map-instructions">
                <Crosshair size={14} />
                <span>{isArabic ? 'اضغط على نقطة مضيئة أو مهمة لتستكشفها' : 'Tap a glowing dot or mission to explore it'}</span>
              </div>
            )}
            <div className="canvas-meta">
              <span><RadioTower size={12} /> {isArabic ? 'عرض حي' : 'LIVE VIEW'}</span>
              <span>{celestialView === 'Deep Space' ? (isArabic ? 'الفضاء' : 'SPACE') : celestialView.toUpperCase()}</span>
            </div>
            {selectedRelic && (
              <div className={`model-honesty-badge ${getRelicModelInfo(selectedRelic).fidelity === 'authentic' ? 'is-authentic' : 'is-archetype'}`} role="status">
                <BadgeCheck size={15} aria-hidden="true" />
                <span>
                  <strong>{getModelHonestyLabel(selectedRelic)}</strong>
                  <small dir="auto">{isArabic ? (getRelicModelInfo(selectedRelic).fidelity === 'authentic' ? 'مجسم NASA للمهمة نفسها' : 'تمثيل هندسي شفاف للفئة') : getRelicModelInfo(selectedRelic).modelLabel}</small>
                </span>
              </div>
            )}
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
                <span className="hotspot-kicker">{isArabic ? 'نقطة فحص' : 'INSPECTION POINT'}</span>
                <strong dir="auto">{hotspotTitle}</strong>
                <p dir="auto">{hotspotDescription}</p>
              </div>
            )}
          </div>
          <div className="viewport-footer">
            <div className="control-hint"><span className="mouse-glyph">◎</span>{isArabic ? 'اسحب لتدوير المجسم' : 'DRAG TO TURN'} <i /> {isArabic ? 'مرّر للتقريب' : 'SCROLL TO GET CLOSER'}</div>
            <div className="data-source-tag"><Info size={12} /> {isArabic ? <>بيانات <bdi dir="ltr">NASA NSSDCA</bdi></> : <bdi dir="ltr">NASA NSSDCA DATA</bdi>}</div>
          </div>
        </section>

        <aside className={`archive-panel glass-panel ${storyMode ? 'story-experience-panel' : ''} ${!archiveOpen && !storyMode ? 'is-hidden' : ''}`}>
          <StoryAndArchivePanel
            relics={displayRelics}
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
            audioEnabled={audioEnabled}
            autoPilotOn={autoPilotOn}
            setAutoPilotOn={setAutoPilotOn}
          />
        </aside>
      </main>

      <footer className="app-footer">
        <span>SPACE APPS CAIRO 2026 <i /> LUNAR RELICS 3D</span>
        <span className={`api-indicator ${apiState === 'online' ? 'is-online' : ''}`}><span />{apiState === 'online' ? (isArabic ? 'بيانات متصلة' : 'REMOTE DATA SYNCED') : (isArabic ? 'أرشيف محلي' : 'LOCAL ARCHIVE READY')}</span>
      </footer>
      {whatsNewOpen && <WhatsNewDialog language={language} onClose={closeWhatsNew} />}
      {isInitialLoading && <SpaceLoader language={language} overlay />}
      {entryPortalOpen && (
        <div className="entry-portal" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="entry-portal-card">
            <span className="entry-portal-mark" aria-hidden="true">✦</span>
            <p className="entry-portal-eyebrow">{isArabic ? 'أرشيف المهمات · NASA' : 'MISSION ARCHIVE · NASA'}</p>
            <h1>{isArabic ? 'الأثر الباقي في الفضاء' : 'THE RELICS LEFT BEHIND'}</h1>
            <p>{isArabic ? 'ادخل إلى الرحلة ثلاثية الأبعاد مع الأجواء الصوتية الفضائية.' : 'Enter the 3D mission archive with its continuous cosmic soundscape.'}</p>
            <button type="button" className="entry-portal-button" onClick={enterArchive}>
              <span aria-hidden="true">🚀</span>
              {isArabic ? 'المس للدخول إلى الأرشيف' : 'TAP TO ENTER ARCHIVE'}
              <small>{isArabic ? 'مشهد ثلاثي الأبعاد + صوت مكاني' : '3D · SPATIAL AUDIO'}</small>
            </button>
            <span className="entry-portal-note">{isArabic ? 'يمكنك كتم الصوت في أي وقت من الشريط العلوي.' : 'Mute any time from the top bar.'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
