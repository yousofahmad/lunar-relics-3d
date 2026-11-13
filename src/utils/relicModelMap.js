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
    modelLabel: 'Four-wheel lunar rover archetype',
  },
  'alsep-scientific-packages': {
    modelPath: null,
    fidelity: 'archetype',
    archetype: 'ALSEP surface science package',
    modelLabel: 'Apollo surface science package archetype',
  },
  'surveyor-3': {
    modelPath: '/models/viking_lander.glb',
    fidelity: 'archetype',
    archetype: 'three-leg planetary lander',
    addOns: 'surveyor',
    modelLabel: 'Three-leg lander class mesh · Surveyor hardware details added',
  },
  'sojourner-rover': {
    modelPath: '/models/opportunity.glb',
    fidelity: 'archetype',
    archetype: 'six-wheel planetary rover',
    addOns: 'sojourner',
    modelLabel: 'Six-wheel rover class mesh · Sojourner details added',
  },
  'spirit-rover': {
    modelPath: '/models/opportunity.glb',
    fidelity: 'archetype',
    archetype: 'Mars Exploration Rover twin',
    modelLabel: 'Mars Exploration Rover class mesh · Spirit twin representation',
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
    modelPath: '/models/viking_lander.glb',
    fidelity: 'archetype',
    archetype: 'three-leg Mars lander',
    addOns: 'phoenix',
    modelLabel: 'Three-leg lander class mesh · Phoenix solar wings added',
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
    modelPath: null,
    fidelity: 'archetype',
    archetype: 'radioisotope deep-space probe',
    modelLabel: 'Radioisotope-powered deep-space probe archetype',
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

export function getModelHonestyLabel(item) {
  return getRelicModelInfo(item).fidelity === 'authentic'
    ? 'AUTHENTIC NASA 3D MESH'
    : '3D ARCHETYPE MODEL (CLASS REPRESENTATION)';
}
