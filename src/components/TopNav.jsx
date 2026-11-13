import { Globe2, Languages, Moon, Orbit, Trophy } from 'lucide-react';

const FILTERS = [
  { id: 'Moon', icon: Moon, en: 'Moon', ar: 'القمر' },
  { id: 'Mars', icon: Globe2, en: 'Mars', ar: 'المريخ' },
  { id: 'Deep Space', icon: Orbit, en: 'Deep Space', ar: 'الفضاء العميق' },
  { id: 'All', icon: Orbit, en: 'All', ar: 'الكل' },
];

export default function TopNav({ filter, setFilter, language, setLanguage, relics, badges, onOpenBadges, badgesOpen }) {
  const countFor = (id) => (id === 'All' ? relics.length : relics.filter((item) => item.body === id).length);
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

      <nav className="planet-tabs" aria-label={language === 'ar' ? 'تصفية الأرشيف' : 'Filter archive'}>
        {FILTERS.map(({ id, icon: Icon, en, ar }) => (
          <button
            className={`planet-tab ${filter === id ? 'active' : ''}`}
            key={id}
            onClick={() => setFilter(id)}
            type="button"
            aria-pressed={filter === id}
          >
            <Icon size={15} strokeWidth={1.8} />
            <span>{language === 'ar' ? ar : en}</span>
            <small>{countFor(id)}</small>
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
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
