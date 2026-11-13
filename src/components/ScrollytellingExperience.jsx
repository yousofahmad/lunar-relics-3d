import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Box,
  Check, ChevronRight, CircleDot, Compass, Globe2, Headphones, MapPin, Moon,
  Orbit, Play, Radio, Rocket, Search, Sparkles, Volume2, VolumeX, Waves, X,
} from 'lucide-react';
import { playTelemetryTick } from '../utils/radio.js';

const FILTERS = [
  { id: 'All', en: 'Solar system', ar: 'النظام الشمسي', icon: Orbit },
  { id: 'Moon', en: 'Moon', ar: 'القمر', icon: Moon },
  { id: 'Mars', en: 'Mars', ar: 'المريخ', icon: Globe2 },
  { id: 'Deep Space', en: 'Deep space', ar: 'الفضاء العميق', icon: CircleDot },
  { id: '3D Models', en: '3D archive', ar: 'أرشيف 3D', icon: Box },
];

const CHAPTERS = {
  en: [
    { short: 'Arrival', title: 'Arrival', eyebrow: '01 / MISSION FILE' },
    { short: 'Transmission', title: 'A voice from the archive', eyebrow: '02 / FIRST-PERSON TRANSMISSION' },
    { short: 'Hardware', title: 'The machine, up close', eyebrow: '03 / HARDWARE TOUR' },
    { short: 'Timeline', title: 'The mission, in three signals', eyebrow: '04 / FLIGHT TIMELINE' },
    { short: 'Challenge', title: 'Earn your explorer badge', eyebrow: '05 / FINAL CHECK' },
  ],
  ar: [
    { short: 'الوصول', title: 'لحظة الوصول', eyebrow: '01 / ملف المهمة' },
    { short: 'الإرسال', title: 'صوت من الأرشيف', eyebrow: '02 / إرسال بلسان المركبة' },
    { short: 'العتاد', title: 'تفاصيل الآلة', eyebrow: '03 / جولة في العتاد' },
    { short: 'المسار', title: 'ثلاث إشارات من الرحلة', eyebrow: '04 / الخط الزمني' },
    { short: 'التحدي', title: 'افتح شارة المستكشف', eyebrow: '05 / الاختبار الأخير' },
  ],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const localized = (value, language) => value?.[language] || value?.en || '';
const VOICE_WAVE_HEIGHTS = [6, 10, 15, 8, 19, 12, 22, 9, 17, 7, 14, 20];

function sourceInfo(value = '') {
  const id = value.match(/NSSDCA\)?\s+IDs?:\s*([^.]+)/i)?.[1]?.trim() || '—';
  const urls = [...new Set(value.match(/https?:\/\/[^\s;]+/g) || [])]
    .map((url) => url.replace(/[.,]+$/, ''));
  return { id, urls };
}

function dateText(value, language) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

