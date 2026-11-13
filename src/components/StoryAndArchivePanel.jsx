import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Box, CalendarDays, Clapperboard,
  CarFront, Check, CircleHelp, Clock3, Crosshair, Globe2, ListFilter, MapPin,
  Moon, Orbit, Play, Radio, RadioTower, Rocket, RotateCcw, Satellite, Search,
  Sparkles, Volume2, VolumeX, X,
} from 'lucide-react';
import { transmitText } from '../utils/radio.js';
import { has3DRepresentation } from '../utils/relicModelMap.js';

const COPY = {
  en: {
    archive: 'MISSIONS TO EXPLORE', count: 'MISSIONS IN THE ARCHIVE', hint: 'Choose a mission to explore its story.',
    search: 'Search missions by name or year', noMatches: 'No missions found. Try another word.', clearSearch: 'Clear search',
    interactiveModel: '3D INTERACTIVE MODEL',
    noLocation: 'Location not listed', memory: 'MISSION STORY', back: 'BACK TO MISSIONS',
    telemetry: 'MISSION FACTS', record: 'NASA MISSION ID', coordinates: 'WHERE IT LANDED', orbit: 'LOCATION', positionUnavailable: 'Location not listed',
    hotspots: 'PARTS TO EXPLORE', hotspotHint: 'Tap a glowing point to learn what that part does.', hotspotDetail: 'ABOUT THIS PART', locked: 'NOT EARNED', unlocked: 'EARNED',
    mission: 'MISSION INFO', active: 'IN THE ARCHIVE', story: 'Story & questions', timeline: 'Mission journey', quiz: 'Quick quiz',
    transmit: 'PLAY GUIDED MISSION', transmitting: 'PLAYING…', stop: 'Stop audio', voice: 'SPACECRAFT VOICE', subtitleLoading: 'STARTING THE MISSION TOUR…',
    fieldNote: 'A STORY FROM SPACE', qa: 'QUESTIONS & ANSWERS', answer: 'ANSWER',
    milestones: 'STEPS IN THE JOURNEY', quizTitle: 'WHAT DID YOU LEARN?', choose: 'Choose the right answer to earn this badge.',
    submit: 'CHECK ANSWER', correct: 'CORRECT — BADGE EARNED', already: 'BADGE ALREADY EARNED', wrong: 'NOT QUITE — TRY AGAIN',
    badge: 'EXPLORER BADGE', citation: 'NASA SOURCES', nssdca: 'NASA MISSION ID', nasa: 'NASA SOURCE', sources: 'MORE NASA SOURCES',
    launch: 'LAUNCH', landing: 'LANDED', end: 'MISSION ENDED', site: 'MISSION PLACE',
    category: 'MISSION TYPE', details: 'MISSION DETAILS', time: 'MISSION JOURNEY', quizHint: 'Choose an answer below.',
    open: 'OPEN MISSION STORY', deep: 'SPACE', moon: 'MOON', mars: 'MARS', lander: 'LANDING CRAFT', rover: 'ROVER', scientific: 'SCIENCE TOOLS', probe: 'SPACE PROBE', rotorcraft: 'HELICOPTER', orbiter: 'ORBITER', impact: 'IMPACT PROBE',
  },
  ar: {
    archive: 'مهمات لاستكشافها', count: 'المهمات في الأرشيف', hint: 'اختر مهمة لتشاهد قصتها.',
    search: 'ابحث عن مهمة بالاسم أو السنة', noMatches: 'لم نجد مهمة بهذا البحث. جرّب كلمة أخرى.', clearSearch: 'مسح البحث',
    interactiveModel: 'نموذج تفاعلي ثلاثي الأبعاد',
    noLocation: 'الموقع غير مذكور', memory: 'قصة المهمة', back: 'العودة للمهمات',
    telemetry: 'معلومات المهمة', record: 'رقم المهمة', coordinates: 'مكان الهبوط', orbit: 'الموقع', positionUnavailable: 'الموقع غير مذكور',
    hotspots: 'أجزاء لاستكشافها', hotspotHint: 'اضغط على نقطة مضيئة لتعرف وظيفة هذا الجزء.', hotspotDetail: 'عن هذا الجزء', locked: 'لم تحصل عليها', unlocked: 'حصلت عليها',
    mission: 'معلومات المهمة', active: 'في الأرشيف', story: 'القصة والأسئلة', timeline: 'رحلة المهمة', quiz: 'سؤال سريع',
    transmit: 'ابدأ الجولة الموجّهة', transmitting: 'جارٍ التشغيل…', stop: 'إيقاف الجولة', voice: 'صوت المركبة', subtitleLoading: 'جارٍ بدء جولة المهمة…',
    fieldNote: 'حكاية من الفضاء', qa: 'أسئلة وأجوبة', answer: 'الإجابة',
    milestones: 'خطوات الرحلة', quizTitle: 'ماذا تعلمت؟', choose: 'اختر الإجابة الصحيحة لتحصل على هذه الشارة.',
    submit: 'تحقق من الإجابة', correct: 'إجابة صحيحة — حصلت على الشارة', already: 'حصلت على الشارة من قبل', wrong: 'ليست الإجابة الصحيحة — حاول مرة أخرى',
    badge: 'شارة المستكشف', citation: 'مصادر ناسا', nssdca: 'رقم المهمة', nasa: 'مصدر ناسا', sources: 'مصادر أخرى',
    launch: 'الإطلاق', landing: 'الهبوط', end: 'نهاية المهمة', site: 'مكان المهمة',
    category: 'نوع المهمة', details: 'معلومات المهمة', time: 'رحلة المهمة', quizHint: 'اختر إجابة بالأسفل.',
    open: 'افتح قصة المهمة', deep: 'الفضاء', moon: 'القمر', mars: 'المريخ', lander: 'مركبة هبوط', rover: 'عربة استكشاف', scientific: 'أدوات علمية', probe: 'مسبار فضائي', rotorcraft: 'مروحية', orbiter: 'مركبة مدارية', impact: 'مسبار اصطدام',
  },
};

