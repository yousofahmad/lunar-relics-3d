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
    return records;
  } catch {
    return LOCAL_RELICS;
  } finally {
    window.clearTimeout(timeout);
  }
}
