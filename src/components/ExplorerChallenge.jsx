import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Flame, Target, Timer, Trophy, X } from 'lucide-react';
import { playChallengeFanfare, playDiscoveryChime, playMissThud } from '../utils/audioEngine.js';

const ROUND_SECONDS = 26;
const TOTAL_ROUNDS = 5;

const COPY = {
  en: {
    title: 'EXPLORER CHALLENGE',
    kicker: 'FIND THE RELIC',
    intro: 'Five missions are hiding on the map. Tap the right glowing dot before the clock runs out.',
    start: 'START THE HUNT',
    find: 'Find this relic',
    round: 'ROUND',
    seconds: 's',
    hit: 'FOUND IT!',
    miss: 'NOT THAT ONE',
    timeUp: 'TIME UP',
    points: 'PTS',
    streak: 'STREAK',
    next: 'NEXT CLUE',
    doneTitle: 'MISSION COMPLETE',
    doneBody: 'You explored {score} points of history.',
    again: 'PLAY AGAIN',
    exit: 'BACK TO ARCHIVE',
    hint: 'HINT',
    quit: 'Close challenge',
  },
  ar: {
    title: 'تحدي المستكشف',
    kicker: 'ابحث عن الأثر',
    intro: 'خمس مهمات مختبئة على الخريطة. اضغط على النقطة المضيئة الصحيحة قبل انتهاء الوقت.',
    start: 'ابدأ البحث',
    find: 'ابحث عن هذا الأثر',
    round: 'الجولة',
    seconds: 'ث',
    hit: 'لقيتها!',
    miss: 'مش دي',
    timeUp: 'انتهى الوقت',
    points: 'نقطة',
    streak: 'متتالية',
    next: 'الدليل التالي',
    doneTitle: 'أكملت المهمة',
    doneBody: 'جمعت {score} نقطة من التاريخ.',
    again: 'العب تاني',
    exit: 'رجوع للأرشيف',
    hint: 'تلميح',
    quit: 'إغلاق التحدي',
  },
};

function pickTargets(relics, count) {
  const pool = relics.filter((item) => item.body !== 'Deep Space');
  const source = pool.length >= count ? pool : relics;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function ExplorerChallenge({ relics, language = 'en', pick, onClose, onXp = () => {}, onViewChange = () => {} }) {
  const copy = COPY[language] || COPY.en;
  const isArabic = language === 'ar';
  const [phase, setPhase] = useState('intro');
  const [round, setRound] = useState(0);
  const [targets, setTargets] = useState(() => pickTargets(relics, TOTAL_ROUNDS));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [feedback, setFeedback] = useState('');
  const [earned, setEarned] = useState(0);
  const lastPickRef = useRef(null);
  const timerRef = useRef(0);

  const target = targets[round] || null;

  const nextRound = useCallback(() => {
    setFeedback('');
    setTimeLeft(ROUND_SECONDS);
    setRound((current) => {
      const next = current + 1;
      if (next >= targets.length) {
        setPhase('done');
        return current;
      }
      setPhase('playing');
      return next;
    });
  }, [targets.length]);

  const startGame = () => {
    const fresh = pickTargets(relics, TOTAL_ROUNDS);
    setTargets(fresh);
    setRound(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setEarned(0);
    setFeedback('');
    setTimeLeft(ROUND_SECONDS);
    setPhase('playing');
    if (fresh[0]) onViewChange(fresh[0].body || 'Moon');
  };

  useEffect(() => {
    if (phase !== 'playing' || !target) return undefined;
    onViewChange(target.body || 'Moon');
    timerRef.current = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 0.1) return 0;
        return Math.max(0, current - 0.1);
      });
    }, 100);
    return () => window.clearInterval(timerRef.current);
  }, [phase, round, target, onViewChange]);

  useEffect(() => {
    if (phase !== 'playing' || timeLeft > 0) return;
    setFeedback('time');
    setStreak(0);
    playMissThud();
    const timer = window.setTimeout(nextRound, 1400);
    return () => window.clearTimeout(timer);
  }, [timeLeft, phase, nextRound]);

  useEffect(() => {
    if (!pick || pick.nonce === lastPickRef.current) return;
    lastPickRef.current = pick.nonce;
    if (phase !== 'playing' || !target) return;
    if (pick.id === target.id) {
      const bonus = Math.round(timeLeft * 4) + streak * 25;
      const gained = 100 + bonus;
      setScore((current) => current + gained);
      setEarned((current) => current + gained);
      onXp(gained);
      setStreak((current) => {
        const next = current + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });
      setFeedback('hit');
      playDiscoveryChime();
      const timer = window.setTimeout(nextRound, 1500);
      return () => window.clearTimeout(timer);
    }
    setStreak(0);
    setTimeLeft((current) => Math.max(0, current - 3));
    setFeedback('miss');
    playMissThud();
    const timer = window.setTimeout(() => setFeedback(''), 900);
    return () => window.clearTimeout(timer);
  }, [pick, phase, target, timeLeft, streak, nextRound, onXp]);

  useEffect(() => {
    if (phase !== 'done') return;
    playChallengeFanfare();
    confetti({ particleCount: 120, spread: 82, startVelocity: 34, origin: { y: 0.66 }, colors: ['#EAB308', '#FC3D21', '#22d3ee', '#ffffff'], disableForReducedMotion: true });
  }, [phase]);

  const progress = useMemo(() => Math.max(0, Math.min(1, timeLeft / ROUND_SECONDS)), [timeLeft]);
  const name = target ? (isArabic ? target.nicknameAr || target.name : target.nickname || target.name) : '';
  const year = target?.launchYear || '';
  const bodyLabel = target?.body || '';

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
          <button type="button" className="explorer-primary" onClick={startGame}>{copy.start}</button>
        </div>
      )}

      {phase === 'playing' && target && (
        <>
          <div className="explorer-head">
            <span className="explorer-kicker"><Target size={12} /> {copy.round} {round + 1}/{targets.length}</span>
            <span className="explorer-score"><Trophy size={12} /> {score} {copy.points}</span>
          </div>
          <p className="explorer-ask">{copy.find}</p>
          <h2 className="explorer-target" dir="auto">{name}</h2>
          <p className="explorer-hint" dir="auto">
            <b>{copy.hint}</b> {bodyLabel} · {year}
          </p>
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

      {phase === 'done' && (
        <div className="explorer-intro">
          <span className="explorer-kicker"><Trophy size={13} /> {copy.title}</span>
          <h2>{copy.doneTitle}</h2>
          <p>{copy.doneBody.replace('{score}', String(score))}</p>
          <div className="explorer-stats">
            <span><Trophy size={13} /> {score} {copy.points}</span>
            <span><Flame size={13} /> {bestStreak} {copy.streak}</span>
          </div>
          <button type="button" className="explorer-primary" onClick={startGame}>{copy.again}</button>
          <button type="button" className="explorer-secondary" onClick={onClose}>{copy.exit}</button>
        </div>
      )}
    </section>
  );
}
