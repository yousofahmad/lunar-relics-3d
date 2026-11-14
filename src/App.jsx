import { lazy, Suspense, useCallback, useEffect, useMemo, useState , useRef } from 'react';
import { ArrowUpRight, BadgeCheck, Crosshair, Database, Globe2, Info, Moon, Orbit, Play, RadioTower, Volume2, VolumeX } from 'lucide-react';
import { fetchRelics, LOCAL_RELICS } from './services/api.js';
import TopNav from './components/TopNav.jsx';
import SpaceLoader from './components/SpaceLoader.jsx';
import { initializeAudioEngine, playHoverTick, playSelectSweep, setAudioMuted, setSoundscape, subscribeAudioEngine } from './utils/audioEngine.js';
import { getModelHonestyLabel, getRelicModelInfo } from './utils/relicModelMap.js';
import { readLaunchLocation, readPreference, savePreference } from './utils/experience.js';

const Space3DCanvas = lazy(() => import('./components/Space3DCanvas.jsx'));
const StoryAndArchivePanel = lazy(() => import('./components/StoryAndArchivePanel.jsx'));
const BadgeModal = lazy(() => import('./components/BadgeModal.jsx'));
const ExplorerChallenge = lazy(() => import('./components/ExplorerChallenge.jsx'));
const WhatsNewDialog = lazy(() => import('./components/WhatsNewDialog.jsx'));

