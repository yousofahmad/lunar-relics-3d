import { useEffect, useRef } from 'react';
import { ArrowUpRight, BadgeCheck, LockKeyhole, Trophy, X } from 'lucide-react';

function bodyLabel(item, isArabic) {
  if (item.body === 'Moon') return isArabic ? 'القمر' : 'MOON';
  if (item.body === 'Mars') return isArabic ? 'المريخ' : 'MARS';
  return isArabic ? 'الفضاء العميق' : 'DEEP SPACE';
}

export default function BadgeModal({ relics, badges, language, onClose, onSelect }) {
  const dialogRef = useRef(null);
  const isArabic = language === 'ar';
  const unlockedCount = relics.filter((item) => badges.has(item.id)).length;
  const copy = isArabic
    ? {
        title: 'شارات المستكشف', close: 'إغلاق النافذة', progress: 'التقدم في الأرشيف',
        unlocked: 'مفتوحة', locked: 'مقفلة', unlockHint: 'أكمل اختبار هذه المركبة لفتح الشارة',
        openHint: 'اضغط لفتح غرفة الذاكرة',
      }
    : {
        title: 'EXPLORER BADGES', close: 'Close badges dialog', progress: 'ARCHIVE PROGRESS',
        unlocked: 'UNLOCKED', locked: 'LOCKED', unlockHint: 'Complete this spacecraft quiz to unlock',
        openHint: 'Open this relic’s memory room',
      };

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const focusableSelector = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
    const focusFirst = window.setTimeout(() => {
      dialogRef.current?.querySelector(focusableSelector)?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll(focusableSelector) || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusFirst);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="badge-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        id="badge-modal"
        ref={dialogRef}
        className="badge-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-modal-title"
        dir={isArabic ? 'rtl' : 'ltr'}
        tabIndex={-1}
      >
        <header className="badge-modal-header">
          <div className="badge-modal-heading">
            <span className="badge-modal-emblem" aria-hidden="true"><Trophy size={17} /></span>
            <div>
              <span className="badge-modal-kicker">{isArabic ? 'سجلّ الإنجاز' : 'EXPLORER ACHIEVEMENTS'}</span>
              <h2 id="badge-modal-title">{copy.title}</h2>
            </div>
          </div>
          <button className="badge-modal-close" type="button" onClick={onClose} aria-label={copy.close}>
            <X size={17} />
          </button>
        </header>

        <div className="badge-modal-progress">
          <div className="badge-progress-label">
            <span>{copy.progress}</span>
            <strong dir="ltr">{unlockedCount}<i> / {relics.length}</i></strong>
          </div>
          <div
            className="badge-progress-track"
            role="progressbar"
            aria-label={copy.progress}
            aria-valuemin={0}
            aria-valuemax={relics.length}
            aria-valuenow={unlockedCount}
          >
            <span style={{ width: `${relics.length ? (unlockedCount / relics.length) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="badge-modal-grid">
          {relics.map((item, index) => {
            const isUnlocked = badges.has(item.id);
            const relicName = item.nickname || item.name;
            const badgeName = (isArabic && item.badgeNameAr) || item.badgeName || relicName;
            return (
              <button
                className={`badge-modal-card ${isUnlocked ? 'is-unlocked' : 'is-locked'}`}
                type="button"
                key={item.id}
                onClick={() => onSelect(item)}
                aria-label={`${String(index + 1).padStart(2, '0')}. ${badgeName}. ${isUnlocked ? copy.openHint : `${copy.unlockHint}: ${relicName}`}`}
                title={isUnlocked ? copy.openHint : `${copy.unlockHint}: ${relicName}`}
              >
                <span className="badge-card-index" dir="ltr">{String(index + 1).padStart(2, '0')}</span>
                <span className="badge-card-icon" aria-hidden="true">
                  {isUnlocked ? <BadgeCheck size={20} /> : <LockKeyhole size={17} />}
                </span>
                <span className="badge-card-copy">
                  <span className="badge-card-body" dir="auto">{bodyLabel(item, isArabic)}</span>
                  <strong className="badge-card-name" dir="auto">{badgeName}</strong>
                  <span className="badge-card-relic" dir="auto">{relicName}</span>
                  <span className="badge-card-hint" dir="auto">
                    {isUnlocked ? copy.openHint : copy.unlockHint}
                  </span>
                </span>
                <span className={`badge-card-state ${isUnlocked ? 'state-unlocked' : 'state-locked'}`}>
                  {isUnlocked ? copy.unlocked : copy.locked}
                </span>
                <ArrowUpRight className="badge-card-arrow" size={14} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
