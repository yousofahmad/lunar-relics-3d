import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Flame, Target, Timer, Trophy, X } from 'lucide-react';
import { playChallengeFanfare, playDiscoveryChime, playMissThud } from '../utils/audioEngine.js';

const ROUND_SECONDS = 24;
const TOTAL_ROUNDS = 5;
const OPTION_COUNT = 4;

const COPY = {
  en: {
    title: 'EXPLORER CHALLENGE',
    kicker: 'READ THE EVIDENCE',
    intro: 'Five clues, four missions each. The names are hidden — you have to recognise the mission from the evidence.',
    start: 'START THE HUNT',
    ask: 'Which mission does this describe?',
    round: 'ROUND',
    seconds: 's',
    hit: 'CORRECT!',
    miss: 'NOT THIS ONE',
    timeUp: 'TIME UP',
    points: 'PTS',
    streak: 'STREAK',
    doneTitle: 'MISSION COMPLETE',
    doneBody: 'You scored {score} points and reached a streak of {streak}.',
    again: 'PLAY AGAIN',
    exit: 'BACK TO ARCHIVE',
    hint: 'EVIDENCE',
    quit: 'Close challenge',
    answer: 'Answer',
    modeEvidence: 'EVIDENCE QUIZ',
    modeSequence: 'ORDER THE MISSION',
    seqIntro: 'Four moments from one mission, shuffled. Tap them in the order they happened.',
    seqAsk: 'Tap the moments in order — earliest first.',
    seqDone: 'SEQUENCE COMPLETE',
    seqRound: 'SEQUENCE',
    seqProgress: '\u200E{step}/4 in order\u200E',
    year: 'Year',
  },
  ar: {
    title: 'تحدي المستكشف',
    kicker: 'اقرأ الدليل',
    intro: 'خمسة أدلة، وأربع مهمات لكل دليل. الأسماء مخفية — لازم تعرف المهمة من الدليل نفسه.',
    start: 'ابدأ البحث',
    ask: 'أي مهمة يوصفها هذا الدليل؟',
    round: 'الجولة',
    seconds: 'ث',
    hit: 'صح!',
    miss: 'مش دي',
    timeUp: 'انتهى الوقت',
    points: 'نقطة',
    streak: 'متتالية',
    doneTitle: 'أكملت المهمة',
    doneBody: 'جمعت {score} نقطة ووصلت لسلسلة {streak}.',
    again: 'العب تاني',
    exit: 'رجوع للأرشيف',
    hint: 'الدليل',
    quit: 'إغلاق التحدي',
    answer: 'إجابة',
    modeEvidence: 'تحدي الأدلة',
    modeSequence: 'رتّب الرحلة',
    seqIntro: 'أربع لحظات من مهمة واحدة، مبعثرة. اضغطها بالترتيب اللي حصلت بيه.',
    seqAsk: 'اضغط اللحظات بالترتيب — الأقدم أولًا.',
    seqDone: 'تم الترتيب',
    seqRound: 'ترتيب',
    seqProgress: '\u200E{step}/4 بالترتيب\u200E',
    year: 'السنة',
  },
};

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function relicName(item, isArabic) {
  return isArabic ? item.nicknameAr || item.nameAr || item.nickname || item.name : item.nickname || item.name;
}

/** The clue must never contain the answer, so the mission name is masked out. */
function buildClue(item, isArabic) {
  const raw = (isArabic ? item.funFact?.ar || item.hook?.ar : item.funFact?.en || item.hook?.en) || '';
  const names = [item.nickname, item.name, item.nicknameAr, item.nameAr].filter(Boolean);
  let clue = raw;
  names.forEach((value) => {
    const escaped = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    clue = clue.replace(new RegExp(escaped, 'gi'), isArabic ? 'هذه المهمة' : 'this mission');
  });
  if (!clue.trim()) {
    clue = isArabic
      ? `مهمة ${item.body || ''} أُطلقت سنة ${item.launchYear || '—'}.`
      : `A ${item.body || ''} mission launched in ${item.launchYear || '—'}.`;
  }
  return clue.trim();
}