function MissionCard({ item, index, active, language, onOpen }) {
  const isArabic = language === 'ar';
  const name = item.nickname || item.name;
  const site = item.location?.siteName || (isArabic ? 'الموقع غير مسجل في الأرشيف' : 'Site not listed in the archive');
  const story = localized(item.story, language);
  const coordinates = Number.isFinite(item.location?.lat) && Number.isFinite(item.location?.lng)
    ? `${Math.abs(item.location.lat).toFixed(2)}° ${item.location.lat < 0 ? 'S' : 'N'}  ·  ${Math.abs(item.location.lng).toFixed(2)}° ${item.location.lng < 0 ? 'W' : 'E'}`
    : null;
  return (
    <article className={`mission-chapter ${index % 2 ? 'from-right' : 'from-left'} ${active ? 'is-active' : ''}`} data-mission-id={item.id}>
      <div className="mission-chapter-track" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span><i /></div>
      <div className="mission-story-card glass-panel">
        <div className="story-card-topline">
          <span className="story-card-index"><i />{isArabic ? `المهمة ${String(index + 1).padStart(2, '0')}` : `MISSION ${String(index + 1).padStart(2, '0')}`}</span>
          <span className="story-card-kind">{item.type || (isArabic ? 'قطعة أثرية' : 'SPACE RELIC')}</span>
        </div>
        <div className="mission-card-title-row">
          <span className="mission-symbol"><Rocket size={19} /></span>
          <div><span className="mission-card-body">{isArabic ? (item.body === 'Moon' ? 'سطح القمر' : item.body === 'Mars' ? 'سطح المريخ' : 'الفضاء العميق') : (item.body || 'Deep Space').toUpperCase()}</span>
            <h2 dir="auto">{name}</h2>
          </div>
        </div>
        <p className="mission-card-story" dir="auto">{story}</p>
        <div className="mission-card-location"><MapPin size={14} /><span dir="auto">{site}</span></div>
        <div className="mission-card-meta"><span><small>{isArabic ? 'الإطلاق' : 'LAUNCH'}</small><strong dir="ltr">{item.launchYear || '—'}</strong></span>
          {coordinates && <span><small>{isArabic ? 'إحداثيات الموقع' : 'SITE COORDINATES'}</small><strong dir="ltr">{coordinates}</strong></span>}
          <span className={`model-status ${item.has3DModel ? 'has-model' : ''}`}><i />{item.has3DModel ? (isArabic ? 'مجسم ثلاثي الأبعاد' : '3D MODEL') : (isArabic ? 'إعادة بناء هولوغرافية' : 'HOLOGRAM')}</span>
        </div>
        <button className="mission-open-button" type="button" onClick={() => onOpen(item)}>
          <span>{isArabic ? 'ابدأ رحلة المركبة' : 'ENTER THE MISSION JOURNEY'}</span><ArrowUpRight size={16} />
        </button>
      </div>
      <span className="mission-side-note" dir="ltr">{String(item.launchYear || '—')} <i /> NSSDCA</span>
    </article>
  );
}

