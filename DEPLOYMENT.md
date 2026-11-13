# إعداد النشر على Vercel

## البناء المحلي

```bash
npm ci
npm run build
npm run preview
```

ينتج Vite المجلد `dist/`. ينسخ Vite محتوى `public/` كما هو إلى `dist/`؛ لذلك يصبح `public/models/dawn.glb` متاحًا عبر `/models/dawn.glb`. تُبقى النماذج خارج حزمة JavaScript وتُحمّل عند فتح سجلّها.

## إعداد Vercel

1. ادفع مصدر المشروع إلى مستودع GitHub ثم استورده في Vercel.
2. استخدم إطار العمل Vite أو الاكتشاف التلقائي، وأمر البناء `npm run build` ومجلد الإخراج `dist`.
3. يوجّه `vercel.json` المسارات إلى `/index.html` لدعم التنقل في تطبيق React أحادي الصفحة.
4. اترك `VITE_API_URL` فارغًا إذا كان الأرشيف المحلي مطلوبًا؛ عند توفر API خارجية، أضف المتغير إلى إعدادات البيئة على Vercel. لا ترفع `.env.local` أو أي أسرار.

## Git

يستبعد `.gitignore` مجلدَي `node_modules/` و`dist/` وملفات إعداد Vercel والملفات البيئية الخاصة، مع إبقاء `.env.example` ضمن المستودع. تُرفع ملفات المصدر و`src/data/relicsData.json` والنماذج الرسمية الموجودة في `public/models/`.
