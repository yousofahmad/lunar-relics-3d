import { Clapperboard, Globe2, Languages, List, Moon, Orbit, Pause, Trophy, Volume2, VolumeX } from 'lucide-react';

const CELESTIAL_VIEWS = [
  { id: 'Moon', icon: Moon, en: 'MOON', ar: 'القمر', subEn: 'OUR MOON', subAr: 'قمرنا' },
  { id: 'Mars', icon: Globe2, en: 'MARS', ar: 'المريخ', subEn: 'RED PLANET', subAr: 'الكوكب الأحمر' },
  { id: 'Deep Space', icon: Orbit, en: 'SPACE', ar: 'الفضاء', subEn: 'MOON + MARS', subAr: 'القمر + المريخ' },
];

export default function TopNav({ celestialView, setCelestialView, language, setLanguage, relics, badges, onOpenBadges, badgesOpen, storyMode = false, archiveOpen = true, onOpenMissions = () => {}, audioEnabled = true, audioStarted = false, soundscape = 'Moon', onToggleAudio = () => {}, autoPilotOn = false, onToggleAutoPilot = () => {} }) {
  const unlockedCount = relics.filter((item) => badges.has(item.id)).length;
  const soundscapeLabels = soundscape === 'Mars'
    ? { full: language === 'ar' ? 'رياح المريخ' : 'Mars wind', compact: language === 'ar' ? 'المريخ' : 'Mars' }
    : soundscape === 'Deep Space'
      ? { full: language === 'ar' ? 'أجواء الفضاء' : 'Space ambience', compact: language === 'ar' ? 'الفضاء' : 'Space' }
      : { full: language === 'ar' ? 'أجواء القمر' : 'Moon ambience', compact: language === 'ar' ? 'القمر' : 'Moon' };
  const audioAction = !audioStarted && audioEnabled
    ? { full: language === 'ar' ? 'المس لبدء الصوت' : 'Tap to start', compact: language === 'ar' ? 'المس' : 'Tap' }
    : audioEnabled
      ? { full: language === 'ar' ? 'كتم' : 'Mute', compact: language === 'ar' ? 'كتم' : 'Mute' }
      : { full: language === 'ar' ? 'تشغيل' : 'Unmute', compact: language === 'ar' ? 'تشغيل' : 'Unmute' };

  return (
    <header className="topbar glass-panel">
      <div className="brand-lockup">
        <div className="brand-emblem" aria-hidden="true"><span /><span /><span /></div>
        <div>
          <div className="brand-title">LUNAR <b>RELICS</b> <span>3D</span></div>
          <div className="brand-subtitle">EXPLORE SPACE MISSIONS</div>
        </div>
      </div>

      <nav className="planet-tabs" aria-label={language === 'ar' ? 'اختر المشهد السماوي' : 'Select a celestial view'}>
        {CELESTIAL_VIEWS.map(({ id, icon: Icon, en, ar, subEn, subAr }) => (
          <button
            className={`planet-tab ${celestialView === id ? 'active' : ''} view-${id === 'Deep Space' ? 'deep-space' : id.toLowerCase()}`}
            key={id}
            onClick={() => setCelestialView(id)}
            type="button"
            aria-pressed={celestialView === id}
          >
            <Icon size={17} strokeWidth={1.8} />
            <span>{language === 'ar' ? ar : en}</span>
            <small>{language === 'ar' ? subAr : subEn}</small>
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        <button
          type="button"
          className={`mission-drawer-toggle ${archiveOpen && !storyMode ? 'is-open' : ''}`}
          onClick={onOpenMissions}
          aria-expanded={Boolean(archiveOpen && !storyMode)}
          aria-label={language === 'ar' ? `${storyMode ? 'العودة إلى' : archiveOpen ? 'إغلاق' : 'فتح'} أرشيف المهمات، ${relics.length} مهمة` : `${storyMode ? 'Return to' : archiveOpen ? 'Close' : 'Open'} ${relics.length}-mission archive`}
          title={language === 'ar' ? 'أرشيف المهمات' : 'Mission archive'}
        >
          <List size={15} />
          <span>{language === 'ar' ? 'المهمات' : 'MISSIONS'}</span>
          <strong dir="ltr">{relics.length}</strong>
        </button>
        {storyMode && (
          <button
            type="button"
            className={`auto-pilot-toggle ${autoPilotOn ? 'is-active' : ''}`}
            onClick={onToggleAutoPilot}
            aria-pressed={autoPilotOn}
            aria-label={language === 'ar' ? `الجولة الصوتية الآلية ${autoPilotOn ? 'مفعّلة' : 'متوقفة'}` : `Guided auto-pilot tour ${autoPilotOn ? 'on' : 'off'}`}
            title={language === 'ar' ? 'تشغيل أو إيقاف الجولة الموجّهة' : 'Start or pause the guided mission tour'}
          >
            {autoPilotOn ? <Pause size={14} /> : <Clapperboard size={14} />}
            <span>{language === 'ar' ? `جولة آلية · ${autoPilotOn ? 'تعمل' : 'متوقفة'}` : `AUTO-PILOT · ${autoPilotOn ? 'ON' : 'OFF'}`}</span>
            <i className="auto-pilot-wave" aria-hidden="true"><b /><b /><b /><b /></i>
          </button>
        )}
        <button
          type="button"
          className="audio-global-toggle"
          onClick={onToggleAudio}
          aria-pressed={audioEnabled}
          aria-label={!audioStarted && audioEnabled
            ? (language === 'ar' ? `المس لبدء ${soundscapeLabels.full}` : `Tap to start ${soundscapeLabels.full}`)
            : `${audioAction.full} ${soundscapeLabels.full}`}
          title={`${soundscapeLabels.full} · ${audioAction.full}`}
        >
          {audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          <span className="soundscape-label soundscape-full">{soundscapeLabels.full}</span>
          <span className="soundscape-label soundscape-compact">{soundscapeLabels.compact}</span>
          <span className="audio-label audio-action-full">{audioAction.full}</span>
          <span className="audio-label audio-action-compact">{audioAction.compact}</span>
        </button>
        <button
          type="button"
          className="language-toggle"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          <Languages size={15} />
          <span className={language === 'en' ? 'language-current' : ''}>EN</span>
          <i />
          <span className={language === 'ar' ? 'language-current arabic-label' : 'arabic-label'}>عربي</span>
        </button>
        <button
          type="button"
          className="badge-counter"
          onClick={onOpenBadges}
          title={language === 'ar' ? 'عرض شارات المستكشف' : 'View explorer badges'}
          aria-label={language === 'ar' ? `عرض الشارات المفتوحة: ${unlockedCount} من ${relics.length}` : `View unlocked badges: ${unlockedCount} of ${relics.length}`}
          aria-haspopup="dialog"
          aria-expanded={Boolean(badgesOpen)}
          aria-controls="badge-modal"
        >
          <Trophy size={16} />
          <span className="badge-label">{language === 'ar' ? 'الشارات' : 'BADGES'}</span>
          <strong>{unlockedCount}<em>/{relics.length}</em></strong>
        </button>
      </div>
    </header>
  );
}
