import { BadgeCheck, ChevronLeft, Compass, Orbit, RadioTower, ShieldCheck, Sparkles, X } from 'lucide-react';

const CONTENT = {
  en: {
    eyebrow: 'MISSION SYSTEM UPDATE',
    title: 'What’s new',
    intro: 'A more reliable, immersive way to explore all 16 mission relics, including a four-craft deep-space orbit view.',
    close: 'Got it',
    changes: [
      ['Deep-space orbit archive', 'The renamed Deep Space / Orbit view brings Dawn, NEAR Shoemaker, Pioneer 10 & 11 and Kepler into a starfield with tappable 3D craft. Use the ORBIT 4 archive filter or a mission pin/name to open its existing story. Pioneer keeps its clearly identified in-house archetype because the archive has no Pioneer GLB.'],
      ['Seam-safe planetary maps', 'Moon and Mars maps now use a 32px horizontal edge blend and explicit linear sampling with mipmaps disabled to prevent the UV seam. Only the boundary strip of new derived maps is blended; the source maps and mission data are preserved, with no synthetic terrain noise.'],
      ['Tap every planet pin', 'Each Moon and Mars marker has a real 48px HTML touch target and a tappable name label. Back-side pins are hidden, and touching the canvas pauses rotation immediately.'],
      ['Quick mission carousel', 'Swipe through missions for the current view and open a story with one tap.'],
      ['Room to explore on mobile', 'The header is now one compact row, the mission drawer starts closed, and story cards stay in a scrollable 42% screen-height sheet below the lifted model.'],
      ['Stories with feeling, facts intact', 'Every relic and hardware part now has a more cinematic first-person story in English and Arabic, based on the mission facts already in the archive.'],
      ['One-tap continuous soundscape', 'Enter the archive to unlock a continuous cosmic ambience across every view, with changing radio, sonar, telemetry and planetary sounds; mute remains in the top bar.'],
      ['Honest 3D labels', 'Each mission says whether you are seeing its NASA mesh or a clearly identified class-representation model.'],
      ['Hardware-aware hotspots', 'Inspection points attach to named hardware when available, otherwise they are projected onto the spacecraft surface.'],
      ['Purpose-built archetypes', 'Phoenix gains its solar wings; Apollo 15, ALSEP and Pioneer have dedicated 3D hardware rather than an unrelated spacecraft mesh.'],
      ['Real planetary locations', 'The Moon and Mars show mission markers at recorded latitude and longitude; unrelated floating models are removed and the planets shift away from the open mission list.'],
      ['Smoother planets and mission journey', 'The Moon and Mars texture seams are corrected, and the journey timeline has safer heading spacing and readable event cards.'],
    ],
  },
  ar: {
    eyebrow: 'تحديث نظام المهمات',
    title: 'ما الجديد؟',
    intro: 'استكشاف أوضح لمهمات الأرشيف الست عشرة، مع مشهد مداري يضم أربع مهمات للفضاء العميق.',
    close: 'حسنًا',
    changes: [
      ['أرشيف مداري للفضاء العميق', 'يعرض تبويب الفضاء العميق / المدار مركبات Dawn وNEAR Shoemaker وPioneer 10 و11 وKepler وسط حقل نجوم، مع مجسمات ثلاثية الأبعاد وأسماء قابلة للمس. استخدم فلتر «المدار ٤» أو دبوس المهمة لفتح قصتها الموجودة. ويظل Pioneer ممثلًا بمجسمه الهندسي المخصص؛ فلا يوجد له ملف GLB في الأرشيف.'],
      ['وصلات أكثر ثباتًا لخرائط الكواكب', 'أُضيف دمج أفقي بعرض ٣٢ بكسل للحواف، مع أخذ عينات خطي وإيقاف mipmaps لمنع خط وصلة UV. عُدّل شريط الحافة فقط في النسخ المشتقة، وبقيت ملفات المصدر وبيانات المهمات محفوظة من دون تضاريس اصطناعية.'],
      ['اضغط على أي دبوس كوكبي', 'لكل علامة على القمر والمريخ هدف لمس HTML فعلي بمقاس 48 بكسل واسم قابل للضغط. تُخفى العلامات على الوجه الخلفي ويتوقف الدوران فور لمس المشهد.'],
      ['شريط مهمات سريع', 'اسحب بين مهمات المشهد الحالي وافتح قصتها بلمسة واحدة.'],
      ['مساحة أوسع على الهاتف', 'صار الشريط العلوي صفًا واحدًا، وتبدأ قائمة المهمات مغلقة، وتبقى بطاقات القصة قابلة للتمرير في لوحة لا تتجاوز 42٪ من ارتفاع الشاشة أسفل المجسم المرفوع.'],
      ['قصص مؤثرة وحقائق محفوظة', 'أصبحت لكل مركبة ولكل جزء قصة بضمير المتكلم بالإنجليزية والعربية، مستندة إلى الوقائع المسجلة في الأرشيف.'],
      ['أجواء صوتية مستمرة بلمسة', 'ادخل إلى الأرشيف لفتح الصوت مرة واحدة؛ يستمر المشهد الكوني عبر كل العروض مع إشارات رادار وسونار وقياس عن بُعد وأصوات الكواكب. ويمكن كتمه من الشريط العلوي.'],
      ['توضيح مصدر المجسم', 'تظهر شارة تبيّن إن كان المجسم نموذج NASA للمهمة نفسها أم تمثيلًا هندسيًا من الفئة نفسها.'],
      ['نقاط فحص مرتبطة بالعتاد', 'تلتصق النقاط بأسماء أجزاء النموذج عند توفرها، وإلا تُسقَط على سطح المجسم من جهة الجزء المقصود.'],
      ['مجسمات مناسبة للمهمة', 'أُضيف جناحا Phoenix الشمسيان، وصارت Apollo 15 وALSEP وPioneer تملك هندسة مخصصة بدل مجسم مركبة غير ذات صلة.'],
      ['مواقع المهمات على الكواكب', 'يعرض القمر والمريخ علامات المهمات عند إحداثياتها المسجلة، مع إبعاد الكوكبين عن قائمة المهمات المفتوحة.'],
      ['كواكب ورحلة أوضح', 'أُصلحت وصلتا خامتي القمر والمريخ، وأُضيف فراغ آمن فوق عناوين الرحلة وبطاقات مقروءة لمراحلها.'],
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
            const Icon = [Orbit, Sparkles, Compass, ChevronLeft, Sparkles, RadioTower, RadioTower, ShieldCheck, BadgeCheck, Compass, RadioTower, ChevronLeft][index];
            return <li key={title}><span className="whats-new-item-icon"><Icon size={15} /></span><span><strong>{title}</strong><small>{detail}</small></span></li>;
          })}
        </ul>
        <div className="whats-new-footer"><span><span className="whats-new-status-dot" />LUNAR RELICS 3D</span><button type="button" onClick={onClose}>{copy.close}</button></div>
      </section>
    </div>
  );
}