function getSources(nasaSource = '') {
  const idText = nasaSource.match(/NSSDCA\)?\s+IDs?:\s*([^.]+)/i)?.[1]?.trim() || '—';
  const urls = [...new Set(nasaSource.match(/https?:\/\/[^\s;]+/g) || [])].map((url) => url.replace(/[.,]+$/, ''));
  return { idText, urls };
}

function getTelemetryPosition(item, copy) {
  const { lat, lng, siteName } = item.location || {};
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const latitude = `${Math.abs(lat)}° ${lat < 0 ? 'S' : 'N'}`;
    const longitude = `${Math.abs(lng)}° ${lng < 0 ? 'W' : 'E'}`;
    return { label: copy.coordinates, value: `${latitude}  ·  ${longitude}`, coordinates: true };
  }
  return { label: copy.orbit, value: siteName || copy.positionUnavailable, coordinates: false };
}

function sameHotspot(first, second) {
  if (!first || !second) return false;
  if (first.part && second.part) return first.part === second.part;
  return Boolean(first.title && second.title && first.title === second.title);
}

function dateLabel(value, language) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

function splitStoryBeats(text) {
  const parts = text.match(/[^.!؟]+[.!؟]+|[^.!؟]+$/gu) || [text];
  return parts.map((part) => part.trim()).filter(Boolean);
}

function getHardwareChapterLabel(spot, index, language) {
  const source = language === 'ar'
    ? spot.partAr || spot.titleAr || spot.part || spot.title
    : spot.shortTitle || spot.part || spot.title;
  const words = String(source || 'HARDWARE')
    .replace(/[&/·—–]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return `${String(index + 1).padStart(2, '0')} ${words.join(' ').toLocaleUpperCase(language === 'ar' ? 'ar' : 'en')}`;
}

function getBodyLabel(item, language, copy) {
  if (item.body === 'Moon') return copy.moon;
  if (item.body === 'Mars') return copy.mars;
  return copy.deep;
}

function getTypeLabel(type, language, copy) {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('rover')) return copy.rover;
  if (normalized.includes('lander')) return copy.lander;
  if (normalized.includes('scientific')) return copy.scientific;
  if (normalized.includes('rotor')) return copy.rotorcraft;
  if (normalized.includes('orbiter')) return copy.orbiter;
  if (normalized.includes('impact')) return copy.impact;
  if (normalized.includes('probe')) return copy.probe;
  return language === 'ar' ? type : type.toUpperCase();
}

function getTypeIcon(type = '') {
  const normalized = type.toLowerCase();
  if (normalized.includes('rover')) return CarFront;
  if (normalized.includes('lander')) return Rocket;
  if (normalized.includes('scientific')) return Activity;
  if (normalized.includes('rotor')) return RotateCcw;
  if (normalized.includes('orbiter')) return Orbit;
  if (normalized.includes('impact')) return Crosshair;
  return Satellite;
}

function RelicCard({ item, language, onSelect }) {
  const copy = COPY[language] || COPY.en;
  const AssetIcon = Box;
  const TypeIcon = getTypeIcon(item.type);
  const assetLabel = copy.interactiveModel;
  return (
    <button type="button" className="relic-card" onClick={() => onSelect(item)} aria-label={`${item.nickname || item.name} — ${assetLabel}`}>
      <span className="relic-card-art has-model" aria-hidden="true"><TypeIcon size={22} strokeWidth={1.6} /></span>
      <span className="relic-card-copy">
        <span className="relic-card-index">{item.launchYear} <i /> {getTypeLabel(item.type, language, copy)}</span>
        <span className="relic-card-title">{item.nickname || item.name}</span>
        <span className="relic-card-meta">
          <span>{getBodyLabel(item, language, copy)} · {item.landingDate ? dateLabel(item.landingDate, language) : item.launchYear}</span>
          <span className="relic-card-model has-model"><AssetIcon size={10} />{assetLabel}</span>
        </span>
      </span>
      <span className="relic-card-arrow"><ArrowUpRight size={15} /></span>
    </button>
  );
}

