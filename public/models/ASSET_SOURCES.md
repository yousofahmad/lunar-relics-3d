# مصادر نماذج NASA ثلاثية الأبعاد

جُمعت ملفات GLB التالية من مستودع NASA الرسمي `nasa/NASA-3D-Resources`. تم التحقق من ترويسة glTF 2.0 ومن تطابق الحجم المعلن داخل الملف مع حجمه الفعلي. تُحمّل الملفات عند فتح سجلّها فقط.

| الملف المحلي | نموذج NASA | الحجم بالبايت | المصدر الرسمي |
|---|---|---:|---|
| `opportunity.glb` | عربة Opportunity (MER-B) | 36,668 | [صفحة NASA](https://science.nasa.gov/3d-resources/mars-exploration-rover-opportunity-mer-b/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Mars%20Exploration%20Rover%20-%20Opportunity%20(MER-B)) |
| `viking_lander.glb` | مسبار Viking Lander المشترك بين Viking 1 و2 | 1,849,384 | [صفحة NASA](https://science.nasa.gov/3d-resources/viking-lander/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Viking%20Lander) |
| `insight_lander.glb` | InSight Cruise Lander (ذراع الهبوط منشورة) | 3,949,036 | [صفحة NASA](https://science.nasa.gov/3d-resources/insight-cruise-lander/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/InSight%20Cruise%20Lander) |
| `ingenuity.glb` | مروحية Ingenuity Mars | 2,019,408 | [صفحة NASA](https://science.nasa.gov/3d-resources/ingenuity-mars-helicopter/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Ingenuity%20Mars%20Helicopter) |
| `dawn.glb` | مركبة Dawn | 927,020 | [صفحة NASA](https://science.nasa.gov/3d-resources/dawn-spacecraft/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Dawn) |
| `near_shoemaker.glb` | مركبة NEAR Shoemaker | 701,808 | [صفحة NASA](https://science.nasa.gov/3d-resources/near-shoemaker/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/NEAR%20Shoemaker) |
| `kepler_b.glb` | Kepler (B) | 9,656 | [صفحة NASA](https://science.nasa.gov/3d-resources/kepler-b/) · [المستودع](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Kepler%20(B)) |

مجموع الملفات السبعة الفريدة 9,492,980 بايت. تستخدمها ثمانية سجلات لأن Viking 1 وViking 2 يتشاركان نموذج NASA العام. لم يُضف نموذج غير مطابق: ملف Apollo Lunar Module عام وليس مرحلة هبوط Eagle وحدها، وملف Pioneer المتاح يمثل Pioneer 10 فقط لا سجل Pioneer 10 و11 معًا. لا يوجد في هذه الحزمة GLB مخصص ومعتمد لمرحلة هبوط Eagle؛ لذلك يُعرض لها مجسم هبوط إجرائي صلب متعدد الأجزاء، لا ملف GLB منسوب إلى مركبة أخرى. وبالمثل، سجلات Apollo 15 وALSEP وSurveyor 3 وSojourner وPhoenix بلا GLB مطابق مؤكد؛ أما ملف Spirit المتاح بصيغة Blender وحجمه نحو 12 MB وليس GLB. تستخدم السجلات غير المرتبطة بـGLB مجسمات إجرائية صلبة مصنوعة من أجزاء ثلاثية الأبعاد بحسب نوع المركبة (مثل الهيكل والعجلات والأرجل والأطباق والألواح الشمسية)، وليست كرات شبكية أو رسومات مسطحة.
