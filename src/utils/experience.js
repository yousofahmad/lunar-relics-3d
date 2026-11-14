const VIEWS = new Set(['Moon', 'Mars', 'Deep Space']);

export function readLaunchLocation(search, records = []) {
  const params = new URLSearchParams(search || '');
  const mission = records.find((item) => item.id === params.get('mission'));
  const requestedView = params.get('view');
  const view = mission?.body || (VIEWS.has(requestedView) ? requestedView : 'Moon');
  const requestedLanguage = params.get('lang');
  return {
    missionId: mission?.id || null,
    view,
    language: requestedLanguage === 'ar' || requestedLanguage === 'en' ? requestedLanguage : null,
    hasDestination: Boolean(mission || VIEWS.has(requestedView)),
  };
}

export function readPreference(key, fallback = '') {
  try {
    return globalThis.localStorage?.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function savePreference(key, value) {
  try {
    globalThis.localStorage?.setItem(key, value);
    return true;
  } catch {
    // Private browsing/storage limits must not block exploration or erase data.
    return false;
  }
}
