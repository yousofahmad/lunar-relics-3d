import localRelics from '../data/relicsData.json';

export const LOCAL_RELICS = localRelics;

export async function fetchRelics() {
  const baseUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (!baseUrl) return LOCAL_RELICS;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 1400);
  try {
    const response = await fetch(`${baseUrl}/api/relics`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Relics API returned ${response.status}`);
    const payload = await response.json();
    const records = Array.isArray(payload) ? payload : payload?.data;
    if (!Array.isArray(records) || records.length === 0) throw new Error('Relics API returned no records');
    const localByKey = new Map();
    for (const item of LOCAL_RELICS) {
      for (const key of [item.id, item.name, item.nickname]) {
        if (key) localByKey.set(String(key).trim().toLocaleLowerCase(), item);
      }
    }
    return records.map((record) => {
      const local = [record.id, record.name, record.nickname]
        .filter(Boolean)
        .map((key) => localByKey.get(String(key).trim().toLocaleLowerCase()))
        .find(Boolean);
      if (!local) return record;
      const model3dFile = local.model3dFile || record.model3dFile || '';
      return {
        ...local,
        ...record,
        model3dFile,
        has3DModel: Boolean(model3dFile),
      };
    });
  } catch {
    return LOCAL_RELICS;
  } finally {
    window.clearTimeout(timeout);
  }
}