function PlanetJourney({ relics, language, filter, setFilter, onOpen, journeyRef, onActiveMissionChange }) {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(null);
  const sectionsRef = useRef([]);
  const activeIndexRef = useRef(-1);
  const scrollTimerRef = useRef(null);
  const isArabic = language === 'ar';
  const needle = query.trim().toLocaleLowerCase(isArabic ? 'ar' : 'en');
  const items = useMemo(() => relics.filter((item) => {
    if (filter === '3D Models' && !item.has3DModel) return false;
    if (!['All', '3D Models'].includes(filter) && item.body !== filter) return false;
    if (!needle) return true;
    return [item.id, item.name, item.nickname, item.type, item.body, item.launchYear, item.location?.siteName]
      .filter(Boolean).join(' ').toLocaleLowerCase(isArabic ? 'ar' : 'en').includes(needle);
  }), [filter, isArabic, needle, relics]);

  useEffect(() => {
    sectionsRef.current = sectionsRef.current.slice(0, items.length);
    activeIndexRef.current = -1;
    journeyRef.current.cameraItems = items;
    if (!items.length) {
      journeyRef.current.exploreProgress = 0;
      journeyRef.current.activeMissionId = null;
      setActiveId(null);
      onActiveMissionChange?.(null);
      return undefined;
    }

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const height = Math.max(window.innerHeight, 1);
        const centers = sectionsRef.current.map((section) => {
          if (!section) return null;
          const rect = section.getBoundingClientRect();
          return rect.top + window.scrollY + rect.height / 2;
        });
        if (centers.some((center) => center === null)) return;
        const viewportCenter = window.scrollY + height * 0.52;
        let progress = 0;
        if (viewportCenter >= centers[centers.length - 1]) progress = centers.length - 1;
        else if (viewportCenter > centers[0]) {
          const lower = centers.findIndex((center, index) => index < centers.length - 1 && viewportCenter >= center && viewportCenter <= centers[index + 1]);
          if (lower >= 0) progress = lower + (viewportCenter - centers[lower]) / Math.max(1, centers[lower + 1] - centers[lower]);
        }
        progress = clamp(progress, 0, Math.max(0, items.length - 1));
        const index = clamp(Math.round(progress), 0, items.length - 1);
        const exploreEnabled = viewportCenter >= centers[0] - height * 0.45;
        journeyRef.current.exploreProgress = progress;
        journeyRef.current.cameraItems = items;
        journeyRef.current.exploreEnabled = exploreEnabled;
        journeyRef.current.isScrolling = exploreEnabled;
        window.clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = window.setTimeout(() => { journeyRef.current.isScrolling = false; }, 180);
        const item = items[index];
        journeyRef.current.activeMissionId = item?.id || null;
        setActiveId((current) => current === item?.id ? current : item?.id || null);
        if (activeIndexRef.current !== index) {
          if (activeIndexRef.current >= 0) void playTelemetryTick('whoosh');
          activeIndexRef.current = index;
          onActiveMissionChange?.(item || null);
        }
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(scrollTimerRef.current);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [items, journeyRef, onActiveMissionChange]);

  const modelCount = relics.filter((item) => item.has3DModel).length;
  return (
    <main className="planet-journey" dir={isArabic ? 'rtl' : 'ltr'}>
      <section className="journey-hero" aria-labelledby="journey-title">
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" /><div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="hero-copy">
          <div className="hero-kicker"><span className="signal-live" />{isArabic ? 'أرشيف ناسا · بث تفاعلي' : 'NASA ARCHIVE · LIVE EXPLORATION'}</div>
          <h1 id="journey-title" dir="auto">{isArabic ? <>آثارٌ بشرية<br /><em>على أطراف القمر</em></> : <>Small relics.<br /><em>Infinite journeys.</em></>}</h1>
          <p>{isArabic ? 'ست عشرة مهمة. عالم ثلاثي الأبعاد. مرّر لاكتشاف المواقع التي تركنا فيها أثرًا.' : 'Sixteen missions. One living 3D atlas. Scroll to discover where we left our mark.'}</p>
          <div className="hero-stats">
            <span><strong>{String(relics.length).padStart(2, '0')}</strong><small>{isArabic ? 'ملف مهمة' : 'MISSION FILES'}</small></span><i />
            <span><strong>{String(modelCount).padStart(2, '0')}</strong><small>{isArabic ? 'مجسمات أصلية' : '3D MODELS'}</small></span><i />
            <span><strong>01</strong><small>{isArabic ? 'أرشيف ناسا' : 'NASA ARCHIVE'}</small></span>
          </div>
        </div>
        <div className="hero-instruction"><ArrowDown size={15} /><span>{isArabic ? 'مرّر للهبوط إلى مواقع المهمات' : 'SCROLL TO DESCEND THROUGH THE MISSIONS'}</span><div className="scroll-meter"><i /></div></div>
        <span className="hero-coordinate" dir="ltr">LUNAR SURFACE / 00° 40′ N</span>
      </section>

      <section className="mission-index" aria-label={isArabic ? 'فهرس المهمات' : 'Mission index'}>
        <div className="mission-index-head">
          <div><span className="section-overline"><Activity size={13} />{isArabic ? 'سجل الاستكشاف' : 'FIELD LOG / 2026'}</span><h2>{isArabic ? 'اختر إشارةً واتبعها' : 'Follow the signal.'}</h2></div>
          <span className="mission-index-count" dir="ltr">{String(items.length).padStart(2, '0')} <i>/ {String(relics.length).padStart(2, '0')}</i></span>
        </div>
        <div className="journey-tools">
          <div className="mission-filters" role="group" aria-label={isArabic ? 'تصفية المهمات' : 'Filter missions'}>
            {FILTERS.map(({ id, en, ar, icon: Icon }) => <button key={id} type="button" className={filter === id ? 'is-active' : ''} aria-pressed={filter === id} onClick={() => setFilter(id)}><Icon size={13} /><span>{isArabic ? ar : en}</span></button>)}
          </div>
          <label className="journey-search"><Search size={15} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isArabic ? 'ابحث في سجل المهمات' : 'Search the mission log'} aria-label={isArabic ? 'ابحث في المهمات' : 'Search missions'} />{query && <button type="button" onClick={() => setQuery('')} aria-label={isArabic ? 'مسح البحث' : 'Clear search'}><X size={14} /></button>}</label>
        </div>
        <div className="scroll-index-guide"><span>{isArabic ? 'المركبة النشطة' : 'CURRENT SIGNAL'}</span><i /><span dir="auto">{items.find((item) => item.id === activeId)?.nickname || items.find((item) => item.id === activeId)?.name || (isArabic ? 'مرّر لبدء الاستكشاف' : 'Scroll to explore')}</span><b dir="ltr">{String(Math.max(0, items.findIndex((item) => item.id === activeId) + 1)).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</b></div>
      </section>

      <div className="mission-chapters-list">
        {items.map((item, index) => <div key={item.id} ref={(element) => { sectionsRef.current[index] = element; }}><MissionCard item={item} index={index} active={activeId === item.id} language={language} onOpen={onOpen} /></div>)}
        {!items.length && <div className="empty-missions glass-panel"><Orbit size={26} /><p>{isArabic ? 'لم نعثر على مهمات مطابقة. جرّب كلمة أخرى.' : 'No missions match that search. Try another term.'}</p></div>}
      </div>
      <footer className="journey-footer"><span>LUNAR RELICS <i /> MISSION MEMORY ARCHIVE</span><span>{isArabic ? 'البيانات من أرشيف ناسا / NSSDCA' : 'DATA FROM NASA / NSSDCA'}</span></footer>
    </main>
  );
}

function ChapterDock({ language, activeChapter, onJump }) {
  const chapters = CHAPTERS[language] || CHAPTERS.en;
  return <nav className="chapter-dock glass-panel" aria-label={language === 'ar' ? 'التنقل بين فصول المهمة' : 'Mission chapters'}>
    {chapters.map((chapter, index) => <button key={chapter.short} type="button" className={activeChapter === index ? 'is-active' : ''} aria-current={activeChapter === index ? 'step' : undefined} onClick={() => onJump(index)} title={chapter.title}>
      <span>{String(index + 1).padStart(2, '0')}</span><small>{chapter.short}</small>
    </button>)}
  </nav>;
}

function ChapterHeader({ language, chapterIndex }) {
  const copy = (CHAPTERS[language] || CHAPTERS.en)[chapterIndex];
  return <div className="chapter-heading"><span className="chapter-eyebrow"><i />{copy.eyebrow}</span><h2>{copy.title}</h2></div>;
}

function RelicJourney({ item, language, badges, onBack, onUnlock, hotspot, setHotspot, isTransmitting, onTransmit, onStopAudio, voiceEnabled, caption, journeyRef }) {
  const isArabic = language === 'ar';
  const chapters = CHAPTERS[language] || CHAPTERS.en;
  const storyText = localized(item.story, language);
  const question = localized(item.quiz?.question, language);
  const options = item.quiz?.options?.[language] || item.quiz?.options?.en || [];
  const { id: archiveId, urls } = sourceInfo(item.nasaSource);
  const hardware = useMemo(() => (item.hotspots || []).slice(0, 3), [item.hotspots]);
  const fullTimeline = item.timeline || [];
  const timelineSteps = useMemo(() => {
    const timelineIndexes = [...new Set([0, Math.max(0, Math.round((fullTimeline.length - 1) / 2)), Math.max(0, fullTimeline.length - 1)])].slice(0, 3);
    return timelineIndexes.map((timelineIndex, step) => ({ ...fullTimeline[timelineIndex], timelineIndex, step }));
  }, [fullTimeline]);
  const chapterRefs = useRef([]);
  const hardwareRefs = useRef([]);
  const timelineRefs = useRef([]);
  const scrollTimerRef = useRef(null);
  const previousChapterRef = useRef(null);
  const previousHotspotRef = useRef(null);
  const previousTimelineRef = useRef(null);
  const autoTransmitRef = useRef(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState('');
  const [activeHotspotIndex, setActiveHotspotIndex] = useState(-1);
  const [activeTimelineIndex, setActiveTimelineIndex] = useState(0);

  useEffect(() => {
    chapterRefs.current = chapterRefs.current.slice(0, 5);
    hardwareRefs.current = hardwareRefs.current.slice(0, hardware.length);
    timelineRefs.current = timelineRefs.current.slice(0, timelineSteps.length);
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const center = window.innerHeight * 0.53;
        let chapterIndex = 0;
        chapterRefs.current.forEach((section, index) => {
          if (!section) return;
          const rect = section.getBoundingClientRect();
          if (rect.top <= center && rect.bottom > center) chapterIndex = index;
        });
        journeyRef.current.chapter = chapterIndex;
        journeyRef.current.isScrolling = true;
        window.clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = window.setTimeout(() => { journeyRef.current.isScrolling = false; }, 180);
        setActiveChapter((current) => current === chapterIndex ? current : chapterIndex);
        if (previousChapterRef.current !== null && previousChapterRef.current !== chapterIndex) void playTelemetryTick('whoosh');
        previousChapterRef.current = chapterIndex;

        if (chapterIndex === 2 && hardwareRefs.current.length) {
          let nearest = 0;
          let distance = Infinity;
          hardwareRefs.current.forEach((section, index) => {
            if (!section) return;
            const rect = section.getBoundingClientRect();
            const nextDistance = Math.abs((rect.top + rect.bottom) / 2 - center);
            if (nextDistance < distance) { distance = nextDistance; nearest = index; }
          });
          setActiveHotspotIndex((current) => current === nearest ? current : nearest);
          journeyRef.current.hotspotIndex = nearest;
          if (previousHotspotRef.current !== nearest) {
            if (previousHotspotRef.current !== null) void playTelemetryTick('tick');
            previousHotspotRef.current = nearest;
            const nextSpot = hardware[nearest];
            if (nextSpot) setHotspot(nextSpot);
          }
        } else {
          journeyRef.current.hotspotIndex = -1;
        }

        if (chapterIndex === 3 && timelineRefs.current.length) {
          let nearest = 0;
          let distance = Infinity;
          timelineRefs.current.forEach((section, index) => {
            if (!section) return;
            const rect = section.getBoundingClientRect();
            const nextDistance = Math.abs((rect.top + rect.bottom) / 2 - center);
            if (nextDistance < distance) { distance = nextDistance; nearest = index; }
          });
          setActiveTimelineIndex((current) => current === nearest ? current : nearest);
          journeyRef.current.timelineIndex = nearest;
          if (previousTimelineRef.current !== nearest) {
            if (previousTimelineRef.current !== null) void playTelemetryTick('tick');
            previousTimelineRef.current = nearest;
          }
        }
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(scrollTimerRef.current);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [hardware, journeyRef, setHotspot, timelineSteps.length]);

  useEffect(() => {
    if (activeChapter !== 1 || !voiceEnabled || !storyText || autoTransmitRef.current) return;
    autoTransmitRef.current = true;
    const timer = window.setTimeout(() => onTransmit(storyText), 220);
    return () => window.clearTimeout(timer);
  }, [activeChapter, onTransmit, storyText, voiceEnabled]);

  const jumpTo = useCallback((index) => {
    const section = chapterRefs.current[index];
    if (!section) return;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    void playTelemetryTick('whoosh');
  }, []);

  const focusHardware = (spot, index) => {
    setHotspot(spot);
    journeyRef.current.hotspotIndex = index;
    void playTelemetryTick('tick');
  };

  const submitQuiz = () => {
    if (selectedAnswer === null || selectedAnswer === undefined) return;
    if (selectedAnswer === item.quiz?.correctAnswer) {
      const already = badges.has(item.id);
      setQuizResult(already ? 'already' : 'unlocked');
      if (!already) {
        confetti({ particleCount: 82, spread: 68, startVelocity: 27, origin: { y: 0.68 }, colors: ['#69e8ff', '#c9ff7a', '#ffffff', '#ffbf76'], disableForReducedMotion: true });
        onUnlock(item.id);
      }
    } else setQuizResult('wrong');
  };

  const bodyName = isArabic ? (item.body === 'Moon' ? 'القمر' : item.body === 'Mars' ? 'المريخ' : 'الفضاء العميق') : (item.body || 'Deep Space');
  const dates = [item.launchYear || '—', dateText(item.landingDate, language), dateText(item.endOfMission, language)];
  const site = item.location?.siteName || (isArabic ? 'الموقع غير مسجل' : 'Site not listed');
  const badgeUnlocked = badges.has(item.id);

  return (
    <main className="relic-journey" dir={isArabic ? 'rtl' : 'ltr'}>
      <section className="relic-chapter relic-hero-chapter" ref={(node) => { chapterRefs.current[0] = node; }}>
        <div className="relic-chapter-sidecode" dir="ltr">{String(item.launchYear || '—')} / {item.type?.toUpperCase()}</div>
        <div className="relic-hero-card glass-panel">
          <span className="chapter-eyebrow"><i />{chapters[0].eyebrow}</span>
          <span className="relic-type-line"><Rocket size={14} />{bodyName} <b /> {item.type}</span>
          <h1 dir="auto">{item.nickname || item.name}</h1>
          <p className="relic-hero-intro" dir="auto">{site}</p>
          <div className="relic-telemetry-grid">
            <span><small>{isArabic ? 'معرّف NSSDCA' : 'NSSDCA ID'}</small><strong dir="ltr">{archiveId}</strong></span>
            <span><small>{isArabic ? 'سنة الإطلاق' : 'LAUNCH YEAR'}</small><strong dir="ltr">{item.launchYear || '—'}</strong></span>
            <span><small>{isArabic ? 'الوجهة' : 'TARGET BODY'}</small><strong>{bodyName}</strong></span>
          </div>
          <button className="chapter-scroll-cue" type="button" onClick={() => jumpTo(1)}><span>{isArabic ? 'ابدأ الإرسال الصوتي' : 'ENTER THE TRANSMISSION'}</span><ArrowDown size={15} /></button>
        </div>
        <span className="relic-hero-caption" dir="ltr">{item.has3DModel ? 'FLIGHT HARDWARE / 3D' : 'ARCHIVAL RECONSTRUCTION'}</span>
      </section>

      <section className="relic-chapter voice-chapter" ref={(node) => { chapterRefs.current[1] = node; }}>
        <div className="chapter-content voice-content">
          <ChapterHeader language={language} chapterIndex={1} />
          <div className={`voice-transmission-card glass-panel ${isTransmitting ? 'is-live' : ''}`}>
            <div className="transmission-topline"><span className="transmission-live"><i />{isTransmitting ? (isArabic ? 'جارٍ الإرسال' : 'TRANSMITTING') : (isArabic ? 'قناة الأرشيف' : 'ARCHIVE CHANNEL')}</span><span dir="ltr">{archiveId}</span></div>
            <div className={`voice-orb ${isTransmitting ? 'is-speaking' : ''}`} aria-hidden="true"><div /><i /><i /><i /><Waves size={29} /></div>
            <p className="voice-quote" dir="auto">“{caption || storyText}”</p>
            <div className="voice-waveform" aria-hidden="true">{Array.from({ length: 32 }, (_, index) => <i key={index} style={{ '--wave': index, '--wave-height': `${VOICE_WAVE_HEIGHTS[index % VOICE_WAVE_HEIGHTS.length]}px` }} />)}</div>
            <div className="voice-player-row">
              <button type="button" className="voice-play-button" onClick={isTransmitting ? onStopAudio : () => onTransmit(storyText)} aria-pressed={isTransmitting}>
                {isTransmitting ? <VolumeX size={16} /> : <Play size={16} fill="currentColor" />}<span>{isTransmitting ? (isArabic ? 'إيقاف الإرسال' : 'STOP TRANSMISSION') : (isArabic ? 'أعِد تشغيل الإرسال' : 'PLAY TRANSMISSION')}</span>
              </button>
              <span className="voice-note"><Headphones size={13} />{isArabic ? 'ترجمة نصية مباشرة' : 'LIVE CAPTIONS ENABLED'}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="relic-chapter hardware-chapter" ref={(node) => { chapterRefs.current[2] = node; }}>
        {hardware.length ? hardware.map((spot, index) => {
          const active = activeHotspotIndex === index;
          return <article className={`hardware-journey-step ${index % 2 ? 'from-right' : 'from-left'} ${active ? 'is-focused' : ''}`} key={`${item.id}-hardware-${index}`} ref={(node) => { hardwareRefs.current[index] = node; }}>
            <div className="hardware-card glass-panel">
              <div className="hardware-card-meta"><span><Box size={13} />{isArabic ? 'نقطة عتاد' : 'HARDWARE HOTSPOT'}</span><b dir="ltr">{String(index + 1).padStart(2, '0')} / {String(hardware.length).padStart(2, '0')}</b></div>
              <span className="hardware-part-type">{isArabic ? `المكوّن ${String(index + 1).padStart(2, '0')}` : `COMPONENT ${String(index + 1).padStart(2, '0')}`}</span>
              <h3 dir="auto">{spot.part || spot.title}</h3>
              <p dir="auto">{spot.description}</p>
              <button type="button" className="hardware-focus-button" onClick={() => focusHardware(spot, index)} aria-pressed={Boolean(hotspot && (hotspot.part === spot.part || hotspot.title === spot.title))}>
                <Compass size={15} /><span>{isArabic ? 'ركّز الكاميرا على هذا الجزء' : 'FOCUS 3D VIEW ON THIS PART'}</span><ChevronRight size={15} />
              </button>
            </div>
            <span className="hardware-guide-no" dir="ltr">{String(index + 1).padStart(2, '0')}</span>
          </article>;
        }) : <article className="hardware-journey-step"><div className="hardware-card glass-panel"><Box size={22} /><h3>{isArabic ? 'لا توجد نقاط عتاد مسجلة' : 'No hardware points in the archive'}</h3><p>{isArabic ? 'يمكنك تدوير المجسم يدويًا واستكشاف تفاصيله.' : 'Drag the 3D object to explore the available reconstruction.'}</p></div></article>}
      </section>

      <section className="relic-chapter timeline-chapter" ref={(node) => { chapterRefs.current[3] = node; }}>
        {timelineSteps.map((step, index) => <article className={`timeline-journey-step phase-${index} ${activeTimelineIndex === index ? 'is-current' : ''}`} key={`${item.id}-timeline-${step.timelineIndex}`} ref={(node) => { timelineRefs.current[index] = node; }}>
          <div className="timeline-signal-card glass-panel">
            <div className="timeline-step-topline"><span className="chapter-eyebrow"><i />{chapters[3].eyebrow}</span><span dir="ltr">SIGNAL 0{index + 1} / 03</span></div>
            <div className="timeline-orbit-mark"><span /><i /><i /><i /></div>
            <span className="timeline-phase-name">{isArabic ? ['بداية الرحلة', 'الوصول إلى الموقع', 'آخر سجل'][index] : ['MISSION START', 'ARRIVAL / SURFACE', 'FINAL ARCHIVE RECORD'][index]}</span>
            <h3 dir="ltr">{step.year || dates[index] || '—'}</h3>
            <p dir="auto">{step.event || (isArabic ? 'لا توجد تفاصيل إضافية في الخط الزمني.' : 'No further timeline details are available.')}</p>
            <div className="timeline-progress"><i style={{ width: `${((index + 1) / timelineSteps.length) * 100}%` }} /></div>
          </div>
          {index < timelineSteps.length - 1 && <span className="timeline-next-line" aria-hidden="true" />}
        </article>)}
      </section>

      <section className="relic-chapter quiz-chapter" ref={(node) => { chapterRefs.current[4] = node; }}>
        <div className="quiz-challenge-card glass-panel">
          <ChapterHeader language={language} chapterIndex={4} />
          <span className="quiz-pretitle"><Sparkles size={15} />{isArabic ? 'اختبر سجلّك' : 'TEST YOUR SIGNAL'}</span>
          <h3 dir="auto">{question || (isArabic ? 'لا يتضمن هذا الملف اختبارًا.' : 'No mission challenge is listed.')}</h3>
          <p className="quiz-instructions">{isArabic ? 'اختر الإجابة الصحيحة لفتح شارة هذه المهمة.' : 'Choose the correct answer to unlock this mission’s explorer badge.'}</p>
          <div className="quiz-answers">
            {options.map((option, index) => <button key={`${item.id}-answer-${index}`} type="button" className={`quiz-answer ${selectedAnswer === index ? 'is-selected' : ''} ${['unlocked', 'already'].includes(quizResult) && index === item.quiz?.correctAnswer ? 'is-correct' : ''}`} onClick={() => { setSelectedAnswer(index); setQuizResult(''); }}>
              <span dir="ltr">0{index + 1}</span><span dir="auto">{option}</span>{selectedAnswer === index && <Check size={15} />}
            </button>)}
          </div>
          <button type="button" className="quiz-confirm-button" onClick={submitQuiz} disabled={selectedAnswer === null || selectedAnswer === undefined || !options.length}><BadgeCheck size={16} /><span>{quizResult === 'wrong' ? (isArabic ? 'إشارة غير مطابقة — حاول ثانية' : 'SIGNAL MISMATCH — TRY AGAIN') : (isArabic ? 'تحقّق من الإجابة' : 'VERIFY ANSWER')}</span></button>
          {(quizResult === 'unlocked' || quizResult === 'already') && <div className="quiz-feedback is-success" role="status"><BadgeCheck size={17} />{quizResult === 'already' ? (isArabic ? 'الشارة موجودة بالفعل في أرشيفك' : 'BADGE ALREADY IN YOUR ARCHIVE') : (isArabic ? 'تم التحقق — فُتحت الشارة' : 'SIGNAL VERIFIED — BADGE UNLOCKED')}</div>}
          {quizResult === 'wrong' && <div className="quiz-feedback is-error" role="status">{isArabic ? 'الإجابة غير صحيحة، حاول مرة أخرى.' : 'That answer is not correct. Try again.'}</div>}
          <div className="explorer-badge"><span className="explorer-badge-icon"><Sparkles size={19} /></span><span><small>{isArabic ? 'شارة المستكشف' : 'EXPLORER BADGE'}</small><strong dir="auto">{item.badgeName || item.nickname || item.name}</strong></span><b className={badgeUnlocked ? 'is-unlocked' : ''}>{badgeUnlocked ? (isArabic ? 'مفتوحة' : 'UNLOCKED') : (isArabic ? 'مقفلة' : 'LOCKED')}</b></div>
          <div className="chapter-citations"><span>{isArabic ? 'المصدر' : 'SOURCE ARCHIVE'}</span><bdi dir="ltr">NSSDCA · {archiveId}</bdi><div>{urls.slice(0, 3).map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">{index === 0 ? 'NASA / NSSDCA' : `${isArabic ? 'مصدر' : 'SOURCE'} 0${index + 1}`}<ArrowUpRight size={12} /></a>)}</div></div>
        </div>
      </section>
      <div className="relic-footer"><button type="button" onClick={onBack}><ArrowLeft size={14} />{isArabic ? 'العودة إلى سجل المهمات' : 'BACK TO MISSION LOG'}</button><span>LUNAR RELICS <i /> NSSDCA</span></div>
      <ChapterDock language={language} activeChapter={activeChapter} onJump={jumpTo} />
    </main>
  );
}

export default function ScrollytellingExperience(props) {
  if (props.selectedRelic) {
    return <RelicJourney key={props.selectedRelic.id} {...props} item={props.selectedRelic} />;
  }
  return <PlanetJourney {...props} />;
}
