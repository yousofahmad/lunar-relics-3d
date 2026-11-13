import { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Box, CalendarDays,
  Check, CircleHelp, Clock3, MapPin, Radio, Search, Sparkles, Volume2, VolumeX, X,
} from 'lucide-react';

const COPY = {
  en: {
    archive: 'MISSION ARCHIVE', hint: 'Select a mission to open its memory room.', search: 'Search name, mission, type or year',
    noMatches: 'No missions match your search.', clearSearch: 'Clear search', realModel: '3D MODEL', hologram: 'HOLOGRAM',
    memory: 'MISSION FILE', back: 'MISSION DOCK', telemetry: 'MISSION TELEMETRY', record: 'NSSDCA ID', coordinates: 'SURFACE COORDINATES',
    orbit: 'ORBIT / POSITION', noLocation: 'Position not listed in the archive', story: 'Story', timeline: 'Timeline', hardware: 'Hardware', quiz: 'Mission quiz',
    transmit: 'Play transmission', stop: 'Stop transmission', fieldNote: 'FIELD TRANSMISSION', qa: 'ASK THE ARCHIVE', answer: 'ARCHIVE RESPONSE',
    milestones: 'MISSION MILESTONES', quizTitle: 'CHECK YOUR SIGNAL', choose: 'Choose the correct answer to unlock this explorer badge.',
    submit: 'CONFIRM ANSWER', correct: 'SIGNAL VERIFIED — BADGE UNLOCKED', already: 'BADGE ALREADY IN YOUR ARCHIVE', wrong: 'SIGNAL MISMATCH — TRY AGAIN',
    badge: 'EXPLORER BADGE', locked: 'LOCKED', unlocked: 'UNLOCKED', launch: 'LAUNCH', landing: 'SURFACE ARRIVAL', end: 'MISSION END',
    hotspots: 'HARDWARE HOTSPOTS', hotspotHint: 'Choose a marker to inspect its function and fate.', hotspotDetail: 'ENGINEERING FUNCTION & FATE', site: 'MISSION SITE',
    moon: 'MOON', mars: 'MARS', deep: 'DEEP SPACE', citation: 'SOURCE ARCHIVE', nasa: 'NASA ARCHIVE', sources: 'NASA SOURCE',
  },
  ar: {
    archive: 'أرشيف المهمات', hint: 'اختر مهمة لفتح ملفها.', search: 'ابحث بالاسم أو المهمة أو النوع أو السنة',
    noMatches: 'لا توجد مهمات تطابق البحث.', clearSearch: 'مسح البحث', realModel: 'نموذج ثلاثي الأبعاد', hologram: 'هولوغرام',
    memory: 'ملف المهمة', back: 'قائمة المهمات', telemetry: 'بيانات المهمة', record: 'معرّف NSSDCA', coordinates: 'إحداثيات السطح',
    orbit: 'المدار / الموقع', noLocation: 'الموقع غير مذكور في الأرشيف', story: 'القصة', timeline: 'الخط الزمني', hardware: 'العتاد', quiz: 'اختبار المهمة',
    transmit: 'تشغيل الإرسال', stop: 'إيقاف الإرسال', fieldNote: 'إرسال من الميدان', qa: 'اسأل الأرشيف', answer: 'رد الأرشيف',
    milestones: 'محطات المهمة', quizTitle: 'تحقّق من الإشارة', choose: 'اختر الإجابة الصحيحة لفتح شارة المستكشف.',
    submit: 'تأكيد الإجابة', correct: 'تم التحقق من الإشارة — فُتحت الشارة', already: 'الشارة موجودة بالفعل في أرشيفك', wrong: 'الإشارة غير مطابقة — حاول مجددًا',
    badge: 'شارة المستكشف', locked: 'مقفلة', unlocked: 'مفتوحة', launch: 'الإطلاق', landing: 'الوصول إلى السطح', end: 'نهاية المهمة',
    hotspots: 'نقاط العتاد', hotspotHint: 'اختر علامة لفحص وظيفتها ومصيرها.', hotspotDetail: 'الوظيفة الهندسية والمصير', site: 'موقع المهمة',
    moon: 'القمر', mars: 'المريخ', deep: 'الفضاء العميق', citation: 'أرشيف المصدر', nasa: 'أرشيف ناسا', sources: 'مصدر ناسا',
  },
};

