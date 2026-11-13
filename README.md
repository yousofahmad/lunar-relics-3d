# Lunar Relics 3D

واجهة React + Vite لاستكشاف 16 أثرًا موثقًا في أرشيف NSSDCA، تشمل القمر والمريخ والفضاء العميق. تضم خريطة Three.js، غرفة ذاكرة ثنائية اللغة، خطًا زمنيًا، أسئلة تفاعلية، اختبارًا وشارات محفوظة محليًا.

## التشغيل والبناء

```bash
npm install
npm run dev
npm run build
npm run preview
```

ينتج البناء مجلد `dist/`. ملفات `public/models/*.glb` تُنسخ إليه وتُتاح بمسارات `/models/*.glb`.

## API اختيارية

انسخ `.env.example` إلى `.env.local` وضع `VITE_API_URL` عند توفر خادم API؛ يطلب التطبيق `${VITE_API_URL}/api/relics`. إذا كان المتغير فارغًا أو فشل الاتصال، يستخدم `src/data/relicsData.json` المحلي تلقائيًا.

## الأصول والأداء

- ثمانية سجلات تستخدم سبعة ملفات GLB رسمية (سجلّا Viking يستخدمان ملفًا مشتركًا)؛ مجموعها 9,492,980 بايت.
- تُحمّل النماذج عند اختيار الأثر فقط؛ بقية الآثار لها مجسّمات إجرائية خفيفة.
- تحميل مشهد Three.js كسول، وحزم الإنتاج مقسمة؛ كثافة الرسم محدودة إلى `dpr={[1, 1.5]}`.
- مصادر NASA موثقة في `public/models/ASSET_SOURCES.md`.

## GitHub وVercel

ارفع المصدر و`public/models/` و`src/data/relicsData.json` إلى مستودع GitHub، ثم استورده في Vercel. استخدم أمر البناء `npm run build` ومجلد الناتج `dist`. ملف `vercel.json` يوجّه مسارات SPA إلى `index.html`. أضف `VITE_API_URL` إلى إعدادات Vercel عند استخدام API فقط؛ لا ترفع `.env.local` أو أسرارًا.
