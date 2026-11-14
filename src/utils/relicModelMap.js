const RELIC_PRESENTATIONS = {
  'apollo-11-eagle-descent-stage': {
    modelPath: '/models/apollo_lunar_module.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Apollo Lunar Module mesh · descent stage view',
  },
  'apollo-15-lrv': {
    modelPath: null,
    fidelity: 'archetype',
    archetype: 'lunar-rover',
    modelLabel: 'Apollo 15 LRV reconstruction · tubular chassis, wire wheels, seats, HGA',
    modelLabelAr: 'إعادة بناء من صور مهمة أبولو ١٥ ومواصفات العربة · مش مجسم رسمي',
    modelBasis: 'NASA Apollo 15 photographs + published Lunar Roving Vehicle specifications',
  },
  'alsep-scientific-packages': {
    modelPath: null,
    fidelity: 'archetype',
    archetype: 'ALSEP surface science package',
    modelLabel: 'ALSEP reconstruction · central station, RTG, seismometer, magnetometer',
    modelLabelAr: 'إعادة بناء من صور ALSEP المنشورة ومواصفات ناسا · مش مجسم رسمي',
    modelBasis: 'NASA ALSEP photographs + published experiment package layout',
  },
  'surveyor-3': {
    modelPath: null,
    fidelity: 'archetype',
    archetype: 'Surveyor lunar lander',
    modelLabel: 'Surveyor lander reconstruction · three-leg frame, solar panel, sampling arm',
    modelLabelAr: 'إعادة بناء من صور Surveyor 3 المنشورة ومواصفات ناسا · مش مجسم رسمي',
    modelBasis: 'NASA Surveyor 3 photographs + published lander specifications',
  },
  'sojourner-rover': {
    modelPath: null,
    fidelity: 'archetype',
    archetype: 'Sojourner microrover',
    modelLabel: 'Sojourner reconstruction · solar deck, six cleated wheels, rocker-bogie',
    modelLabelAr: 'إعادة بناء من صور Sojourner المنشورة ومواصفات ناسا · مش مجسم رسمي',
    modelBasis: 'NASA Sojourner photographs + published microrover specifications',
  },
  'spirit-rover': {
    modelPath: '/models/opportunity.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Mars Exploration Rover mesh · Spirit twin',
  },
  'opportunity-rover': {
    modelPath: '/models/opportunity.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Mars Exploration Rover Opportunity mesh',
  },
  'viking-1-lander': {
    modelPath: '/models/viking_lander.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Viking lander mesh',
  },
  'viking-2-lander': {
    modelPath: '/models/viking_lander.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA Viking lander mesh',
  },
  'phoenix-lander': {
    modelPath: null,
    fidelity: 'archetype',
    archetype: 'Phoenix polar lander',
    modelLabel: 'Phoenix reconstruction · circular deck, twin solar arrays, robotic arm',
    modelLabelAr: 'إعادة بناء من صور Phoenix المنشورة ومواصفات ناسا · مش مجسم رسمي',
    modelBasis: 'NASA Phoenix photographs + published lander specifications',
  },
  'insight-lander': {
    modelPath: '/models/insight_lander.glb',
    fidelity: 'authentic',
    modelLabel: 'NASA InSight lander mesh',
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
    modelLabel: 'NASA Pioneer 10 mesh',
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
  const authentic = getRelicModelInfo(item).fidelity === 'authentic';
  if (language === 'ar') {
    return authentic
      ? 'مجسم NASA أصلي · نسخة مطابقة'
      : 'إعادة بناء من صور ومواصفات NASA · مش مجسم رسمي';
  }
  return authentic
    ? 'AUTHENTIC NASA 3D MESH'
    : 'RECONSTRUCTION FROM NASA PHOTOS & SPECS · NOT AN OFFICIAL MESH';
}