const ARCHIVE_FILTERS = [
  { id: 'All', icon: ListFilter, en: 'ALL', ar: 'الكل' },
  { id: 'Moon', icon: Moon, en: 'MOON', ar: 'القمر' },
  { id: 'Mars', icon: Globe2, en: 'MARS', ar: 'المريخ' },
  { id: '3D', icon: Box, en: '3D MODELS', ar: 'نماذج 3D' },
];

function ArchiveList({ relics, language, onSelect, archiveFilter = 'All', setArchiveFilter }) {
  const copy = COPY[language] || COPY.en;
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase(language === 'ar' ? 'ar' : 'en');
  const scopedRelics = relics.filter((item) => {
    if (archiveFilter === '3D') return has3DRepresentation(item);
    if (archiveFilter === 'All') return true;
    return item.body === archiveFilter;
  });
  const filteredRelics = normalizedQuery
    ? scopedRelics.filter((item) => {
      const searchableText = [
        item.id, item.name, item.nickname, item.type, getTypeLabel(item.type, language, copy), item.body, getBodyLabel(item, language, copy),
        item.launchYear, item.landingDate, item.location?.siteName,
      ].filter(Boolean).join(' ').toLocaleLowerCase(language === 'ar' ? 'ar' : 'en');
      return searchableText.includes(normalizedQuery);
    })
    : scopedRelics;
  return (
    <div className="archive-list-view">
      <div className="panel-title-row">
        <div>
          <span className="eyebrow">{copy.archive}</span>
          <h2>{language === 'ar' ? 'المهمات' : 'MISSIONS'}</h2>
        </div>
        <span className="archive-count" aria-live="polite">{String(filteredRelics.length).padStart(2, '0')} <i>/ {relics.length}</i></span>
      </div>
      <div className="archive-summary">
        <span className="summary-line" />
        <p>{copy.hint}</p>
      </div>
      <div className="archive-category-filters" role="group" aria-label={language === 'ar' ? 'تصفية أرشيف المهمات' : 'Filter mission archive'}>
        {ARCHIVE_FILTERS.map(({ id, icon: Icon, en, ar }) => {
          const count = id === 'All'
            ? relics.length
            : id === '3D'
              ? relics.filter((item) => has3DRepresentation(item)).length
              : relics.filter((item) => item.body === id).length;
          return (
            <button type="button" key={id} className={`archive-filter-chip ${archiveFilter === id ? 'active' : ''}`} onClick={() => setArchiveFilter?.(id)} aria-pressed={archiveFilter === id}>
              <Icon size={12} /><span>{language === 'ar' ? ar : en}</span><small>{count}</small>
            </button>
          );
        })}
      </div>
      <div className="archive-search" role="search">
        <Search size={15} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.search}
          aria-label={copy.search}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        />
        {query && <button type="button" onClick={() => setQuery('')} aria-label={copy.clearSearch} title={copy.clearSearch}><X size={14} /></button>}
      </div>
      <div className="relic-list" role="list" aria-label={copy.archive}>
        {filteredRelics.map((item) => <div role="listitem" key={item.id}><RelicCard item={item} language={language} onSelect={onSelect} /></div>)}
        {filteredRelics.length === 0 && <div className="archive-empty"><Search size={18} /><span>{copy.noMatches}</span></div>}
      </div>
      <div className="archive-footnote"><span className="live-dot" />{copy.count}</div>
    </div>
  );
}

