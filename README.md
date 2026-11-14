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

## Super Intelligence (SI) disclosure / الإفصاح عن استخدام الذكاء الفائق

**English.** This project was built with Super Intelligence tools, as allowed by the NASA Space Apps Challenge rules. The SI agent **Manus** (https://manus.im) and its companion tool **Cue** produced, under the direction and review of the Lunar Relics 3D team:

| Area | What SI did | How it is marked |
|---|---|---|
| Analysis & research | Read the NASA sources, built the mission dataset and fact checks | This section; `src/data/README.md` |
| Code | All front-end code (React, Three.js scenes, games, audio engine) and the procedural 3D reconstructions in `src/components/ProceduralCraft.jsx` | This section; header notes in source; `package.json` `siDisclosure` |
| Text & translation | First-person mission stories, hooks, fun facts, quiz text, Arabic/English translations | `src/data/README.md` |
| Audio | Every narration file in `public/audio/narration/` is an **AI-generated voice** (Manus text-to-speech) | Labeled "AI-generated voice" in the UI; ID3 tags (`artist`, `comment`, `encoded_by`) inside every MP3 |
| Video | The 30-second demo video was assembled by SI from screen captures and an AI voice-over | Visible "SI-GENERATED" watermark on every frame |
| 3D | Official NASA meshes from NASA 3D Resources are used **unmodified**; non-NASA shapes are SI-written code reconstructions | On-screen provenance badge on every model |

No NASA logos, flags, insignia or mission patches were generated or modified. NASA data and media come from public NASA sources (see the data sources in `src/data/relicsData.json`, `public/models/ASSET_SOURCES.md` and `public/textures/README.md`).

**العربية.** المشروع اتعمل بأدوات الذكاء الفائق المسموح بيها في قواعد NASA Space Apps. أداة **Manus** ومعاها **Cue** عملوا التحليل والبحث، والكود كله، والنصوص والترجمة، والأصوات (كلها أصوات مولّدة بالذكاء الاصطناعي ومكتوب ده في الواجهة وجوه بيانات ملفات الصوت)، وفيديو الديمو (عليه علامة مائية ظاهرة)، والمجسمات المعاد بناؤها بالكود. كل ده تم بتوجيه ومراجعة فريق Lunar Relics 3D. مجسمات NASA الرسمية مستخدمة زي ما هي بدون تعديل، ومفيش أي شعار أو علامة من علامات NASA اتولّد أو اتعدّل.