function buildRound(relics, used) {
  const pool = relics.filter((item) => !used.has(item.id));
  const source = pool.length >= OPTION_COUNT ? pool : relics;
  const picked = shuffle(source).slice(0, OPTION_COUNT);
  const target = picked[0];
  return {
    target,
    clue: buildClue(target, false),
    clueAr: buildClue(target, true),
    options: shuffle(picked).map((item) => item.id),
  };
}

function buildSequenceRound(relics, used) {
  const pool = relics.filter((item) => !used.has(item.id) && (item.timeline || []).length >= 4);
  const source = pool.length ? pool : relics.filter((item) => (item.timeline || []).length >= 4);
  if (!source.length) return null;
  const item = source[Math.floor(Math.random() * source.length)];
  const events = [...item.timeline]
    .map((entry, index) => ({ ...entry, index }))
    .sort((a, b) => String(a.year).localeCompare(String(b.year)) || a.index - b.index)
    .slice(0, 4);
  return { target: item, events, shuffled: shuffle(events.map((entry) => entry.index)) };
}

export default function ExplorerChallenge({ relics, language = 'en', onClose, onXp = () => {}, onViewChange = () => {} }) {
  const copy = COPY[language] || COPY.en;
  const isArabic = language === 'ar';
  const [mode, setMode] = useState('evidence');
  const [seq, setSeq] = useState(null);
  const [picked, setPicked] = useState([]);
  const [phase, setPhase] = useState('intro');
  const [round, setRound] = useState(0);
  const [rounds, setRounds] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [feedback, setFeedback] = useState('');
  const [chosen, setChosen] = useState(null);

  const timeLeftRef = useRef(ROUND_SECONDS);
  const lockedRef = useRef(false);
  const advanceRef = useRef(0);
  const byId = useMemo(() => new Map(relics.map((item) => [item.id, item])), [relics]);
  const current = rounds[round] || null;

  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const clearAdvance = () => {
    window.clearTimeout(advanceRef.current);
    advanceRef.current = 0;
  };

  const advance = useCallback(() => {
    clearAdvance();
    lockedRef.current = false;
    setChosen(null);
    setFeedback('');
    setTimeLeft(ROUND_SECONDS);
    setRound((index) => {
      if (index + 1 >= TOTAL_ROUNDS) {
        setPhase('done');
        return index;
      }
      return index + 1;
    });
  }, []);

  const startSequence = () => {
    clearAdvance();
    let next;
    let guard = 0;
    const used = new Set();
    do { next = buildSequenceRound(relics, used); guard += 1; } while (!next && guard < 6);
    if (!next) { setMode('evidence'); startGame(); return; }
    setMode('sequence');
    setSeq(next);
    setPicked([]);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setFeedback('');
    setTimeLeft(ROUND_SECONDS);
    timeLeftRef.current = ROUND_SECONDS;
    lockedRef.current = false;
    setPhase('playing');
    onViewChange(next.target.body || 'Moon');
  };

  const pickSequenceEvent = (index) => {
    if (!seq || lockedRef.current || feedback === 'time') return;
    if (picked.includes(index)) return;
    const next = [...picked, index];
    const expected = seq.events[next.length - 1].index;
    if (index !== expected) {
      setStreak(0);
      setFeedback('miss');
      playMissThud();
      setTimeLeft((value) => Math.max(0, value - 2));
      return;
    }
    setPicked(next);
    setFeedback('hit');
    playDiscoveryChime();
    const gained = 60 + streak * 15;
    setScore((value) => value + gained);
    onXp(gained);
    if (next.length === seq.events.length) {
      lockedRef.current = true;
      setStreak((value) => { const n = value + 1; setBestStreak((b) => Math.max(b, n)); return n; });
      advanceRef.current = window.setTimeout(() => {
        clearAdvance();
        lockedRef.current = false;
        setPicked([]);
        setFeedback('');
        setTimeLeft(ROUND_SECONDS);
        setPhase('done');
      }, 1400);
    }
  };

  const startGame = () => {
    clearAdvance();
    const used = new Set();
    const fresh = [];
    for (let i = 0; i < TOTAL_ROUNDS; i += 1) {
      const next = buildRound(relics, used);
      used.add(next.target.id);
      fresh.push(next);
    }
    setRounds(fresh);
    setRound(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setChosen(null);
    setFeedback('');
    setTimeLeft(ROUND_SECONDS);
    timeLeftRef.current = ROUND_SECONDS;
    lockedRef.current = false;
    setPhase('playing');
    if (fresh[0]) onViewChange(fresh[0].target.body || 'Moon');
  };

  useEffect(() => {
    if (phase !== 'playing' || !current) return undefined;
    onViewChange(current.target.body || 'Moon');
    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 0.1));
    }, 100);
    return () => window.clearInterval(timer);
  }, [phase, round, current, onViewChange]);

  useEffect(() => {
    if (phase !== 'playing' || timeLeft > 0 || lockedRef.current) return undefined;
    if (mode === 'sequence') { setFeedback('time'); setStreak(0); playMissThud(); advanceRef.current = window.setTimeout(() => { clearAdvance(); setPicked([]); setFeedback(''); setTimeLeft(ROUND_SECONDS); setPhase('done'); }, 1500); return () => window.clearTimeout(advanceRef.current); }
    setFeedback('time');
    setStreak(0);
    playMissThud();
    advanceRef.current = window.setTimeout(advance, 1600);
    return () => window.clearTimeout(advanceRef.current);
  }, [timeLeft, phase, advance]);

  useEffect(() => () => window.clearTimeout(advanceRef.current), []);

  const answer = (id) => {
    if (phase !== 'playing' || !current || lockedRef.current) return;
    setChosen(id);
    if (id === current.target.id) {
      lockedRef.current = true;
      const bonus = Math.round(timeLeftRef.current * 4) + streak * 25;
      const gained = 100 + bonus;
      setScore((value) => value + gained);
      onXp(gained);
      setStreak((value) => {
        const next = value + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });
      setFeedback('hit');
      playDiscoveryChime();
      advanceRef.current = window.setTimeout(advance, 1500);
      return;
    }
    setStreak(0);
    setFeedback('miss');
    playMissThud();
    setTimeLeft((value) => Math.max(0, value - 2));
  };

  useEffect(() => {
    if (phase !== 'done') return;
    playChallengeFanfare();
    confetti({ particleCount: 120, spread: 82, startVelocity: 34, origin: { y: 0.66 }, colors: ['#EAB308', '#FC3D21', '#22d3ee', '#ffffff'], disableForReducedMotion: true });
  }, [phase]);

  const progress = Math.max(0, Math.min(1, timeLeft / ROUND_SECONDS));

  return (
    <section className={`explorer-challenge ${feedback ? `is-${feedback}` : ''}`} aria-live="polite" dir={isArabic ? 'rtl' : 'ltr'}>
      <button type="button" className="explorer-close" onClick={onClose} aria-label={copy.quit}><X size={16} /></button>

      {phase === 'intro' && (
        <div className="explorer-intro">
          <span className="explorer-kicker"><Target size={13} /> {copy.kicker}</span>
          <h2>{copy.title}</h2>
          <p>{copy.intro}</p>
          <div className="explorer-stats">
            <span><Trophy size={13} /> {TOTAL_ROUNDS} {isArabic ? 'جولات' : 'ROUNDS'}</span>
            <span><Timer size={13} /> {ROUND_SECONDS}{copy.seconds}</span>
          </div>
          <p className="explorer-mode-note">{copy.seqIntro}</p>
          <div className="explorer-modes">
            <button type="button" className="explorer-primary" onClick={startGame}>{copy.modeEvidence}</button>
            <button type="button" className="explorer-secondary" onClick={startSequence}>{copy.modeSequence}</button>
          </div>
        </div>
      )}

      {phase === 'playing' && current && (
        <>
          <div className="explorer-head">
            <span className="explorer-kicker"><Target size={12} /> {copy.round} {round + 1}/{TOTAL_ROUNDS}</span>
            <span className="explorer-score"><Trophy size={12} /> {score} {copy.points}</span>
          </div>
          <p className="explorer-ask">{copy.ask}</p>
          <p className="explorer-clue" dir="auto">
            <b>{copy.hint}</b>
            <span>{isArabic ? current.clueAr : current.clue}</span>
          </p>
          <div className="explorer-options">
            {current.options.map((id, index) => {
              const item = byId.get(id);
              if (!item) return null;
              const isChosen = chosen === id;
              const isTarget = id === current.target.id;
              const state = feedback === 'hit' && isTarget ? 'is-correct' : isChosen && !isTarget ? 'is-wrong' : '';
              return (
                <button
                  key={id}
                  type="button"
                  className={`explorer-option ${state}`}
                  onClick={() => answer(id)}
                  disabled={lockedRef.current || feedback === 'time'}
                >
                  <em>{String.fromCharCode(65 + index)}</em>
                  <span dir="auto">{relicName(item, isArabic)}</span>
                  <small>{item.launchYear || ''}</small>
                </button>
              );
            })}
          </div>
          <div className="explorer-timer" role="progressbar" aria-valuemin={0} aria-valuemax={ROUND_SECONDS} aria-valuenow={Math.ceil(timeLeft)}>
            <i style={{ width: `${progress * 100}%` }} />
            <span>{Math.ceil(timeLeft)}{copy.seconds}</span>
          </div>
          <div className="explorer-foot">
            <span className={streak > 1 ? 'is-hot' : ''}><Flame size={12} /> {copy.streak} {streak}</span>
            {feedback === 'hit' && <strong className="explorer-flash is-good">{copy.hit}</strong>}
            {feedback === 'miss' && <strong className="explorer-flash is-bad">{copy.miss}</strong>}
            {feedback === 'time' && <strong className="explorer-flash is-bad">{copy.timeUp}</strong>}
          </div>
        </>
      )}

      {phase === 'playing' && mode === 'sequence' && seq && (
        <>
          <div className="explorer-head">
            <span className="explorer-kicker"><Target size={12} /> {copy.seqRound} · {seq.target.nickname || seq.target.name}</span>
            <span className="explorer-score"><Trophy size={12} /> {score} {copy.points}</span>
          </div>
          <p className="explorer-ask">{copy.seqAsk}</p>
          <div className="explorer-options">
            {seq.shuffled.map((eventIndex) => {
              const entry = seq.events.find((event) => event.index === eventIndex);
              const isPicked = picked.includes(eventIndex);
              const position = picked.indexOf(eventIndex) + 1;
              return (
                <button
                  key={eventIndex}
                  type="button"
                  className={`explorer-option ${isPicked ? 'is-correct' : ''}`}
                  onClick={() => pickSequenceEvent(eventIndex)}
                  disabled={isPicked || feedback === 'time'}
                >
                  <em>{isPicked ? position : '·'}</em>
                  <span dir="auto">{isArabic ? entry.eventAr || entry.event : entry.event}</span>
                  <small>{isPicked ? entry.year : copy.year}</small>
                </button>
              );
            })}
          </div>
          <div className="explorer-timer" role="progressbar" aria-valuemin={0} aria-valuemax={ROUND_SECONDS} aria-valuenow={Math.ceil(timeLeft)}>
            <i style={{ width: `${progress * 100}%` }} />
            <span>{Math.ceil(timeLeft)}{copy.seconds}</span>
          </div>
          <div className="explorer-foot">
            <span className={streak > 1 ? 'is-hot' : ''}><Flame size={12} /> {copy.streak} {streak}</span>
            <span>{copy.seqProgress.replace('{step}', String(picked.length))}</span>
            {feedback === 'hit' && <strong className="explorer-flash is-good">{copy.hit}</strong>}
            {feedback === 'miss' && <strong className="explorer-flash is-bad">{copy.miss}</strong>}
            {feedback === 'time' && <strong className="explorer-flash is-bad">{copy.timeUp}</strong>}
          </div>
        </>
      )}

      {phase === 'done' && (
        <div className="explorer-intro">
          <span className="explorer-kicker"><Trophy size={13} /> {copy.title}</span>
          <h2>{copy.doneTitle}</h2>
          <p>{copy.doneBody.replace('{score}', String(score)).replace('{streak}', String(bestStreak))}</p>
          <div className="explorer-stats">
            <span><Trophy size={13} /> {score} {copy.points}</span>
            <span><Flame size={13} /> {bestStreak} {copy.streak}</span>
          </div>
          <button type="button" className="explorer-primary" onClick={mode === 'sequence' ? startSequence : startGame}>{copy.again}</button>
          <button type="button" className="explorer-secondary" onClick={onClose}>{copy.exit}</button>
        </div>
      )}
    </section>
  );
}