function MemoryRoom({ item, language, badges, onBack, onUnlock, hotspot, setHotspot, onStoryProgress, audioEnabled = true, autoPilotOn = false, setAutoPilotOn = () => {} }) {
  const copy = COPY[language] || COPY.en;
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [subtitleText, setSubtitleText] = useState('');
  const [activeBeat, setActiveBeat] = useState(0);
  const [tourRestartToken, setTourRestartToken] = useState(0);
  const transmissionRef = useRef(null);
  const playbackTokenRef = useRef(0);
  const subtitleTimerRef = useRef(0);
  const tourRunRef = useRef(0);
  const tourDelayCancelRef = useRef(null);
  const activeBeatRef = useRef(0);
  const isArabic = language === 'ar';
  const storyLanguage = item.story?.[language] ? language : 'en';
  const storyText = item.story?.[storyLanguage] || '';
  const storyBeats = splitStoryBeats(storyText);
  const questions = item.interactiveQA || [];
  const timeline = useMemo(() => item.timeline || [], [item.timeline]);
  const quiz = item.quiz || {};
  const options = quiz.options?.[language] || quiz.options?.en || [];
  const { idText, urls } = getSources(item.nasaSource);
  const siteName = item.location?.siteName || copy.noLocation;
  const position = getTelemetryPosition(item, copy);
  const hardwareHotspots = useMemo(() => (item.hotspots || []).slice(0, 3), [item.hotspots]);
  const activeHotspot = hardwareHotspots.find((spot) => sameHotspot(hotspot, spot));

  useEffect(() => {
    setActiveQuestion(null);
    setSelectedAnswer(null);
    setQuizResult('');
    setSubtitleText('');
    setActiveBeat(0);
    return () => {
      tourRunRef.current += 1;
      tourDelayCancelRef.current?.();
      tourDelayCancelRef.current = null;
      playbackTokenRef.current += 1;
      window.clearTimeout(subtitleTimerRef.current);
      transmissionRef.current?.();
      transmissionRef.current = null;
    };
  }, [item.id]);

  useEffect(() => {
    activeBeatRef.current = activeBeat;
  }, [activeBeat]);

  useEffect(() => {
    const chapters = [...(document.querySelectorAll('.story-mode .story-chapter[data-story-chapter]'))];
    if (!chapters.length) return undefined;
    const storyPane = document.querySelector('.story-mode .mission-story-scroll');
    let animationFrame = 0;
    const updateActiveBeat = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        const paneRect = storyPane?.getBoundingClientRect();
        const paneScrolls = storyPane && getComputedStyle(storyPane).overflowY === 'auto';
        const focusY = paneScrolls && paneRect
          ? paneRect.top + paneRect.height * 0.5
          : window.innerHeight * 0.53;
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        chapters.forEach((chapter, index) => {
          const rect = chapter.getBoundingClientRect();
          const distance = rect.top <= focusY && rect.bottom >= focusY
            ? 0
            : Math.min(Math.abs(rect.top - focusY), Math.abs(rect.bottom - focusY));
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });
        setActiveBeat(nearestIndex);
        const activeChapter = chapters[nearestIndex];
        const hotspotIndex = activeChapter?.dataset.hotspotIndex;
        setHotspot?.(hotspotIndex == null ? null : hardwareHotspots[Number(hotspotIndex)] || null);
        onStoryProgress?.({ index: nearestIndex, total: chapters.length, chapter: activeChapter?.dataset.storyChapter || 'hero' });
      });
    };
    updateActiveBeat();
    window.addEventListener('scroll', updateActiveBeat, { passive: true });
    storyPane?.addEventListener('scroll', updateActiveBeat, { passive: true });
    window.addEventListener('resize', updateActiveBeat);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', updateActiveBeat);
      storyPane?.removeEventListener('scroll', updateActiveBeat);
      window.removeEventListener('resize', updateActiveBeat);
    };
  }, [hardwareHotspots.length, item.id, onStoryProgress, setHotspot]);

  const stopAudio = useCallback((pauseTour = false) => {
    playbackTokenRef.current += 1;
    transmissionRef.current?.();
    transmissionRef.current = null;
    setIsTransmitting(false);
    setSubtitleText('');
    window.clearTimeout(subtitleTimerRef.current);
    if (pauseTour) {
      tourRunRef.current += 1;
      tourDelayCancelRef.current?.();
      tourDelayCancelRef.current = null;
      setAutoPilotOn(false);
    }
  }, [setAutoPilotOn]);

  useEffect(() => {
    if (!audioEnabled) stopAudio(false);
  }, [audioEnabled, stopAudio]);

  useEffect(() => {
    if (!autoPilotOn && isTransmitting) stopAudio(false);
  }, [autoPilotOn, isTransmitting, stopAudio]);

  const playAudio = useCallback((text, speechLanguage = language) => {
    if (!audioEnabled || !text) return Promise.resolve();
    const token = playbackTokenRef.current + 1;
    playbackTokenRef.current = token;
    transmissionRef.current?.();
    transmissionRef.current = null;
    window.clearTimeout(subtitleTimerRef.current);
    setSubtitleText('');
    setIsTransmitting(true);
    return new Promise((resolve) => {
      let settled = false;
      const complete = () => {
        if (settled) return;
        settled = true;
        if (playbackTokenRef.current === token) {
          setIsTransmitting(false);
          transmissionRef.current = null;
          subtitleTimerRef.current = window.setTimeout(() => setSubtitleText(''), 2800);
        }
        resolve();
      };
      transmissionRef.current = transmitText(
        text,
        speechLanguage,
        complete,
        (visibleText) => {
          if (playbackTokenRef.current === token) setSubtitleText(visibleText);
        },
      );
    });
  }, [audioEnabled, language]);

  const submitQuiz = () => {
    if (selectedAnswer === null) return;
    if (selectedAnswer === quiz.correctAnswer) {
      const alreadyUnlocked = badges.has(item.id);
      setQuizResult(alreadyUnlocked ? 'already' : 'unlocked');
      if (!alreadyUnlocked) {
        confetti({ particleCount: 82, spread: 68, startVelocity: 28, origin: { y: 0.72 }, colors: ['#06b6d4', '#c8ff6b', '#ffffff', '#f59e0b'], disableForReducedMotion: true });
        onUnlock(item.id);
      }
    } else {
      setQuizResult('wrong');
    }
  };

  const storyChapters = useMemo(() => [
    { id: 'hero', label: isArabic ? 'البداية' : 'START' },
    { id: 'transmission', label: isArabic ? 'القصة' : 'STORY' },
    ...hardwareHotspots.map((spot, index) => ({ id: `hardware-${index}`, label: getHardwareChapterLabel(spot, index, language), title: spot.part || spot.title, hotspotIndex: index })),
    { id: 'timeline', label: isArabic ? 'الرحلة' : 'JOURNEY' },
    { id: 'quiz', label: isArabic ? 'سؤال سريع' : 'QUICK QUIZ' },
  ], [hardwareHotspots, isArabic, language]);
  const scrollToChapter = useCallback((chapterId) => {
    document.getElementById(`mission-chapter-${chapterId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const tourSteps = useMemo(() => {
    const localized = (value, preferredLanguage = language) => typeof value === 'string' ? value : value?.[preferredLanguage] || value?.en || '';
    const missionName = item.nickname || item.name;
    const launchYear = item.launchYear ? String(item.launchYear) : '';
    const intro = isArabic
      ? `نبدأ جولتنا مع ${missionName}${launchYear ? `، التي انطلقت عام ${launchYear}` : ''}. سنتعرف إلى قصتها وأجزائها ومراحل رحلتها.`
      : `Welcome to ${missionName}${launchYear ? `, launched in ${launchYear}` : ''}. We will explore its story, key hardware, and mission timeline.`;
    const timelineLanguage = isArabic && timeline.some((step) => typeof step.event === 'string' || !step.event?.ar) ? 'en' : language;
    const timelineText = timeline
      .map((step) => `${step.year ? `${step.year}: ` : ''}${localized(step.event, timelineLanguage)}`.trim().replace(/[.。]+$/, ''))
      .filter((text) => text && !/^\d+:?$/.test(text))
      .join('. ');
    const timelineIntro = timelineLanguage === 'ar' ? 'والآن نستعرض أهم مراحل الرحلة.' : 'Now, let us follow the mission timeline.';
    const quizLanguage = isArabic && !quiz.question?.ar ? 'en' : language;
    const question = localized(quiz.question, quizLanguage) || (quizLanguage === 'ar' ? 'ما الذي تعلمته عن هذه المهمة؟' : 'What did you learn about this mission?');

    return [
      { id: 'hero', text: intro },
      { id: 'transmission', text: storyText, speechLanguage: storyLanguage },
      ...hardwareHotspots.map((spot, index) => {
        const hardwareHasArabic = Boolean(spot.partAr || spot.titleAr || spot.descriptionAr)
          || (typeof spot.description === 'object' && Boolean(spot.description?.ar));
        const speechLanguage = isArabic && !hardwareHasArabic ? 'en' : language;
        const part = speechLanguage === 'ar'
          ? spot.partAr || spot.titleAr || localized(spot.part, speechLanguage) || localized(spot.title, speechLanguage)
          : localized(spot.part, 'en') || localized(spot.title, 'en');
        const detail = speechLanguage === 'ar'
          ? localized(spot.descriptionAr || spot.description, speechLanguage)
          : localized(spot.description, speechLanguage);
        return {
          id: `hardware-${index}`,
          text: speechLanguage === 'ar' ? `نركّز الآن على ${part}. ${detail}` : `Now examining ${part}. ${detail}`,
          speechLanguage,
        };
      }),
      { id: 'timeline', text: `${timelineIntro} ${timelineText}`.trim(), speechLanguage: timelineLanguage },
      { id: 'quiz', text: quizLanguage === 'ar' ? `وصلنا إلى السؤال السريع. ${question}` : `We have reached the quick quiz. ${question}`, speechLanguage: quizLanguage },
    ];
  }, [hardwareHotspots, isArabic, item.launchYear, item.name, item.nickname, language, quiz.question, storyLanguage, storyText, timeline]);

  useEffect(() => {
    if (!autoPilotOn || tourSteps.length === 0) return undefined;
    const runId = ++tourRunRef.current;
    let active = true;
    const isCurrentRun = () => active && tourRunRef.current === runId;
    const wait = (duration) => new Promise((resolve) => {
      let timer = 0;
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        if (tourDelayCancelRef.current === cancel) tourDelayCancelRef.current = null;
        resolve();
      };
      const cancel = () => finish();
      timer = window.setTimeout(finish, duration);
      tourDelayCancelRef.current = cancel;
    });

    const runTour = async () => {
      const startIndex = Math.min(Math.max(0, activeBeatRef.current), tourSteps.length - 1);
      for (let index = startIndex; index < tourSteps.length; index += 1) {
        if (!isCurrentRun()) return;
        const step = tourSteps[index];
        scrollToChapter(step.id);
        await wait(720);
        if (!isCurrentRun()) return;
        if (step.text) await playAudio(step.text, step.speechLanguage || language);
        else await wait(700);
        if (!isCurrentRun()) return;
      }
      if (isCurrentRun()) setAutoPilotOn(false);
    };

    runTour();
    return () => {
      active = false;
      if (tourRunRef.current === runId) tourRunRef.current += 1;
      tourDelayCancelRef.current?.();
      tourDelayCancelRef.current = null;
      stopAudio(false);
    };
  }, [autoPilotOn, language, playAudio, scrollToChapter, setAutoPilotOn, stopAudio, tourRestartToken, tourSteps]);

  useEffect(() => {
    if (!autoPilotOn) return undefined;
    const pauseForManualInput = (event) => {
      const target = event.target instanceof Element ? event.target : event.target?.parentElement;
      if (target?.closest('.story-scroll-cue, .auto-pilot-hero-button, .transmit-button')) return;
      if (!target?.closest('.mission-story-scroll, .space-canvas-wrap')) return;
      setAutoPilotOn(false);
      stopAudio(false);
    };
    window.addEventListener('wheel', pauseForManualInput, { capture: true, passive: true });
    window.addEventListener('touchstart', pauseForManualInput, { capture: true, passive: true });
    window.addEventListener('pointerdown', pauseForManualInput, { capture: true, passive: true });
    return () => {
      window.removeEventListener('wheel', pauseForManualInput, true);
      window.removeEventListener('touchstart', pauseForManualInput, true);
      window.removeEventListener('pointerdown', pauseForManualInput, true);
    };
  }, [autoPilotOn, setAutoPilotOn, stopAudio]);

  const startTourFrom = (chapterId) => {
    const chapterIndex = storyChapters.findIndex((chapter) => chapter.id === chapterId);
    activeBeatRef.current = chapterIndex >= 0 ? chapterIndex : 0;
    scrollToChapter(chapterId);
    if (autoPilotOn) setTourRestartToken((token) => token + 1);
    else setAutoPilotOn(true);
  };

  const handleGuidedMission = () => {
    if (isTransmitting) {
      stopAudio(true);
      return;
    }
    if (autoPilotOn) setTourRestartToken((token) => token + 1);
    else setAutoPilotOn(true);
  };

  return (
    <div className="memory-room">
      <div className="memory-header">
        <button type="button" className="back-button" onClick={onBack}>
          {isArabic ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}<span>{copy.back}</span>
        </button>
        <span className="memory-status"><span />{copy.active}</span>
      </div>

      <nav className="story-chapter-nav" aria-label={isArabic ? 'فصول قصة المهمة' : 'Mission story chapters'}>
        <button type="button" className="story-nav-back" onClick={onBack} aria-label={copy.back}>
          {isArabic ? <ArrowRight size={13} /> : <ArrowLeft size={13} />}
          <span>{isArabic ? 'رجوع' : 'BACK'}</span>
        </button>
        {storyChapters.map(({ id, label, title, hotspotIndex }) => (
          <button
            key={id}
            type="button"
            className={activeBeat === storyChapters.findIndex((chapter) => chapter.id === id) ? 'is-active' : ''}
            onClick={() => {
              setAutoPilotOn(false);
              if (hotspotIndex != null) setHotspot?.(hardwareHotspots[hotspotIndex]);
              scrollToChapter(id);
            }}
            aria-current={activeBeat === storyChapters.findIndex((chapter) => chapter.id === id) ? 'step' : undefined}
            aria-label={hotspotIndex != null ? `${String(hotspotIndex + 1).padStart(2, '0')} ${title || label}` : label}
            title={title || label}
          >
            <i aria-hidden="true" /><span dir="auto">{label}</span>
          </button>
        ))}
      </nav>

      <div
        className="story-progress-rail"
        role="progressbar"
        aria-label={isArabic ? 'تقدم قصة المهمة' : 'Mission story progress'}
        aria-valuemin={1}
        aria-valuemax={storyChapters.length}
        aria-valuenow={Math.min(activeBeat + 1, storyChapters.length)}
        aria-valuetext={`${Math.min(activeBeat + 1, storyChapters.length)} / ${storyChapters.length}`}
      >
        <span>{String(Math.min(activeBeat + 1, storyChapters.length)).padStart(2, '0')}</span>
        <i aria-hidden="true"><b style={{ height: `${((Math.min(activeBeat + 1, storyChapters.length)) / storyChapters.length) * 100}%` }} /></i>
        <span>{String(storyChapters.length).padStart(2, '0')}</span>
      </div>

      <main className="mission-story-scroll">
        <section id="mission-chapter-hero" className="story-chapter story-hero" data-story-chapter="hero">
          <div className="story-hero-copy">
            <span className="memory-classification">{getBodyLabel(item, language, copy)} <i /> {getTypeLabel(item.type, language, copy)}</span>
            <p className="story-eyebrow">{isArabic ? 'قصة من أرشيف ناسا' : 'A NASA MISSION STORY'}</p>
            <h1 dir="auto">{item.nickname || item.name}</h1>
            <p className="story-hero-location"><MapPin size={14} /><span dir="auto">{siteName}</span></p>
            <div className="mission-hero-meta">
              <span><small>{isArabic ? 'سنة الإطلاق' : 'LAUNCH YEAR'}</small><strong dir="ltr">{item.launchYear}</strong></span>
              <span><small>{isArabic ? 'رقم المهمة' : 'NASA MISSION ID'}</small><strong dir="ltr">{idText}</strong></span>
              <span><small>{isArabic ? 'موقع المهمة' : 'MISSION SITE'}</small><strong dir="auto">{siteName}</strong></span>
            </div>
            <div className="story-hero-actions">
              <button
                type="button"
                className={`story-scroll-cue immersive-story-button ${autoPilotOn ? 'is-active' : ''}`}
                onClick={() => startTourFrom('hero')}
                aria-label={isArabic ? 'ابدأ القصة الغامرة مع التمرير التلقائي والصوت' : 'Start immersive story with auto-scroll and voice'}
                aria-pressed={autoPilotOn}
              >
                <span className="immersive-play-icon" aria-hidden="true"><Play size={14} fill="currentColor" /></span>
                <span className="immersive-button-copy">
                  <strong>{isArabic ? 'ابدأ القصة الغامرة' : 'START IMMERSIVE STORY'}</strong>
                  <small>{isArabic ? 'تمرير تلقائي + تعليق صوتي' : 'AUTO-SCROLL + VOICE'}</small>
                </span>
                <span className="immersive-soundwave" aria-hidden="true"><i /><i /><i /><i /><i /></span>
              </button>
              <button
                type="button"
                className={`auto-pilot-hero-button ${autoPilotOn ? 'is-active' : ''}`}
                onClick={() => startTourFrom('hero')}
                aria-label={isArabic ? 'تشغيل جولة الطيار الآلي من البداية' : 'Start the auto-pilot tour from the beginning'}
                aria-pressed={autoPilotOn}
              >
                <Clapperboard size={14} aria-hidden="true" />
                <span>{isArabic ? 'جولة الطيار الآلي' : 'AUTO-PILOT TOUR'}</span>
              </button>
            </div>
          </div>
          <span className="story-hero-record" dir="ltr">NASA ID / {idText}</span>
        </section>

        <section id="mission-chapter-transmission" className="story-chapter transmission-chapter" data-story-chapter="transmission">
          <div className="chapter-copy transmission-copy">
            <span className="story-kicker"><span className="signal-bars"><i /><i /><i /><i /></span>{copy.fieldNote}</span>
            <h2>{isArabic ? 'قصة المهمة' : 'THE MISSION STORY'}</h2>
            <p className="chapter-lede">{isArabic ? 'استمع إلى المركبة وهي تحكي رحلتها.' : 'Hear the spacecraft tell its journey.'}</p>
            <div className="story-transcript" dir="auto">
              {storyBeats.map((beat, index) => <p className="first-person-story" key={`${item.id}-transcript-${index}`}>“{beat}”</p>)}
            </div>
            <div className="transmit-row">
              <button type="button" className={`transmit-button ${isTransmitting ? 'transmitting' : ''}`} onClick={handleGuidedMission} aria-pressed={autoPilotOn} disabled={!audioEnabled}>
                {isTransmitting ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isTransmitting ? copy.stop : copy.transmit}</span>
                <span className="transmit-frequency" dir="auto">{copy.voice}</span>
              </button>
              {isTransmitting && (
                <span className="audio-visualizer" role="status" aria-live="polite" aria-label={copy.transmitting}>
                  <span className="audio-bars" aria-hidden="true"><i /><i /><i /><i /><i /></span>
                  <span className="audio-live" dir="ltr">{isArabic ? 'مباشر' : 'LIVE'}</span>
                </span>
              )}
            </div>
            {questions.length > 0 && (
              <div className="qa-section">
                <div className="section-label"><span>{copy.qa}</span><span className="section-rule" /></div>
                <div className="qa-list">
                  {questions.map((qa, index) => {
                    const question = qa.question?.[language] || qa.question?.en || '';
                    const answer = qa.answer?.[language] || qa.answer?.en || '';
                    const open = activeQuestion === index;
                    return (
                      <div className={`qa-item ${open ? 'open' : ''}`} key={`${item.id}-qa-${index}`}>
                        <button type="button" className="qa-question" onClick={() => {
                          setActiveQuestion(open ? null : index);
                          if (!open) playAudio(answer);
                        }}>
                          <span dir="auto">{question}</span><span className="qa-toggle">{open ? '−' : '+'}</span>
                        </button>
                        {open && <div className="qa-answer"><span>{copy.answer}</span><p dir="auto">{answer}</p><button type="button" onClick={() => playAudio(answer)} aria-label={copy.transmit} disabled={!audioEnabled}><Play size={13} /></button></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {hardwareHotspots.map((spot, index) => (
          <section
            id={`mission-chapter-hardware-${index}`}
            className={`story-chapter hardware-chapter hardware-side-${index % 2 === 0 ? 'right' : 'left'} ${activeBeat === index + 2 ? 'is-current' : ''}`}
            data-story-chapter={`hardware-${index}`}
            data-hotspot-index={index}
            key={`${item.id}-hardware-chapter-${index}`}
          >
            <div className="chapter-copy hardware-copy">
              <span className="hardware-kicker"><i aria-hidden="true" />{isArabic ? 'عن هذا الجزء' : 'ABOUT THIS PART'}</span>
              <h2 dir="auto">{isArabic ? spot.partAr || spot.titleAr || spot.part || spot.title : spot.part || spot.title}</h2>
              <h3 dir="auto">{isArabic ? spot.titleAr || spot.title || spot.part : spot.title || spot.part}</h3>
              <p dir="auto">{isArabic ? spot.descriptionAr || spot.description : spot.description}</p>
              <button type="button" className={`hardware-focus-button ${sameHotspot(hotspot, spot) ? 'is-active' : ''}`} onClick={() => setHotspot?.(spot)} aria-pressed={sameHotspot(hotspot, spot)}>
                <span className="hardware-focus-dot" aria-hidden="true" />{isArabic ? 'قرّب لعرض هذا الجزء' : 'ZOOM IN ON THIS PART'}
              </button>
            </div>
          </section>
        ))}

        <section id="mission-chapter-timeline" className="story-chapter mission-timeline-chapter" data-story-chapter="timeline">
          <div className="chapter-copy timeline-copy">
            <span className="story-kicker">{copy.milestones}</span>
            <h2>{isArabic ? 'رحلة المهمة' : 'THE MISSION JOURNEY'}</h2>
            <div className="mission-facts">
              <div><span>{copy.launch}</span><strong dir="ltr">{item.launchYear}</strong></div>
              <div><span>{copy.landing}</span><strong>{dateLabel(item.landingDate, language)}</strong></div>
              <div><span>{copy.end}</span><strong>{dateLabel(item.endOfMission, language)}</strong></div>
            </div>
            <div className="mission-timeline">
              {timeline.map((step, index) => (
                <div className="timeline-item" key={`${item.id}-timeline-${index}`}>
                  <span className="timeline-node"><i /></span>
                  <span className="timeline-year">{step.year}</span>
                  <p dir="auto">{step.event}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="mission-chapter-quiz" className="story-chapter quiz-chapter" data-story-chapter="quiz">
          <div className="chapter-copy quiz-copy">
            <span className="story-kicker">{copy.quizTitle}</span>
            <h2 dir="auto">{quiz.question?.[language] || quiz.question?.en || copy.quizHint}</h2>
            <p className="quiz-hint">{copy.choose}</p>
            <div className="quiz-options">
              {options.map((option, index) => (
                <button type="button" key={`${item.id}-option-${index}`} className={`quiz-option ${selectedAnswer === index ? 'selected' : ''} ${['unlocked', 'already'].includes(quizResult) && index === quiz.correctAnswer ? 'answer-correct' : ''}`} onClick={() => { setSelectedAnswer(index); setQuizResult(''); }}>
                  <span className="option-index" dir="ltr">{String.fromCharCode(65 + index)}</span><span dir="auto">{option}</span>{selectedAnswer === index && <Check size={15} />}
                </button>
              ))}
            </div>
            <button type="button" className="quiz-submit" onClick={submitQuiz} disabled={selectedAnswer === null}>
              {quizResult === 'wrong' ? <RotateCcw size={14} /> : <BadgeCheck size={15} />}
              <span>{quizResult === 'wrong' ? copy.wrong : copy.submit}</span>
            </button>
            {(quizResult === 'unlocked' || quizResult === 'already') && <div className="quiz-success" role="status"><BadgeCheck size={17} /><span>{quizResult === 'already' ? copy.already : copy.correct}</span></div>}
            {quizResult === 'wrong' && <div className="quiz-error">{copy.wrong}</div>}
            <div className="badge-reward"><span className="badge-reward-icon"><Sparkles size={16} /></span><span><small>{copy.badge}</small><strong dir="auto">{item.badgeName}</strong></span><span className={`badge-status ${badges.has(item.id) ? 'badge-unlocked' : 'badge-locked'}`}>{badges.has(item.id) ? copy.unlocked : copy.locked}</span></div>
            <div className="citation-footer">
              <div className="citation-heading"><span><RadioTower size={13} />{copy.citation}</span><span className="citation-id" dir={isArabic ? 'rtl' : 'ltr'}>{isArabic ? <>{copy.nssdca} <bdi dir="ltr">NSSDCA</bdi>: </> : `${copy.nssdca}: `}<bdi dir="ltr">{idText}</bdi></span></div>
              <div className="citation-links">
                {urls.slice(0, 3).map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={url}>{index === 0 ? copy.nasa : `${copy.sources} ${index + 1}`}<ArrowUpRight size={11} /></a>)}
                {urls.length === 0 && <span className="citation-missing">{copy.sources}</span>}
              </div>
            </div>
          </div>
        </section>
      </main>

      {(isTransmitting || subtitleText) && createPortal(
        <div className={`cinematic-subtitle-bar ${isTransmitting ? 'is-speaking' : ''}`} role="status" aria-live="polite" aria-atomic="false">
          <span className="subtitle-signal" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <p dir="auto">{subtitleText || copy.subtitleLoading}</p>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default function StoryAndArchivePanel(props) {
  if (props.selectedRelic) {
    return <MemoryRoom key={props.selectedRelic.id} item={props.selectedRelic} language={props.language} badges={props.badges} onBack={props.onBack} onUnlock={props.onUnlock} hotspot={props.hotspot} setHotspot={props.setHotspot} onStoryProgress={props.onStoryProgress} audioEnabled={props.audioEnabled} autoPilotOn={props.autoPilotOn} setAutoPilotOn={props.setAutoPilotOn} />;
  }
  return <ArchiveList relics={props.relics} language={props.language} onSelect={props.onSelect} archiveFilter={props.archiveFilter} setArchiveFilter={props.setArchiveFilter} />;
}