function getSources(value = '') {
  const idText = value.match(/NSSDCA\)?\s+IDs?:\s*([^.]+)/i)?.[1]?.trim() || '—';
  const urls = [...new Set(value.match(/https?:\/\/[^\s;]+/g) || [])].map((url) => url.replace(/[.,]+$/, ''));
  return { idText, urls };
}

function dateLabel(value, language) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

function bodyLabel(item, copy) {
  if (item.body === 'Moon') return copy.moon;
  if (item.body === 'Mars') return copy.mars;
  return copy.deep;
}

function positionLabel(item, copy) {
  const { lat, lng, siteName } = item.location || {};
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const latitude = `${Math.abs(lat)}° ${lat < 0 ? 'S' : 'N'}`;
    const longitude = `${Math.abs(lng)}° ${lng < 0 ? 'W' : 'E'}`;
    return { label: copy.coordinates, value: `${latitude} · ${longitude}`, coordinates: true };
  }
  return { label: copy.orbit, value: siteName || copy.noLocation, coordinates: false };
}

function ArchiveList({ relics, language, onSelect }) {
  const copy = COPY[language] || COPY.en;
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(language === 'ar' ? 'ar' : 'en');
    if (!needle) return relics;
    return relics.filter((item) => [item.id, item.name, item.nickname, item.type, item.body, item.launchYear, item.landingDate, item.location?.siteName]
      .filter(Boolean).join(' ').toLocaleLowerCase(language === 'ar' ? 'ar' : 'en').includes(needle));
  }, [language, query, relics]);

  return (
    <div className="archive-list-view">
      <div className="panel-title-row">
        <div><span className="eyebrow">{copy.archive}</span><h2>{language === 'ar' ? 'سجلّ الاستكشاف' : 'EXPLORER LOG'}</h2></div>
        <span className="archive-count" aria-live="polite">{String(filtered.length).padStart(2, '0')} <i>/ {relics.length}</i></span>
      </div>
      <p className="archive-summary"><span className="summary-line" />{copy.hint}</p>
      <label className="archive-search">
        <Search size={15} aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} aria-label={copy.search} dir={language === 'ar' ? 'rtl' : 'ltr'} />
        {query && <button type="button" onClick={() => setQuery('')} aria-label={copy.clearSearch}><X size={14} /></button>}
      </label>
      <div className="relic-list" role="list" aria-label={copy.archive}>
        {filtered.map((item, index) => (
          <div role="listitem" key={item.id}>
            <button className="relic-card" type="button" onClick={() => onSelect(item)}>
              <span className={`relic-card-art ${item.has3DModel ? '' : 'is-hologram'}`} aria-hidden="true">{item.has3DModel ? <Box size={19} /> : <Sparkles size={19} />}</span>
              <span className="relic-card-copy">
                <span className="relic-card-index"><i /> {String(index + 1).padStart(2, '0')} · {item.type}</span>
                <span className="relic-card-title" dir="auto">{item.nickname || item.name}</span>
                <span className="relic-card-meta"><span>{bodyLabel(item, copy)} · {item.launchYear}</span><span className={`relic-card-model ${item.has3DModel ? '' : 'is-hologram'}`}>{item.has3DModel ? copy.realModel : copy.hologram}</span></span>
              </span>
              <span className="relic-card-arrow"><ArrowUpRight size={15} /></span>
            </button>
          </div>
        ))}
        {!filtered.length && <div className="archive-empty"><Search size={18} /><span>{copy.noMatches}</span></div>}
      </div>
      <div className="archive-footnote"><span className="live-dot" />{language === 'ar' ? 'أرشيف المهمات جاهز' : 'MISSION ARCHIVE READY'}</div>
    </div>
  );
}

