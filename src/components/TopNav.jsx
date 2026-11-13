import { Languages, RadioTower, Trophy, Volume2, VolumeX } from 'lucide-react';

const FILTER_LABELS = {
  All: { en: 'SOLAR SYSTEM', ar: 'النظام الشمسي' },
  Moon: { en: 'LUNAR SURFACE', ar: 'سطح القمر' },
  Mars: { en: 'MARS SURFACE', ar: 'سطح المريخ' },
  'Deep Space': { en: 'DEEP SPACE', ar: 'الفضاء العميق' },
  '3D Models': { en: '3D ARCHIVE', ar: 'أرشيف ثلاثي الأبعاد' },
};

export default function TopNav({ filter, language, setLanguage, relics, badges, onOpenBadges, badgesOpen, voiceEnabled = true, onToggleVoice = () => {}, apiState = 'local' }) {
  const isArabic = language === 'ar';
  const unlockedCount = relics.filter((item) => badges.has(item.id)).length;
  const activeSector = FILTER_LABELS[filter] || FILTER_LABELS.All;

  return (
    <header className="topbar glass-panel">
      <a className="brand-lockup" href="#mission-control" aria-label={isArabic ? 'العودة إلى مركز المهمة' : 'Mission control home'} onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
        <span className="brand-emblem" aria-hidden="true"><i /><i /><i /></span>
        <span className="brand-copy">
          <span className="brand-title">LUNAR <b>RELICS</b> <em>03</em></span>
          <span className="brand-subtitle">MISSION MEMORY ARCHIVE <i /> NSSDCA DATA</span>
        </span>
      </a>

      <div className="topbar-telemetry" aria-live="polite">
        <span className="topbar-signal"><RadioTower size={14} /><i />{isArabic ? 'رابط المهمة نشط' : 'MISSION LINK ACTIVE'}</span>
        <span className="topbar-divider" />
        <span className="topbar-sector"><small>{isArabic ? 'القطاع' : 'SECTOR'}</small><b dir="auto">{isArabic ? activeSector.ar : activeSector.en}</b></span>
        <span className="topbar-divider" />
        <span className="topbar-sector topbar-archive-state"><small>{isArabic ? 'الأرشيف' : 'ARCHIVE'}</small><b className={apiState === 'online' ? 'is-online' : ''}>{apiState === 'online' ? (isArabic ? 'متصل' : 'SYNCED') : (isArabic ? 'محلي' : 'LOCAL')}</b></span>
      </div>

      <div className="topbar-actions">
        <button type="button" className={`audio-hud-toggle ${voiceEnabled ? 'is-active' : ''}`} onClick={onToggleVoice} aria-pressed={voiceEnabled} aria-label={voiceEnabled ? (isArabic ? 'كتم الإرسال الصوتي' : 'Mute audio transmission') : (isArabic ? 'تشغيل الإرسال الصوتي' : 'Enable audio transmission')} title={voiceEnabled ? (isArabic ? 'كتم الصوت' : 'Mute audio') : (isArabic ? 'تشغيل الصوت' : 'Enable audio')}>
          {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}<span>{voiceEnabled ? (isArabic ? 'الصوت يعمل' : 'AUDIO ON') : (isArabic ? 'الصوت مكتوم' : 'MUTED')}</span>
        </button>
        <button type="button" className="language-toggle" onClick={() => setLanguage(isArabic ? 'en' : 'ar')} aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}>
          <Languages size={15} /><span>{isArabic ? 'EN' : 'عربي'}</span>
        </button>
        <button type="button" className="badge-counter" onClick={onOpenBadges} title={isArabic ? 'عرض شارات المستكشف' : 'View explorer badges'} aria-label={isArabic ? `عرض الشارات المفتوحة: ${unlockedCount} من ${relics.length}` : `View unlocked badges: ${unlockedCount} of ${relics.length}`} aria-haspopup="dialog" aria-expanded={Boolean(badgesOpen)} aria-controls="badge-modal">
          <Trophy size={15} /><span className="badge-label">{isArabic ? 'الشارات' : 'BADGES'}</span><strong dir="ltr">{unlockedCount}<em>/{relics.length}</em></strong>
        </button>
      </div>
    </header>
  );
}
