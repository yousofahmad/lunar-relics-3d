const RELIC_PRESENTATIONS = {
  'apollo-11-eagle-descent-stage': {
    modelPath: '/models/apollo_lunar_module.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Apollo Lunar Module mesh · descent stage view',
  },
  'apollo-15-lrv': {
    modelPath: '/models/generated/apollo-15-lrv.glb',
    fidelity: 'generated',
    archetype: 'lunar-rover',
    modelLabel: 'SI-generated 3D model built to NASA published specs · not a NASA model',
    modelLabelAr: 'مجسم مولّد بالذكاء الاصطناعي حسب مواصفات ناسا المنشورة · مش مجسم من ناسا',
    modelBasis: 'NASA Apollo 15 photographs + published Lunar Roving Vehicle specifications',
  },
  'alsep-scientific-packages': {
    modelPath: '/models/generated/alsep.glb',
    fidelity: 'generated',
    archetype: 'ALSEP surface science package',
    modelLabel: 'SI-generated 3D model built to NASA published specs · not a NASA model',
    modelLabelAr: 'مجسم مولّد بالذكاء الاصطناعي حسب مواصفات ناسا المنشورة · مش مجسم من ناسا',
    modelBasis: 'NASA ALSEP photographs + published experiment package layout',
  },
  'surveyor-3': {
    modelPath: '/models/generated/surveyor-3.glb',
    fidelity: 'generated',
    archetype: 'Surveyor lunar lander',
    modelLabel: 'SI-generated 3D model built to NASA published specs · not a NASA model',
    modelLabelAr: 'مجسم مولّد بالذكاء الاصطناعي حسب مواصفات ناسا المنشورة · مش مجسم من ناسا',
    modelBasis: 'NASA Surveyor 3 photographs + published lander specifications',
  },
  'sojourner-rover': {
    modelPath: '/models/generated/sojourner.glb',
    fidelity: 'generated',
    archetype: 'Sojourner microrover',
    modelLabel: 'SI-generated 3D model built to NASA published specs · not a NASA model',
    modelLabelAr: 'مجسم مولّد بالذكاء الاصطناعي حسب مواصفات ناسا المنشورة · مش مجسم من ناسا',
    modelBasis: 'NASA Sojourner photographs + published microrover specifications',
  },
  'spirit-rover': {
    modelPath: '/models/opportunity.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Opportunity 3D model · representative of the identical Spirit/Opportunity rover design',
    modelLabelAr: 'مجسم NASA لعربة Opportunity · تمثيل لتصميم توأم Spirit/Opportunity المتطابق',
  },
  'opportunity-rover': {
    modelPath: '/models/opportunity.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Opportunity (MER-B) 3D model',
    modelLabelAr: 'نموذج NASA ثلاثي الأبعاد لعربة Opportunity (MER-B)',
  },
  'viking-1-lander': {
    modelPath: '/models/viking_lander.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Viking lander 3D model · lander configuration shared by the identical Viking spacecraft',
    modelLabelAr: 'مجسم NASA لهبوط Viking · تصميم الهبوط المشترك للمركبتين التوأم',
  },
  'viking-2-lander': {
    modelPath: '/models/viking_lander.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Viking lander 3D model · lander configuration shared by the identical Viking spacecraft',
    modelLabelAr: 'مجسم NASA لهبوط Viking · تصميم الهبوط المشترك للمركبتين التوأم',
  },
  'phoenix-lander': {
    modelPath: '/models/generated/phoenix.glb',
    fidelity: 'generated',
    archetype: 'Phoenix polar lander',
    modelLabel: 'SI-generated 3D model built to NASA published specs · not a NASA model',
    modelLabelAr: 'مجسم مولّد بالذكاء الاصطناعي حسب مواصفات ناسا المنشورة · مش مجسم من ناسا',
    modelBasis: 'NASA Phoenix photographs + published lander specifications',
  },
  'insight-lander': {
    modelPath: '/models/insight_lander_deployed_optimized.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA/JPL-Caltech InSight lander · deployed configuration',
    modelLabelAr: 'مجسم ناسا/JPL-Caltech لمسبار InSight · وضع الهبوط المنشور',
  },
  'ingenuity-helicopter': {
    modelPath: '/models/ingenuity.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Ingenuity helicopter mesh',
  },
  'dawn-spacecraft': {
    modelPath: '/models/dawn.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Dawn spacecraft mesh',
  },
  'near-shoemaker': {
    modelPath: '/models/near_shoemaker.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA NEAR Shoemaker spacecraft mesh',
  },
  'pioneer-10-11': {
    modelPath: '/models/pioneer10.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Pioneer 10 3D model · Pioneer 11 is not a separate model here and carried an additional triaxial fluxgate magnetometer',
    modelLabelAr: 'مجسم NASA لـPioneer 10 · لا يوجد هنا مجسم مستقل لـPioneer 11، التي حملت مقياس مغناطيسية إضافياً ثلاثي المحاور',
  },
  'kepler-space-telescope': {
    modelPath: '/models/kepler_b.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Kepler space telescope mesh',
  },
};

export function getRelicModelInfo(item) {
  if (!item) return { modelPath: null, fidelity: 'archetype', archetype: 'spacecraft', modelLabel: 'Procedural spacecraft archetype' };
  const presentation = RELIC_PRESENTATIONS[item.id];
  if (presentation) return presentation;

  const explicitPath = item.model3dFile ? `/${item.model3dFile.replace(/^\/+/, '')}` : null;
  return {
    modelPath: explicitPath,
    fidelity: 'archetype',
    archetype: item.type || 'spacecraft',
    modelLabel: explicitPath ? '3D class representation' : 'Procedural spacecraft archetype',
  };
}

export function getRelicModelPath(item) {
  return getRelicModelInfo(item).modelPath;
}

export function has3DRepresentation(item) {
  return Boolean(item && (getRelicModelInfo(item).modelPath || item.has3DModel || item.type));
}

export function getModelHonestyLabel(item, language = 'en') {
  const fidelity = getRelicModelInfo(item).fidelity;
  if (language === 'ar') {
    if (fidelity === 'authentic') return 'مجسم ثلاثي الأبعاد منشور من NASA · راجع ملاحظة هذا السجل';
    if (fidelity === 'generated') return 'مجسم مولّد بالذكاء الاصطناعي (SI) حسب المواصفات المنشورة · مش من ناسا';
    return 'إعادة بناء بالذكاء الاصطناعي (SI) من صور ومواصفات NASA · مش مجسم رسمي';
  }
  if (fidelity === 'authentic') return 'NASA-PUBLISHED 3D MODEL · SEE MISSION-SPECIFIC NOTES';
  if (fidelity === 'generated') return 'SI-GENERATED MODEL BUILT TO PUBLISHED SPECS · NOT FROM NASA';
  return 'SI-BUILT RECONSTRUCTION FROM NASA PHOTOS & SPECS · NOT AN OFFICIAL MESH';
}
