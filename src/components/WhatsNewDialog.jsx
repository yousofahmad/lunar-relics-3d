import { BadgeCheck, ChevronLeft, Compass, RadioTower, ShieldCheck, Sparkles, X } from 'lucide-react';

const CONTENT = {
  en: {
    eyebrow: 'MISSION SYSTEM UPDATE',
    title: 'What’s new',
    intro: 'A clearer, more accurate way to explore all 16 mission relics.',
    close: 'Got it',
    changes: [
      ['Honest 3D labels', 'Each mission now says whether you are seeing its NASA mesh or a clearly identified class-representation model.'],
      ['Hardware-aware hotspots', 'Inspection points attach to named hardware when available, otherwise they are ray-projected onto the spacecraft surface.'],
      ['Purpose-built archetypes', 'Phoenix gains its solar wings; Apollo 15, ALSEP and Pioneer now have dedicated 3D hardware rather than an unrelated spacecraft mesh.'],
      ['Real planetary locations', 'Deep Space shows the Moon and Mars with mission markers at their recorded latitude and longitude; unrelated floating models are removed and the planets shift away from the open mission list. Hover pauses rotation and larger markers are easier to select.'],
      ['Smoother planets and mission journey', 'The Moon and Mars texture seams are corrected, and the journey timeline has safer heading spacing and readable event cards.'],
      ['More audible space signals', 'Soft radar and telemetry pulses now join the ambient soundscape every few seconds.'],
    ],
  },
  ar: {
    eyebrow: 'تحديث نظام المهمات',
    title: 'ما الجديد؟',
    intro: 'طريقة أوضح وأدق لاستكشاف النماذج الستة عشر.',
    close: 'حسنًا',
    changes: [
      ['توضيح مصدر المجسم', 'تظهر الآن شارة تبيّن إن كان المجسم نموذج NASA للمهمة نفسها أم تمثيلًا هندسيًا من الفئة نفسها.'],
      ['نقاط فحص مرتبطة بالعتاد', 'تلتصق النقاط بأسماء أجزاء النموذج عند توفرها، وإلا تُسقَط على سطح المجسم من جهة الجزء المقصود.'],
      ['مجسمات مناسبة للمهمة', 'أُضيف جناحا Phoenix الشمسيان، وصارت Apollo 15 وALSEP وPioneer تملك هندسة مخصصة بدل مجسم مركبة غير ذات صلة.'],
      ['مواقع المهمات على الكواكب', 'يعرض مشهد الفضاء القمر والمريخ بنقاط المهمات ذات الإحداثيات المسجلة، من دون مجسمات عشوائية، ويزيح الكوكبين عن قائمة المهمات المفتوحة. يتوقف الدوران عند التحويم، وكبرت مساحة الضغط على النقاط.'],
      ['كواكب ورحلة أوضح', 'أُصلحت وصلتا خامتي القمر والمريخ، وأُضيف فراغ آمن فوق عناوين الرحلة وبطاقات مقروءة لمراحلها.'],
      ['إشارات فضائية مسموعة', 'تُسمع الآن نبضات رادار وقياس عن بُعد هادئة كل بضع ثوانٍ ضمن الأجواء الصوتية.'],
    ],
  },
};

export default function WhatsNewDialog({ language = 'en', onClose }) {
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
          {copy.changes.map(([title, detail], index) => {
            const Icon = [ShieldCheck, BadgeCheck, Compass, RadioTower, ChevronLeft, Sparkles][index];
            return <li key={title}><span className="whats-new-item-icon"><Icon size={15} /></span><span><strong>{title}</strong><small>{detail}</small></span></li>;
          })}
        </ul>
        <div className="whats-new-footer"><span><span className="whats-new-status-dot" />LUNAR RELICS 3D</span><button type="button" onClick={onClose}>{copy.close}</button></div>
      </section>
    </div>
  );
}
