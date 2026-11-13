# مصادر خامات القمر والمريخ

| الملف | المصدر وطريقة التجهيز |
|---|---|
| `moon-color.jpg` (4096×2048) | تحويل خريطة الألوان العالمية LROC من مجموعة NASA CGI Moon Kit إلى sRGB مناسب للويب. [صفحة NASA](https://svs.gsfc.nasa.gov/4720/) · [ملف المصدر](https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_16bit_srgb_4k.tif). |
| `moon-height.jpg` (4096×2048) | خريطة نتوء مشتقة من نموذج الارتفاعات القمرية LOLA `ldem_16.tif`، ضُغط مداها إلى 8-بت للويب. [ملف المصدر في NASA](https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16.tif). |
| `mars-color.jpg` (1024×512) | عينة عالمية بنسبة 2:1 من فسيفساء Viking MDIM 2.1 اللونية، من NASA Ames وNASA/JPL وUSGS. [صفحة USGS للموزاييك](https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m) · [ملف عينة الخريطة](https://astrogeology.usgs.gov/ckan/dataset/7131d503-cdc9-45a5-8f83-5126c0fd397e/resource/6afad901-1caa-48a7-8b62-3911da0004c2/download/mars_viking_mdim21_clrmosaic_global_1024.jpg). |
| `mars-height.jpg` | تحويل رمادي متزن لخريطة اللون نفسها لإضافة نتوء بصري خفيف؛ **ليس** نموذج ارتفاعات علميًا. |

الخامات محفوظة محليًا في المستودع؛ لا يجلب التطبيق صور السطح من مواقع خارجية عند التشغيل.

## وصلات العرض ثلاثي الأبعاد

ملفات `moon-*-seamfix.webp` و`mars-*-seamfix.webp` نسخ مشتقة غير فاقدة من خرائط `*-seamless.webp` المعروضة سابقًا. يطبّق تجهيزها مزجًا أفقيًا ناعمًا على شريط عرضه 32 بكسل عند حافتي الالتفاف فقط؛ وتبقى ملفات JPG الأصلية ونسخ `*-seamless.webp` محفوظة دون تعديل.

في `Planet` تُضبط خرائط الألوان على `SRGBColorSpace` وخرائط النتوء على `NoColorSpace`، مع `RepeatWrapping` أفقيًا و`ClampToEdgeWrapping` رأسيًا، و`LinearFilter` دون mipmaps لتقليل ظهور وصلة UV. هذه الخرائط بيانات سطح ثابتة من المصادر المذكورة أعلاه؛ لا يضيف التطبيق ضوضاء أو فوهات اصطناعية.