function readBadges() {
  try {
    const saved = JSON.parse(readPreference('lunar-relics-badges', '[]'));
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
  // The story lives in src/data/relicsData.json so both languages stay in sync
  // with the narration audio. Do not re-add a hardcoded copy here.
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
  const launch = useMemo(() => readLaunchLocation(window.location.search, LOCAL_RELICS), []);
  const [relics, setRelics] = useState(LOCAL_RELICS);
  const [celestialView, setCelestialView] = useState(launch.view);
  const [archiveFilter, setArchiveFilter] = useState('All');
  const [archiveOpen, setArchiveOpen] = useState(() => !launch.hasDestination && !window.matchMedia('(max-width: 760px)').matches);
  const [selectedId, setSelectedId] = useState(launch.missionId);
  const [language, setLanguage] = useState(() => {
    const savedLanguage = readPreference('lunar-relics-language');
    return launch.language || (savedLanguage === 'en' || savedLanguage === 'ar' ? savedLanguage : 'ar');
  });
  const [audioEnabled, setAudioEnabled] = useState(() => readPreference('lunar-relics-audio-enabled', 'off') === 'on');
  const [audioStarted, setAudioStarted] = useState(false);
  const [entryPortalOpen, setEntryPortalOpen] = useState(!launch.hasDestination);
  const [autoPilotOn, setAutoPilotOn] = useState(false);
  const urlRelicRef = useRef(null);

  // Keep the address bar honest: a relic you opened is a place you can refresh,
  // bookmark, and walk back to with the browser's back button.
  useEffect(() => {
    if (entryPortalOpen) return;
    const params = new URLSearchParams();
    if (selectedId) params.set('mission', selectedId);
    params.set('view', celestialView || 'Moon');
    params.set('lang', language);
    const next = `${window.location.pathname}?${params.toString()}`;
    if (next === `${window.location.pathname}${window.location.search}`) return;
    const relicChanged = urlRelicRef.current !== selectedId;
    urlRelicRef.current = selectedId;
    window.history[relicChanged ? 'pushState' : 'replaceState']({ mission: selectedId, view: celestialView, language }, '', next);
  }, [selectedId, celestialView, language, entryPortalOpen]);

  useEffect(() => {
    const onPopState = () => {
      const restored = readLaunchLocation(window.location.search, LOCAL_RELICS);
      setSelectedId(restored.missionId);
      setCelestialView(restored.view);
      if (restored.language) setLanguage(restored.language);
      setEntryPortalOpen(!restored.hasDestination);
      setAutoPilotOn(false);
      setHotspot(null);
      setBadgeModalOpen(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const [badges, setBadges] = useState(readBadges);
  const [storyProgress, setStoryProgress] = useState({ index: 0, total: 1 });
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [hotspot, setHotspot] = useState(null);
  const [apiState, setApiState] = useState('local');
  const [isInitialLoading, setIsInitialLoading] = useState(() => Boolean(import.meta.env.VITE_API_URL?.trim()));
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengePick, setChallengePick] = useState(null);
  const [xp, setXp] = useState(() => {
    const saved = Number(readPreference('lunar-relics-xp', '0'));
    return Number.isFinite(saved) ? saved : 0;
  });
  const isArabic = language === 'ar';

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
    savePreference('lunar-relics-language', language);
  }, [language]);

  useEffect(() => {
    savePreference('lunar-relics-badges', JSON.stringify([...badges]));
  }, [badges]);

  useEffect(() => {
    savePreference('lunar-relics-xp', String(xp));
  }, [xp]);

  useEffect(() => {
    savePreference('lunar-relics-audio-enabled', audioEnabled ? 'on' : 'off');
  }, [audioEnabled]);

  const displayRelics = useMemo(() => relics.map(presentRelic), [relics]);
  const featuredRelic = useMemo(
    () => displayRelics.find((item) => item.id === APOLLO_LM_ID) || displayRelics.find((item) => item.body === 'Moon') || displayRelics[0] || null,
    [displayRelics],
  );
  const featuredSource = typeof featuredRelic?.nasaSource === 'string' ? featuredRelic.nasaSource : '';
  const featuredNssdcaId = featuredSource.match(/NSSDCA\)?\s+IDs?:\s*([^.]+)/i)?.[1]?.trim() || '';
  const featuredNssdcaUrl = featuredSource.match(/https:\/\/nssdc\.gsfc\.nasa\.gov\/nmc\/spacecraft\/display\.action\?id=[^;\s]+/i)?.[0] || '';
  const featuredLat = featuredRelic?.location?.lat;
  const featuredLng = featuredRelic?.location?.lng;
  const featuredCoordinates = Number.isFinite(featuredLat) && Number.isFinite(featuredLng)
    ? `${Math.abs(featuredLat).toFixed(3)}° ${featuredLat < 0 ? 'S' : 'N'}  ·  ${Math.abs(featuredLng).toFixed(3)}° ${featuredLng < 0 ? 'W' : 'E'}`
    : '';
  const featuredIsApollo = featuredRelic?.id === APOLLO_LM_ID;
  const featuredBodyLabel = featuredRelic?.body === 'Moon'
    ? (isArabic ? 'القمر' : 'MOON')
    : featuredRelic?.body === 'Mars'
      ? (isArabic ? 'المريخ' : 'MARS')
      : (isArabic ? 'الفضاء العميق' : 'DEEP SPACE');
  const featuredTitle = featuredIsApollo && isArabic
    ? 'مرحلة هبوط «إيغل»'
    : (featuredRelic?.nickname || featuredRelic?.name || (isArabic ? 'أثر من أرشيف ناسا' : 'NASA mission relic'));
  const featuredSiteName = featuredIsApollo && isArabic
    ? 'ماري ترانكويليتاتيس · بحر السكون'
    : (featuredRelic?.location?.siteName || (isArabic ? 'الموقع موثق في سجل المهمة' : 'Location recorded in mission archive'));
  const featuredModelIsAuthentic = getRelicModelInfo(featuredRelic).fidelity === 'authentic';
  const selectedRelic = useMemo(() => displayRelics.find((item) => item.id === selectedId) || null, [displayRelics, selectedId]);
  const storyMode = Boolean(selectedRelic);
  const visibleRelics = useMemo(
    () => displayRelics.filter((item) => item.body === celestialView),
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
    savePreference(WHATS_NEW_STORAGE_KEY, WHATS_NEW_VERSION);
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
    if (challengeOpen) {
      setChallengePick({ id: item.id, nonce: Date.now() });
      return;
    }
    setCelestialView(item.body || 'Moon');
    // Never auto-start the narrated tour: it used to fire a chapter every
    // second and yanked the page down before anyone could read it.
    setAutoPilotOn(false);
    setHotspot(null);
    setStoryProgress({ index: 0, total: 1 });
    setSelectedId(item.id);
  };

  const openChallenge = () => {
    setBadgeModalOpen(false);
    setWhatsNewOpen(false);
    setSelectedId(null);
    setAutoPilotOn(false);
    setArchiveOpen(false);
    setChallengeOpen(true);
  };

  const addXp = useCallback((amount) => {
    setXp((current) => current + Math.max(0, Math.round(amount)));
  }, []);

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

  const hotspotTitle = hotspot
    ? isArabic ? hotspot.titleAr || hotspot.partAr || hotspot.title || hotspot.part : hotspot.title || hotspot.part
    : '';
  const hotspotDescription = hotspot
    ? isArabic ? hotspot.descriptionAr || hotspot.description : hotspot.description
    : '';
  const enterArchive = () => {
    setEntryPortalOpen(false);
    setArchiveOpen(true);
    setWhatsNewOpen(false);
    if (audioEnabled) setAudioMuted(false, { startIfUnmuting: true });
  };
  const toggleAudio = () => {
    const nextEnabled = !audioEnabled;
    setAudioEnabled(nextEnabled);
    setAudioMuted(!nextEnabled, { startIfUnmuting: nextEnabled });
  };
  const emitUiCue = (event, hover = false) => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const control = target?.closest('button, a, [role="button"]');
    if (!control) return;
    if (hover && event.relatedTarget instanceof Node && control.contains(event.relatedTarget)) return;
    if (hover) playHoverTick();
    else playSelectSweep();
  };

  return (
    <div className={`app-shell ${storyMode ? 'story-mode' : ''} ${isArabic ? 'app-rtl' : ''} ${entryPortalOpen ? 'has-entry-portal' : ''}`} dir={isArabic ? 'rtl' : 'ltr'} onClickCapture={(event) => emitUiCue(event)} onPointerOverCapture={(event) => emitUiCue(event, true)}>
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-glow glow-one" aria-hidden="true" />
      <div className="ambient-glow glow-two" aria-hidden="true" />

      <a className="skip-to-content" href={entryPortalOpen ? '#entry-portal-title' : '#experience-main'}>{isArabic ? 'انتقل إلى المحتوى' : 'Skip to content'}</a>
      <Suspense fallback={<div className="experience-loading" role="status"><SpaceLoader language={language} compact /></div>}>
      {!entryPortalOpen && <>
      <TopNav
        celestialView={celestialView}
        setCelestialView={changeCelestialView}
        language={language}
        setLanguage={setLanguage}
        relics={displayRelics}
        badges={badges}
        onOpenBadges={() => setBadgeModalOpen(true)}
        badgesOpen={badgeModalOpen}
        onOpenChallenge={openChallenge}
        challengeOpen={challengeOpen}
        xp={xp}
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
        onToggleAutoPilot={() => {
          if (autoPilotOn) {
            setAutoPilotOn(false);
            return;
          }
          if (!selectedRelic) {
            const target = displayRelics.find((relic) => relic.id === selectedId) || displayRelics[0];
            if (!target) return;
            setCelestialView(target.body || 'Moon');
            setHotspot(null);
            setStoryProgress({ index: 0, total: 1 });
            setSelectedId(target.id);
            setBadgeModalOpen(false);
            window.setTimeout(() => setAutoPilotOn(true), 420);
            return;
          }
          setAutoPilotOn(true);
        }}
        onToggleAudio={toggleAudio}
      />
      {badgeModalOpen && (
        <BadgeModal relics={displayRelics} badges={badges} language={language} onClose={closeBadgeModal} onSelect={openRelic} />
      )}

      <main id="experience-main" tabIndex={-1} className={`workspace-grid ${storyMode ? 'story-mode' : ''}`}>
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
              <span>{celestialView === 'Deep Space' ? (isArabic ? 'الفضاء العميق · المدار' : 'DEEP SPACE / ORBIT') : celestialView.toUpperCase()}</span>
            </div>
            {selectedRelic && (
              <div
                className={`model-honesty-badge ${getRelicModelInfo(selectedRelic).fidelity === 'authentic' ? 'is-authentic' : 'is-archetype'}`}
                role="status"
                title={getRelicModelInfo(selectedRelic).modelBasis
                  ? (isArabic ? `أساس المجسم: ${getRelicModelInfo(selectedRelic).modelBasis}` : `Model basis: ${getRelicModelInfo(selectedRelic).modelBasis}`)
                  : undefined}
              >
                <BadgeCheck size={15} aria-hidden="true" />
                <span>
                  <strong>{getModelHonestyLabel(selectedRelic, language)}</strong>
                  <small dir="auto">{isArabic
                    ? (getRelicModelInfo(selectedRelic).fidelity === 'authentic'
                      ? (getRelicModelInfo(selectedRelic).modelLabelAr || 'نموذج ثلاثي الأبعاد منشور من NASA')
                      : (getRelicModelInfo(selectedRelic).modelLabelAr || 'إعادة بناء من صور ومواصفات NASA'))
                    : getRelicModelInfo(selectedRelic).modelLabel}</small>
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

      {challengeOpen && (
        <ExplorerChallenge
          relics={displayRelics}
          language={language}
          pick={challengePick}
          onClose={() => setChallengeOpen(false)}
          onXp={addXp}
          onViewChange={changeCelestialView}
        />
      )}

      <footer className="app-footer">
        <span>SPACE APPS CAIRO 2026 <i /> LUNAR RELICS 3D</span>
        <span className={`api-indicator ${apiState === 'online' ? 'is-online' : ''}`}><span />{apiState === 'online' ? (isArabic ? 'بيانات متصلة' : 'REMOTE DATA SYNCED') : (isArabic ? 'أرشيف محلي' : 'LOCAL ARCHIVE READY')}</span>
      </footer>
      {whatsNewOpen && (
        <WhatsNewDialog
          language={language}
          onClose={closeWhatsNew}
          onExplore={() => {
            closeWhatsNew();
            if (storyMode) backToMap();
            setArchiveOpen(true);
          }}
        />
      )}
      {isInitialLoading && <span className="archive-sync-note" role="status">{isArabic ? 'الأرشيف جاهز · نتحقق من التحديثات في الخلفية' : 'Archive ready · checking for updates in the background'}</span>}
      </>}
      {entryPortalOpen && (
        <main className="entry-portal" dir={isArabic ? 'rtl' : 'ltr'} aria-labelledby="entry-portal-title">
          <div className="entry-portal-shade" aria-hidden="true" />
          <header className="entry-masthead">
            <div className="entry-brand-lockup">
              <span className="entry-brand-mark" aria-hidden="true"><i /><i /><i /></span>
              <span className="entry-brand-copy"><strong>LUNAR RELICS <b>3D</b></strong><small>{isArabic ? 'أرشيف حيّ لآثار استكشاف الفضاء' : 'A LIVING ARCHIVE OF SPACE EXPLORATION'}</small></span>
            </div>
            <div className="entry-event-mark"><span className="entry-event-dot" />{isArabic ? 'تحدّي ناسا لتطبيقات الفضاء · القاهرة ٢٠٢٦' : 'NASA SPACE APPS CHALLENGE · CAIRO 2026'}</div>
          </header>

          <div className="entry-content-grid">
            <div className="entry-hero-copy">
              <p className="entry-portal-eyebrow">
                <Database size={14} />
                <span>{isArabic ? 'من أرشيف ناسا إلى تجربة تفاعلية' : 'NASA DATA · REIMAGINED AS AN INTERACTIVE EXPERIENCE'}</span>
                <button type="button" className="entry-language-toggle" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}>{isArabic ? 'EN' : 'عربي'}</button>
              </p>
              <h1 id="entry-portal-title">
                {isArabic ? <>الأثرُ باقٍ.<br /><span>والحكايةُ تبدأ الآن.</span></> : <>The footprints remain.<br /><span>The story is still unfolding.</span></>}
              </h1>
              <p className="entry-hero-description">
                {isArabic
                  ? 'نقرّب علم استكشاف الفضاء بالعربية: اكتشف آثار المهمات على القمر والمريخ وفي الفضاء العميق، عبر نماذج ثلاثية الأبعاد وقصص موثقة ومروية بالعربية والإنجليزية.'
                  : 'Bring planetary exploration closer through interactive 3D mission relics, sourced stories, and Arabic–English narration.'}
              </p>

              <div className="entry-proof-line" aria-label={isArabic ? 'مصادر علمية موثقة من أرشيف ناسا' : 'Documented science from NASA archives'}>
                <span className="entry-proof-icon"><Database size={14} /></span>
                <span>{isArabic ? 'كل أثر مرتبط ببياناته ومصادره من أرشيف ناسا NSSDCA' : 'Every relic links back to its NASA NSSDCA record and sources'}</span>
              </div>

              <div className="entry-metrics" aria-label={isArabic ? 'ملخص التجربة' : 'Experience at a glance'}>
                <div><strong>{new Intl.NumberFormat(isArabic ? 'ar-EG' : 'en').format(displayRelics.length)}</strong><span>{isArabic ? 'سجلًا للمهمات' : 'MISSION RECORDS'}</span></div>
                <i aria-hidden="true" />
                <div><strong>{new Intl.NumberFormat(isArabic ? 'ar-EG' : 'en').format(3)}</strong><span>{isArabic ? 'عوالم للاستكشاف' : 'WORLDS TO EXPLORE'}</span></div>
                <i aria-hidden="true" />
                <div><strong>AR <b>·</b> EN</strong><span>{isArabic ? 'قصة بلغتين' : 'STORIES IN TWO LANGUAGES'}</span></div>
              </div>

              <div className="entry-portal-actions">
                <button type="button" className="entry-portal-button" onClick={() => {
                  enterArchive();
                  if (featuredRelic) openRelic(featuredRelic);
                }}>
                  <span className="entry-primary-icon"><Play size={15} fill="currentColor" /></span>
                  <span>{featuredIsApollo
                    ? (isArabic ? 'ابدأ من أثر إيغل' : 'START WITH THE EAGLE')
                    : (isArabic ? 'اكتشف القصة المميزة' : 'OPEN THE FEATURED STORY')}</span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </button>
                <button type="button" className="entry-archive-link" onClick={enterArchive}>
                  {isArabic ? 'تصفّح أرشيف المهمات' : 'BROWSE THE MISSION ARCHIVE'}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </button>
              </div>
              <p className="entry-portal-note">{isArabic ? 'السرد الصوتي اختياري · النماذج تُحمّل عند اختيارها' : 'Audio is optional · 3D models load when selected'}</p>
              <nav className="entry-world-choices" aria-label={isArabic ? 'اختر عالمك للاستكشاف' : 'Choose a world to explore'}>
                {[
                  { id: 'Moon', icon: Moon, ar: 'القمر', en: 'The Moon' },
                  { id: 'Mars', icon: Globe2, ar: 'المريخ', en: 'Mars' },
                  { id: 'Deep Space', icon: Orbit, ar: 'الفضاء العميق', en: 'Deep space' },
                ].map(({ id, icon: Icon, ar, en }) => (
                  <button type="button" key={id} onClick={() => { enterArchive(); changeCelestialView(id); setArchiveOpen(false); }}>
                    <Icon size={18} aria-hidden="true" /><span>{isArabic ? ar : en}<small>{displayRelics.filter((item) => item.body === id).length} {isArabic ? 'مهمات' : 'missions'}</small></span><ArrowUpRight size={13} aria-hidden="true" />
                  </button>
                ))}
              </nav>
              <button type="button" className="entry-sound-toggle" onClick={toggleAudio} aria-pressed={audioEnabled}>
                {audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                {isArabic ? (audioEnabled ? 'الصوت مفعّل · كتم' : 'استكشف بهدوء · فعّل الصوت إن أحببت') : (audioEnabled ? 'Sound on · mute' : 'Explore quietly · turn sound on if you like')}
              </button>
            </div>

            {featuredRelic && (
              <article className="entry-feature-card" aria-label={isArabic ? 'مثال من أرشيف المهمات' : 'Featured mission from the archive'}>
                <div className="entry-card-topline"><span>{isArabic ? 'قصة من الأرشيف' : 'FROM THE ARCHIVE'}</span><span>{String(displayRelics.indexOf(featuredRelic) + 1).padStart(2, '0')} / {String(displayRelics.length).padStart(2, '0')}</span></div>
                <div className="entry-card-scene" aria-hidden="true">
                  <span className="entry-card-orbit entry-card-orbit-one" /><span className="entry-card-orbit entry-card-orbit-two" />
                  <span className="entry-card-moon" /><span className="entry-card-crosshair">+</span>
                  <span className="entry-card-coord-label">{featuredCoordinates || (isArabic ? 'موقع موثّق' : 'DOCUMENTED SITE')}</span>
                  <span className="entry-card-scene-caption">{isArabic ? `معاينة العالم · ${featuredBodyLabel}` : `DESTINATION PREVIEW · ${featuredBodyLabel}`}</span>
                </div>
                <div className="entry-feature-copy">
                  <p className="entry-feature-kicker">{featuredIsApollo
                    ? (isArabic ? 'أبولو ١١ · ٢٠ يوليو ١٩٦٩' : 'APOLLO 11 · 20 JULY 1969')
                    : (isArabic ? `مهمة فضائية · ${featuredRelic.launchYear || ''}` : `MISSION · ${featuredRelic.launchYear || ''}`)}</p>
                  <h2 dir="auto">{featuredTitle}</h2>
                  <p className="entry-feature-location" dir="auto">{featuredSiteName}</p>
                  <div className="entry-feature-source">
                    <span><BadgeCheck size={14} />{featuredModelIsAuthentic
                      ? (isArabic ? 'مجسم ثلاثي الأبعاد منشور من ناسا' : 'NASA-PUBLISHED 3D MODEL')
                      : (isArabic ? 'إعادة بناء من صور ومواصفات ناسا' : 'NASA PHOTOS & SPECS RECONSTRUCTION')}</span>
                    {featuredNssdcaUrl
                      ? <a href={featuredNssdcaUrl} target="_blank" rel="noreferrer">NSSDCA {featuredNssdcaId || ''}<ArrowUpRight size={12} /></a>
                      : <span className="entry-feature-id">{featuredNssdcaId ? `NSSDCA · ${featuredNssdcaId}` : (isArabic ? 'مصدر ناسا موثق' : 'NASA SOURCE DOCUMENTED')}</span>}
                  </div>
                </div>
              </article>
            )}
          </div>

          <footer className="entry-footer">
            <span><i />{isArabic ? 'بيانات المهمات · قصص متعددة الفصول · استكشاف ثلاثي الأبعاد' : 'MISSION DATA · CHAPTERED STORIES · INTERACTIVE 3D'}</span>
            <span>{isArabic ? 'مشروع فريق Cairo 2026' : 'A CAIRO 2026 TEAM PROJECT'}</span>
          </footer>
        </main>
      )}
      </Suspense>
    </div>
  );
}
