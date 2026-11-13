import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Box, CalendarDays,
  CarFront, Check, CircleHelp, Clock3, Crosshair, Globe2, ListFilter, MapPin,
  Moon, Orbit, Play, Radio, RadioTower, Rocket, RotateCcw, Satellite, Search,
  Sparkles, Volume2, VolumeX, X,
} from 'lucide-react';
import { transmitText } from '../utils/radio.js';

const COPY = {
  en: {
    archive: 'MISSION ARCHIVE', count: 'RELICS IN DATABASE', hint: 'Select an artifact to open its memory room.',
    search: 'Search by name, mission, type or year', noMatches: 'No relics match your search.', clearSearch: 'Clear search',
    realModel: 'NASA GLB MODEL', proceduralModel: 'BUILT 3D MODEL',
    noLocation: 'Location coordinates unavailable', memory: 'MEMORY ROOM', back: 'BACK TO MAP',
    telemetry: 'MISSION TELEMETRY', record: 'RECORD ID(S)', coordinates: 'SURFACE COORDINATES', orbit: 'ORBIT / POSITION', positionUnavailable: 'Position not specified in the archive',
    hotspots: 'HARDWARE HOTSPOTS', hotspotHint: 'Select a point to inspect its function and fate.', hotspotDetail: 'ENGINEERING FUNCTION & FATE', locked: 'LOCKED', unlocked: 'UNLOCKED',
    mission: 'MISSION PROFILE', active: 'ARCHIVED', story: 'Story & Q&A', timeline: 'Timeline', quiz: 'Explorer Quiz',
    transmit: 'Listen to Transmission', transmitting: 'TRANSMITTING…', stop: 'Stop transmission', voice: 'NATURAL VOICE', subtitleLoading: 'RECEIVING TRANSMISSION…',
    fieldNote: 'FIELD TRANSMISSION', qa: 'ASK THE ARCHIVE', answer: 'ARCHIVE RESPONSE',
    milestones: 'MISSION MILESTONES', quizTitle: 'CHECK YOUR SIGNAL', choose: 'Select the correct answer to unlock this explorer badge.',
    submit: 'CONFIRM ANSWER', correct: 'SIGNAL VERIFIED — BADGE UNLOCKED', already: 'BADGE ALREADY IN YOUR ARCHIVE', wrong: 'SIGNAL MISMATCH — TRY AGAIN',
    badge: 'EXPLORER BADGE', citation: 'SOURCE ARCHIVE', nssdca: 'NSSDCA RECORD ID(S)', nasa: 'NASA ARCHIVE', sources: 'NASA SOURCES',
    launch: 'LAUNCH', landing: 'SURFACE ARRIVAL', end: 'LAST SIGNAL / END', site: 'MISSION SITE',
    category: 'MISSION CLASS', details: 'MISSION DETAILS', time: 'MISSION TIMELINE', quizHint: 'Choose an answer below.',
    open: 'OPEN MEMORY ROOM', deep: 'DEEP SPACE', moon: 'MOON', mars: 'MARS', lander: 'LANDER', rover: 'ROVER', scientific: 'SCIENTIFIC PACKAGE', probe: 'DEEP SPACE PROBE', rotorcraft: 'ROTORCRAFT', orbiter: 'ORBITER', impact: 'IMPACTOR',
  },
  ar: {
    archive: 'أرشيف المهمات', count: 'أثر في قاعدة البيانات', hint: 'اختر أثرًا لفتح غرفة ذاكرته.',
    search: 'ابحث بالاسم أو المهمة أو النوع أو السنة', noMatches: 'لا توجد آثار تطابق البحث.', clearSearch: 'مسح البحث',
    realModel: 'نموذج GLB من ناسا', proceduralModel: 'مجسم إجرائي ثلاثي الأبعاد',
    noLocation: 'إحداثيات الموقع غير متاحة', memory: 'غرفة الذاكرة', back: 'العودة إلى الخريطة',
    telemetry: 'بيانات المهمة', record: 'معرّف/معرّفات سجل', coordinates: 'إحداثيات السطح', orbit: 'المدار / الموقع', positionUnavailable: 'الموقع غير محدد في الأرشيف',
    hotspots: 'نقاط العتاد', hotspotHint: 'اختر نقطة لفحص وظيفتها ومصيرها.', hotspotDetail: 'الوظيفة الهندسية والمصير', locked: 'مقفلة', unlocked: 'مفتوحة',
    mission: 'ملف المهمة', active: 'مؤرشف', story: 'القصة والأسئلة', timeline: 'الخط الزمني', quiz: 'اختبار المستكشف',
    transmit: 'استمع إلى الإرسال', transmitting: 'جارٍ الإرسال…', stop: 'إيقاف الإرسال', voice: 'صوت طبيعي', subtitleLoading: 'جارٍ استقبال الإرسال…',
    fieldNote: 'إرسال من الميدان', qa: 'اسأل الأرشيف', answer: 'رد الأرشيف',
    milestones: 'محطات المهمة', quizTitle: 'تحقّق من الإشارة', choose: 'اختر الإجابة الصحيحة لفتح شارة المستكشف.',
    submit: 'تأكيد الإجابة', correct: 'تم التحقق من الإشارة — فُتحت الشارة', already: 'الشارة موجودة بالفعل في أرشيفك', wrong: 'الإشارة غير مطابقة — حاول مجددًا',
    badge: 'شارة المستكشف', citation: 'أرشيف المصدر', nssdca: 'معرّف/معرّفات سجل', nasa: 'أرشيف ناسا', sources: 'مصادر ناسا',
    launch: 'الإطلاق', landing: 'الوصول إلى السطح', end: 'آخر إشارة / نهاية المهمة', site: 'موقع المهمة',
    category: 'فئة المهمة', details: 'تفاصيل المهمة', time: 'الخط الزمني للمهمة', quizHint: 'اختر إجابة بالأسفل.',
    open: 'افتح غرفة الذاكرة', deep: 'الفضاء العميق', moon: 'القمر', mars: 'المريخ', lander: 'مسبار هبوط', rover: 'عربة جوالة', scientific: 'حزمة علمية', probe: 'مسبار فضائي', rotorcraft: 'مروحية', orbiter: 'مركبة مدارية', impact: 'مسبار اصطدام',
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

function getBodyLabel(item, language, copy) {
  if (item.body === 'Moon') return copy.moon;
  if (item.body === 'Mars') return copy.mars;
  return copy.deep;
}

function getTypeLabel(type, language, copy) {
  const normalized = (type || '').toLowerCase();
  if (language === 'ar') {
    if (normalized.includes('rover')) return copy.rover;
    if (normalized.includes('lander')) return copy.lander;
    if (normalized.includes('scientific')) return copy.scientific;
    if (normalized.includes('rotor')) return copy.rotorcraft;
    if (normalized.includes('orbiter')) return copy.orbiter;
    if (normalized.includes('impact')) return copy.impact;
    if (normalized.includes('probe')) return copy.probe;
  }
  return type.toUpperCase();
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
  const AssetIcon = item.has3DModel ? Box : Sparkles;
  const TypeIcon = getTypeIcon(item.type);
  const assetLabel = item.has3DModel ? copy.realModel : copy.proceduralModel;
  return (
    <button type="button" className="relic-card" onClick={() => onSelect(item)} aria-label={`${item.nickname || item.name} — ${assetLabel}`}>
      <span className={`relic-card-art ${item.has3DModel ? 'has-model' : 'is-procedural'}`} aria-hidden="true"><TypeIcon size={22} strokeWidth={1.6} /></span>
      <span className="relic-card-copy">
        <span className="relic-card-index">{item.launchYear} <i /> {getTypeLabel(item.type, language, copy)}</span>
        <span className="relic-card-title">{item.nickname || item.name}</span>
        <span className="relic-card-meta">
          <span>{getBodyLabel(item, language, copy)} · {item.landingDate ? dateLabel(item.landingDate, language) : item.launchYear}</span>
          <span className={`relic-card-model ${item.has3DModel ? 'has-model' : 'is-procedural'}`}><AssetIcon size={10} />{assetLabel}</span>
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
    if (archiveFilter === '3D') return Boolean(item.has3DModel && item.model3dFile);
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
          <h2>{language === 'ar' ? 'أرشيف المهمات' : 'MISSION ARCHIVE'}</h2>
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
              ? relics.filter((item) => item.has3DModel && item.model3dFile).length
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

function MemoryRoom({ item, language, badges, onBack, onUnlock, hotspot, setHotspot }) {
  const copy = COPY[language] || COPY.en;
  const [activeTab, setActiveTab] = useState('story');
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [subtitleText, setSubtitleText] = useState('');
  const transmissionRef = useRef(null);
  const playbackTokenRef = useRef(0);
  const subtitleTimerRef = useRef(0);
  const isArabic = language === 'ar';
  const storyText = item.story?.[language] || item.story?.en || '';
  const questions = item.interactiveQA || [];
  const timeline = item.timeline || [];
  const quiz = item.quiz || {};
  const options = quiz.options?.[language] || quiz.options?.en || [];
  const { idText, urls } = getSources(item.nasaSource);
  const siteName = item.location?.siteName || copy.noLocation;
  const position = getTelemetryPosition(item, copy);
  const hardwareHotspots = (item.hotspots || []).slice(0, 3);
  const activeHotspot = hardwareHotspots.find((spot) => sameHotspot(hotspot, spot));

  useEffect(() => {
    setActiveTab('story');
    setActiveQuestion(null);
    setSelectedAnswer(null);
    setQuizResult('');
    setSubtitleText('');
    return () => {
      playbackTokenRef.current += 1;
      window.clearTimeout(subtitleTimerRef.current);
      transmissionRef.current?.();
      transmissionRef.current = null;
    };
  }, [item.id]);

  const stopAudio = () => {
    playbackTokenRef.current += 1;
    transmissionRef.current?.();
    transmissionRef.current = null;
    setIsTransmitting(false);
    setSubtitleText('');
    window.clearTimeout(subtitleTimerRef.current);
  };

  const playAudio = (text) => {
    const token = playbackTokenRef.current + 1;
    playbackTokenRef.current = token;
    transmissionRef.current?.();
    transmissionRef.current = null;
    window.clearTimeout(subtitleTimerRef.current);
    setSubtitleText('');
    setIsTransmitting(true);
    transmissionRef.current = transmitText(
      text,
      language,
      () => {
        if (playbackTokenRef.current !== token) return;
        setIsTransmitting(false);
        transmissionRef.current = null;
        subtitleTimerRef.current = window.setTimeout(() => setSubtitleText(''), 2800);
      },
      (visibleText) => {
        if (playbackTokenRef.current === token) setSubtitleText(visibleText);
      },
    );
  };

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

  const tabs = [
    { id: 'story', label: copy.story, icon: Radio },
    { id: 'timeline', label: copy.timeline, icon: Clock3 },
    { id: 'quiz', label: copy.quiz, icon: CircleHelp },
  ];

  return (
    <div className="memory-room">
      <div className="memory-header">
        <button type="button" className="back-button" onClick={onBack}>
          {isArabic ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}<span>{copy.back}</span>
        </button>
        <span className="memory-status"><span />{copy.active}</span>
      </div>

      <div className="memory-identity">
        <span className="memory-classification">{getBodyLabel(item, language, copy)} <i /> {getTypeLabel(item.type, language, copy)}</span>
        <h2 dir="auto">{item.nickname || item.name}</h2>
        <div className="memory-location"><MapPin size={13} /><span dir="auto">{siteName}</span></div>
      </div>

      <section className="mission-telemetry" aria-label={copy.telemetry}>
        <div className="telemetry-heading"><Activity size={13} /><span>{copy.telemetry}</span><bdi dir="ltr">NSSDCA / DATA</bdi></div>
        <div className="telemetry-grid">
        <div className="telemetry-item"><span dir={isArabic ? 'rtl' : 'ltr'}>{isArabic ? <>{copy.record} <bdi dir="ltr">NSSDCA</bdi></> : <><bdi dir="ltr">NSSDCA</bdi> {copy.record}</>}</span><strong dir="ltr">{idText}</strong></div>
          <div className="telemetry-item telemetry-launch"><span>{copy.launch}</span><strong dir="ltr">{item.launchYear}</strong></div>
          <div className="telemetry-item telemetry-position"><span>{position.label}</span><strong dir={position.coordinates ? 'ltr' : 'auto'} title={position.value}>{position.value}</strong></div>
        </div>
      </section>

      <div className="mission-facts">
        <div><span>{copy.launch}</span><strong>{item.launchYear}</strong></div>
        <div><span>{copy.landing}</span><strong>{dateLabel(item.landingDate, language)}</strong></div>
        <div><span>{copy.end}</span><strong>{dateLabel(item.endOfMission, language)}</strong></div>
      </div>

      {hardwareHotspots.length > 0 && (
        <section className="memory-hotspots" aria-label={copy.hotspots}>
          <div className="hotspot-section-heading"><span>{copy.hotspots}</span><small>{copy.hotspotHint}</small></div>
          <div className="hotspot-pill-list" role="group" aria-label={copy.hotspots}>
            {hardwareHotspots.map((spot, index) => {
              const selected = sameHotspot(hotspot, spot);
              const part = spot.part || spot.title;
              return (
                <button
                  className={`hotspot-pill ${selected ? 'is-selected' : ''}`}
                  type="button"
                  key={`${item.id}-hotspot-pill-${index}`}
                  onClick={() => setHotspot?.(spot)}
                  aria-pressed={selected}
                  aria-label={`${isArabic ? 'نقطة عتاد' : 'Hardware point'} ${index + 1}: ${part}`}
                  title={spot.title || part}
                >
                  <span className="hotspot-pill-index" dir="ltr">{String(index + 1).padStart(2, '0')}</span>
                  <span dir="auto">{part}</span>
                </button>
              );
            })}
          </div>
          {activeHotspot && (
            <div className="hotspot-detail" id="hotspot-detail" role="status" aria-live="polite">
              <div className="hotspot-detail-heading"><span>{copy.hotspotDetail}</span><strong dir="auto">{activeHotspot.title || activeHotspot.part}</strong></div>
              <p dir="auto">{activeHotspot.description}</p>
            </div>
          )}
        </section>
      )}

      <div className="memory-tabs" role="tablist" aria-label={copy.details}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button type="button" role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)} key={id}>
            <Icon size={14} /><span>{label}</span>
          </button>
        ))}
      </div>

      <div className="memory-content" key={`${item.id}-${activeTab}`}>
        {activeTab === 'story' && (
          <div className="story-view">
            <div className="story-kicker"><span className="signal-bars"><i /><i /><i /><i /></span>{copy.fieldNote}</div>
            <p className="first-person-story" dir="auto">“{storyText}”</p>
            <div className="transmit-row">
              <button type="button" className={`transmit-button ${isTransmitting ? 'transmitting' : ''}`} onClick={() => isTransmitting ? stopAudio() : playAudio(storyText)} aria-pressed={isTransmitting}>
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
                      {open && <div className="qa-answer"><span>{copy.answer}</span><p dir="auto">{answer}</p><button type="button" onClick={() => playAudio(answer)} aria-label={copy.transmit}><Play size={13} /></button></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="timeline-view">
            <div className="section-label"><span>{copy.milestones}</span><span className="section-rule" /></div>
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
        )}

        {activeTab === 'quiz' && (
          <div className="quiz-view">
            <div className="quiz-orbit" aria-hidden="true"><Sparkles size={18} /></div>
            <span className="story-kicker">{copy.quizTitle}</span>
            <h3 dir="auto">{quiz.question?.[language] || quiz.question?.en}</h3>
            <p className="quiz-hint">{copy.choose}</p>
            <div className="quiz-options">
              {options.map((option, index) => (
                <button type="button" key={`${item.id}-option-${index}`} className={`quiz-option ${selectedAnswer === index ? 'selected' : ''} ${['unlocked', 'already'].includes(quizResult) && index === quiz.correctAnswer ? 'answer-correct' : ''}`} onClick={() => { setSelectedAnswer(index); setQuizResult(''); }}>
                  <span className="option-index" dir="ltr">0{index + 1}</span><span dir="auto">{option}</span>{selectedAnswer === index && <Check size={15} />}
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
          </div>
        )}
      </div>

      <div className="citation-footer">
        <div className="citation-heading"><span><RadioTower size={13} />{copy.citation}</span><span className="citation-id" dir={isArabic ? 'rtl' : 'ltr'}>{isArabic ? <>{copy.nssdca} <bdi dir="ltr">NSSDCA</bdi>: </> : `${copy.nssdca}: `}<bdi dir="ltr">{idText}</bdi></span></div>
        <div className="citation-links">
          {urls.slice(0, 3).map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={url}>{index === 0 ? copy.nasa : `${copy.sources} ${index + 1}`}<ArrowUpRight size={11} /></a>)}
          {urls.length === 0 && <span className="citation-missing">{copy.sources}</span>}
        </div>
      </div>
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
    return <MemoryRoom key={props.selectedRelic.id} item={props.selectedRelic} language={props.language} badges={props.badges} onBack={props.onBack} onUnlock={props.onUnlock} hotspot={props.hotspot} setHotspot={props.setHotspot} />;
  }
  return <ArchiveList relics={props.relics} language={props.language} onSelect={props.onSelect} archiveFilter={props.archiveFilter} setArchiveFilter={props.setArchiveFilter} />;
}
