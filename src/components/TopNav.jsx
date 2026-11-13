import { Globe2, Languages, List, Moon, Orbit, Trophy, Volume2, VolumeX } from 'lucide-react';

const CELESTIAL_VIEWS = [
  { id: 'Moon', icon: Moon, en: 'THE MOON', ar: 'القمر', subEn: 'LUNA', subAr: 'LUNA' },
  { id: 'Mars', icon: Globe2, en: 'MARS', ar: 'المريخ', subEn: 'SURFACE', subAr: 'السطح' },
  { id: 'Deep Space', icon: Orbit, en: 'DEEP SPACE / ORBIT', ar: 'الفضاء العميق / المدار', subEn: 'MISSIONS', subAr: 'المهمات' },
];

export default function TopNav({ celestialView, setCelestialView, language, setLanguage, relics, badges, onOpenBadges, badgesOpen, storyMode = false, archiveOpen = true, onOpenMissions = () => {}, audioEnabled = true, onToggleAudio = () => {} }) {
  const unlockedCount = relics.filter((item) => badges.has(item.id)).length;

  return (
    <header className="topbar glass-panel">
      <div className="brand-lockup">
        <div className="brand-emblem" aria-hidden="true"><span /><span /><span /></div>
        <div>
          <div className="brand-title">LUNAR <b>RELICS</b> <span>3D</span></div>
          <div className="brand-subtitle">MISSION MEMORY ARCHIVE <i /> NSSDCA VERIFIED</div>
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
        <button
          type="button"
          className="audio-global-toggle"
          onClick={onToggleAudio}
          aria-pressed={audioEnabled}
          aria-label={audioEnabled ? (language === 'ar' ? 'كتم الإرسال الصوتي' : 'Mute audio transmission') : (language === 'ar' ? 'تشغيل الإرسال الصوتي' : 'Enable audio transmission')}
          title={audioEnabled ? (language === 'ar' ? 'كتم الصوت' : 'Mute audio') : (language === 'ar' ? 'تشغيل الصوت' : 'Enable audio')}
        >
          {audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          <span className="audio-label">{audioEnabled ? (language === 'ar' ? 'الصوت يعمل' : 'AUDIO ON') : (language === 'ar' ? 'مكتوم' : 'MUTED')}</span>
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
