const RELIC_MODEL_OVERRIDES = {
  'apollo-11-eagle-descent-stage': '/models/apollo_lunar_module.glb',
  'apollo-15-lrv': '/models/opportunity.glb',
  'alsep-scientific-packages': '/models/dawn.glb',
  'surveyor-3': '/models/viking_lander.glb',
  'sojourner-rover': '/models/opportunity.glb',
  'spirit-rover': '/models/opportunity.glb',
  'phoenix-lander': '/models/viking_lander.glb',
  'pioneer-10-11': '/models/dawn.glb',
};

const MODEL_BY_HARDWARE_CLASS = [
  { match: /rover/, path: '/models/opportunity.glb' },
  { match: /lander/, path: '/models/viking_lander.glb' },
  { match: /rotorcraft|helicopter/, path: '/models/ingenuity.glb' },
  { match: /scientific|probe/, path: '/models/dawn.glb' },
  { match: /orbiter|telescope/, path: '/models/kepler_b.glb' },
];

export function getRelicModelPath(item) {
  if (!item) return null;
  if (RELIC_MODEL_OVERRIDES[item.id]) return RELIC_MODEL_OVERRIDES[item.id];
  if (item.model3dFile) return `/${item.model3dFile.replace(/^\/+/, '')}`;

  const type = (item.type || '').toLowerCase();
  const matchingClass = MODEL_BY_HARDWARE_CLASS.find(({ match }) => match.test(type));
  return matchingClass?.path || '/models/dawn.glb';
}
