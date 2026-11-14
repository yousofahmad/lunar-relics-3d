import { Compass, List, Sparkles, Volume2, X } from 'lucide-react';

const CONTENT = {
  en: {
    eyebrow: 'MISSION UPDATE',
    title: "What's new",
    intro: 'Three quick ways to explore.',
    explore: 'Explore missions',
    items: [
      ['Open the archive', 'Search or filter missions, then pick one.'],
      ['Explore each story', 'Inspect the spacecraft and its highlighted parts.'],
      ['Keep sound in your control', 'Start or mute the soundscape any time.'],
    ],
  },
  ar: {
    eyebrow: 'تحديث المهمات',
    title: 'ما الجديد؟',
    intro: 'ثلاث خطوات بسيطة للاستكشاف.',
    explore: 'استكشف المهمات',
    items: [
      ['افتح الأرشيف', 'ابحث عن مهمة أو صفِّ القائمة، ثم اختر واحدة.'],
      ['استكشف القصة', 'افحص المركبة وأجزاءها المضيئة.'],
      ['تحكّم بالصوت', 'ابدأ الأجواء الصوتية أو اكتمها وقتما تشاء.'],
    ],
  },
};

const ITEM_ICONS = [List, Compass, Volume2];

export default function WhatsNewDialog({ language = 'en', onClose, onExplore }) {
  const copy = CONTENT[language] || CONTENT.en;
  const isArabic = language === 'ar';

  return (
    <div className="whats-new-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="whats-new-dialog" role="dialog" aria-modal="true" aria-labelledby="whats-new-title" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="whats-new-heading">
          <span className="whats-new-icon"><Sparkles size={18} /></span>
          <button type="button" className="whats-new-close" onClick={onClose} aria-label={isArabic ? 'إغلاق' : 'Close'}><X size={17} /></button>
          <span className="whats-new-eyebrow">{copy.eyebrow}</span>
          <h2 id="whats-new-title">{copy.title}</h2>
          <p>{copy.intro}</p>
        </div>
        <ul className="whats-new-list">
          {copy.items.map(([title, detail], index) => {
            const Icon = ITEM_ICONS[index];
            return <li key={title}><span className="whats-new-item-icon"><Icon size={15} /></span><span><strong>{title}</strong><small>{detail}</small></span></li>;
          })}
        </ul>
        <div className="whats-new-footer">
          <span><span className="whats-new-status-dot" />LUNAR RELICS 3D</span>
          <button type="button" onClick={onExplore}>{copy.explore}</button>
        </div>
      </section>
    </div>
  );
}