function MemoryRoom({ item, language, badges, onBack, onUnlock, hotspot, setHotspot, isTransmitting, onTransmit, onStopAudio }) {
  const copy = COPY[language] || COPY.en;
  const [activeTab, setActiveTab] = useState('story');
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState('');
  const isArabic = language === 'ar';
  const storyText = item.story?.[language] || item.story?.en || '';
  const questions = item.interactiveQA || [];
  const timeline = item.timeline || [];
  const quiz = item.quiz || {};
  const options = quiz.options?.[language] || quiz.options?.en || [];
  const { idText, urls } = getSources(item.nasaSource);
  const location = item.location?.siteName || copy.noLocation;
  const position = positionLabel(item, copy);
  const hardware = (item.hotspots || []).slice(0, 3);

  const submitQuiz = () => {
    if (selectedAnswer === null) return;
    if (selectedAnswer === quiz.correctAnswer) {
      const alreadyUnlocked = badges.has(item.id);
      setQuizResult(alreadyUnlocked ? 'already' : 'unlocked');
      if (!alreadyUnlocked) {
        confetti({ particleCount: 82, spread: 68, startVelocity: 28, origin: { y: 0.72 }, colors: ['#42e8ff', '#c7ff72', '#ffffff', '#ffbe70'], disableForReducedMotion: true });
        onUnlock(item.id);
      }
    } else setQuizResult('wrong');
  };

  const tabs = [
    { id: 'story', label: copy.story, icon: Radio },
    { id: 'timeline', label: copy.timeline, icon: Clock3 },
    { id: 'hardware', label: copy.hardware, icon: Box },
    { id: 'quiz', label: copy.quiz, icon: CircleHelp },
  ];

  return (
    <div className="memory-room">
      <div className="memory-header">
        <button type="button" className="back-button" onClick={onBack}>{isArabic ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}<span>{copy.back}</span></button>
        <span className="memory-status"><span />{language === 'ar' ? 'مؤرشف' : 'ARCHIVED'}</span>
      </div>

      <div className="memory-identity">
        <span className="memory-classification">{bodyLabel(item, copy)} <i /> {item.type}</span>
        <h2 dir="auto">{item.nickname || item.name}</h2>
        <div className="memory-location"><MapPin size={13} /><span dir="auto">{location}</span></div>
      </div>

      <section className="mission-telemetry" aria-label={copy.telemetry}>
        <div className="telemetry-heading"><Activity size={13} /><span>{copy.telemetry}</span><bdi dir="ltr">NSSDCA / DATA</bdi></div>
        <div className="telemetry-grid">
          <div className="telemetry-item telemetry-id"><span>{copy.record}</span><strong dir="ltr">{idText}</strong></div>
          <div className="telemetry-item telemetry-launch"><span>{copy.launch}</span><strong dir="ltr">{item.launchYear}</strong></div>
          <div className="telemetry-item telemetry-position"><span>{position.label}</span><strong dir={position.coordinates ? 'ltr' : 'auto'} title={position.value}>{position.value}</strong></div>
        </div>
      </section>

      <div className="mission-facts">
        <div><span>{copy.launch}</span><strong dir="ltr">{item.launchYear || '—'}</strong></div>
        <div><span>{copy.landing}</span><strong>{dateLabel(item.landingDate, language)}</strong></div>
        <div><span>{copy.end}</span><strong>{dateLabel(item.endOfMission, language)}</strong></div>
      </div>

      <div className="memory-tabs" role="tablist" aria-label={copy.memory}>
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
              <button type="button" className={`transmit-button ${isTransmitting ? 'transmitting' : ''}`} onClick={() => isTransmitting ? onStopAudio() : onTransmit(storyText)} aria-pressed={isTransmitting}>
                {isTransmitting ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isTransmitting ? copy.stop : copy.transmit}</span>
              </button>
              <span className="audio-visualizer" aria-hidden="true"><span className="audio-bars"><i /><i /><i /><i /><i /><i /><i /></span></span>
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
                      <button type="button" className="qa-question" aria-expanded={open} onClick={() => { setActiveQuestion(open ? null : index); if (!open) onTransmit(answer); }}>
                        <span dir="auto">{question}</span><span className="qa-toggle">{open ? '−' : '+'}</span>
                      </button>
                      {open && <div className="qa-answer"><span>{copy.answer}</span><p dir="auto">{answer}</p><button type="button" onClick={() => onTransmit(answer)} aria-label={copy.transmit}><Volume2 size={13} /></button></div>}
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
              {timeline.map((step, index) => <div className="timeline-item" key={`${item.id}-timeline-${index}`}><span className="timeline-node"><i /></span><span className="timeline-year">{step.year}</span><p dir="auto">{step.event}</p></div>)}
            </div>
          </div>
        )}

        {activeTab === 'hardware' && (
          <section className="hardware-tab">
            <div className="section-label"><span>{copy.hotspots}</span><span className="section-rule" /></div>
            <p className="hardware-hint">{copy.hotspotHint}</p>
            {hardware.length ? <div className="hotspot-pill-list" role="group" aria-label={copy.hotspots}>
              {hardware.map((spot, index) => {
                const active = hotspot && ((spot.part && hotspot.part === spot.part) || (!spot.part && hotspot.title === spot.title));
                const part = spot.part || spot.title;
                return <button className={`hotspot-pill ${active ? 'is-selected' : ''}`} type="button" key={`${item.id}-hotspot-${index}`} onClick={() => setHotspot?.(active ? null : spot)} aria-pressed={Boolean(active)}><span className="hotspot-pill-index" dir="ltr">{String(index + 1).padStart(2, '0')}</span><span dir="auto">{part}</span></button>;
              })}
            </div> : <div className="archive-empty"><Box size={18} /><span>{language === 'ar' ? 'لا توجد نقاط عتاد مسجلة لهذه المهمة.' : 'No hardware markers are listed for this mission.'}</span></div>}
            {hotspot && hardware.some((spot) => spot.part === hotspot.part || spot.title === hotspot.title) && <div className="hotspot-detail" role="status" aria-live="polite"><div className="hotspot-detail-heading"><span>{copy.hotspotDetail}</span><strong dir="auto">{hotspot.title || hotspot.part}</strong></div><p dir="auto">{hotspot.description}</p></div>}
          </section>
        )}

        {activeTab === 'quiz' && (
          <div className="quiz-view">
            <div className="quiz-orbit" aria-hidden="true"><Sparkles size={18} /></div>
            <span className="story-kicker">{copy.quizTitle}</span>
            <h3 dir="auto">{quiz.question?.[language] || quiz.question?.en}</h3>
            <p className="quiz-hint">{copy.choose}</p>
            <div className="quiz-options">
              {options.map((option, index) => <button type="button" key={`${item.id}-option-${index}`} className={`quiz-option ${selectedAnswer === index ? 'selected' : ''} ${['unlocked', 'already'].includes(quizResult) && index === quiz.correctAnswer ? 'answer-correct' : ''}`} onClick={() => { setSelectedAnswer(index); setQuizResult(''); }}><span className="option-index" dir="ltr">0{index + 1}</span><span dir="auto">{option}</span>{selectedAnswer === index && <Check size={15} />}</button>)}
            </div>
            <button type="button" className="quiz-submit" onClick={submitQuiz} disabled={selectedAnswer === null}><BadgeCheck size={15} /><span>{quizResult === 'wrong' ? copy.wrong : copy.submit}</span></button>
            {(quizResult === 'unlocked' || quizResult === 'already') && <div className="quiz-success" role="status"><BadgeCheck size={17} /><span>{quizResult === 'already' ? copy.already : copy.correct}</span></div>}
            {quizResult === 'wrong' && <div className="quiz-error" role="status">{copy.wrong}</div>}
            <div className="badge-reward"><span className="badge-reward-icon"><Sparkles size={16} /></span><span><small>{copy.badge}</small><strong dir="auto">{item.badgeName || item.nickname || item.name}</strong></span><span className={`badge-status ${badges.has(item.id) ? 'badge-unlocked' : ''}`}>{badges.has(item.id) ? copy.unlocked : copy.locked}</span></div>
          </div>
        )}
      </div>

      <div className="citation-footer">
        <div className="citation-heading"><span><CalendarDays size={13} />{copy.citation}</span><span className="citation-id" dir="ltr">NSSDCA · {idText}</span></div>
        <div className="citation-links">
          {urls.slice(0, 3).map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={url}>{index === 0 ? copy.nasa : `${copy.sources} ${index + 1}`}<ArrowUpRight size={11} /></a>)}
          {!urls.length && <span className="citation-missing">NASA / NSSDCA</span>}
        </div>
      </div>
    </div>
  );
}

export default function StoryAndArchivePanel(props) {
  if (!props.selectedRelic) return <ArchiveList relics={props.relics} language={props.language} onSelect={props.onSelect} />;
  return <MemoryRoom key={props.selectedRelic.id} item={props.selectedRelic} language={props.language} badges={props.badges} onBack={props.onBack} onUnlock={props.onUnlock} hotspot={props.hotspot} setHotspot={props.setHotspot} isTransmitting={props.isTransmitting} onTransmit={props.onTransmit} onStopAudio={props.onStopAudio} />;
}
