# مصادر نماذج NASA ثلاثية الأبعاد

جُمعت ملفات GLB من مستودع NASA الرسمي `nasa/NASA-3D-Resources` ومن صفحات NASA الرسمية لموارد 3D. يأتي نموذج InSight المنشور من صفحة NASA Mars الأقدم. تم التحقق من ترويسة glTF 2.0 ومن تطابق الحجم المعلن داخل الملف مع حجمه الفعلي. تُحمّل الملفات عند فتح سجلّها فقط.

| الملف المحلي | نموذج NASA | الحجم بالبايت | المصدر الرسمي |
|---|---|---:|---|
| `opportunity.glb` | عربة Opportunity (MER-B) | 36,668 | [صفحة NASA](https://science.nasa.gov/3d-resources/mars-exploration-rover-opportunity-mer-b/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Mars%20Exploration%20Rover%20-%20Opportunity%20(MER-B)) |
| `viking_lander.glb` | مسبار Viking Lander المشترك بين Viking 1 و2 | 1,849,384 | [صفحة NASA](https://science.nasa.gov/3d-resources/viking-lander/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Viking%20Lander) |
| `insight_lander.glb` | InSight Cruise Lander (ذراع الهبوط منشورة) | 3,949,036 | [صفحة NASA](https://science.nasa.gov/3d-resources/insight-cruise-lander/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/InSight%20Cruise%20Lander) |
| `insight_lander_deployed_optimized.glb` | نسخة مشتقة مضغوطة من النموذج الرسمي NASA/JPL-Caltech (WebP q70 + Draco) | 2,957,580 | [صفحة NASA](https://science.nasa.gov/resource/insight-lander-3d-model/) · [التنزيل الأصلي الذي اشتُقت منه](https://assets.science.nasa.gov/content/dam/science/psd/mars/resources/gltf_files/24880_InSight_deployed.glb) |
| `ingenuity.glb` | مروحية Ingenuity Mars | 2,019,408 | [صفحة NASA](https://science.nasa.gov/3d-resources/ingenuity-mars-helicopter/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Ingenuity%20Mars%20Helicopter) |
| `dawn.glb` | مركبة Dawn | 927,020 | [صفحة NASA](https://science.nasa.gov/3d-resources/dawn-spacecraft/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Dawn) |
| `near_shoemaker.glb` | مركبة NEAR Shoemaker | 701,808 | [صفحة NASA](https://science.nasa.gov/3d-resources/near-shoemaker/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/NEAR%20Shoemaker) |
| `pioneer10.glb` | نموذج Pioneer 10 (لا يمثل Pioneer 11) | 2,049,840 | [صفحة NASA](https://science.nasa.gov/3d-resources/pioneer/) |
| `kepler_b.glb` | Kepler (B) | 9,656 | [صفحة NASA](https://science.nasa.gov/3d-resources/kepler-b/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Kepler%20(B)) |
| `apollo_lunar_module.glb` | وحدة Apollo Lunar Module كاملة من NASA؛ يعرض سجل Eagle الأجزاء المتبقية من مرحلة الهبوط فقط | 716,840 | [صفحة NASA الرسمية](https://science.nasa.gov/3d-resources/apollo-lunar-module/) · [ملف GLB الأصلي](https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/apollo-lunar-module/Apollo%20Lunar%20Module.glb) |

مجموع ملفات GLB العشرة المحفوظة في الشجرة الحالية 15,217,240 بايت. لا تُضمّن النسخة الأصلية الكبيرة `insight_lander_deployed.glb` ضمن ملفات الفرع الحالية أو أصول الإنتاج؛ ويظل رابط تنزيل NASA الأصلي والرصيد موثقين أعلاه. يستخدم سجل InSight النسخة المشتقة `insight_lander_deployed_optimized.glb` بعد ضغط الأنسجة إلى WebP بجودة 70 والهندسة بـDraco؛ احتُفظ بأبعاد الأنسجة الأصلية (512px و1024px) ولم يُطبّق تبسيط للمضلعات. انخفض حجم النموذج من 22,357,936 إلى 2,957,580 بايت (86.77%). عدد المثلثات 178,077 في النسخة المحسّنة مقابل 178,079 في المصدر. بقي أيضًا `insight_lander.glb` الأقدم كما هو. يصف موقع NASA نموذج Cruise Lander الآخر بأنه بوضع الهبوط مع الألواح الشمسية والذراع منشورين، قبل نشر مقياس الزلازل ومسبار الحرارة. تُستخدم النماذج الأصلية الثمانية الأخرى في تسعة سجلات لأن Viking 1 وViking 2 يتشاركان نموذج NASA العام. ملف Apollo الرسمي يصوّر وحدة الهبوط كاملة؛ وعند عرض سجل Eagle تُحذف أجزاء مرحلة الصعود برمجيًا بعد تحميل النموذج كيلا توحي بأن تلك المرحلة تُركت على القمر. تظهر EASEP كحزمة منفصلة بجوار مرحلة الهبوط. وبالمثل، سجلات Apollo 15 وALSEP وSurveyor 3 وSojourner وPhoenix بلا GLB مطابق مؤكد؛ أما ملف Spirit المتاح بصيغة Blender وحجمه نحو 12 MB وليس GLB. تستخدم السجلات غير المرتبطة بـGLB مجسمات إجرائية صلبة مصنوعة من أجزاء ثلاثية الأبعاد بحسب نوع المركبة (مثل الهيكل والعجلات والأرجل والأطباق والألواح الشمسية)، وليست كرات شبكية أو رسومات مسطحة.

وفق [إرشادات استخدام صور ووسائط NASA](https://www.nasa.gov/nasa-brand-center/images-and-media/)، فإن مواد NASA، ومنها بيانات الملفات المستخدمة في النماذج ثلاثية الأبعاد، ليست عادةً خاضعة لحقوق نشر داخل الولايات المتحدة؛ ينبغي ذكر NASA كمصدر وعدم الإيحاء بتأييد NASA للموقع أو المنتج. صفحة النموذج تسند الرصيد إلى NASA/JPL-Caltech.

## SI-generated models built to published specifications (NOT NASA models)

The files in `public/models/generated/` were generated with Super Intelligence (Manus AI text-to-3D) from written descriptions of each spacecraft's published NASA specifications and photographs. They are **not** NASA-published meshes, contain no NASA logos or insignia, and are labelled in the app as "SI-generated model built to published specs · not from NASA".

| File | Mission |
|---|---|
| `generated/apollo-15-lrv.glb` | Apollo 15 Lunar Roving Vehicle |
| `generated/alsep.glb` | Apollo 12 ALSEP surface experiments |
| `generated/surveyor-3.glb` | Surveyor 3 lander |
| `generated/sojourner.glb` | Mars Pathfinder Sojourner rover |
| `generated/phoenix.glb` | Phoenix Mars lander |
