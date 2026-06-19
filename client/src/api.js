const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';
const ACCESS_CODE_KEY = 'leadScraperAccessCode';

export const getStoredAccessCode = () => sessionStorage.getItem(ACCESS_CODE_KEY) || '';
export const setStoredAccessCode = (c) => sessionStorage.setItem(ACCESS_CODE_KEY, c);
export const clearStoredAccessCode = () => sessionStorage.removeItem(ACCESS_CODE_KEY);

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', 'X-Access-Code': getStoredAccessCode() },
    ...options,
  });
  if (res.status === 401) { clearStoredAccessCode(); throw new Error('UNAUTHORIZED'); }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.details || body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Stages
export const getStages = () => request('/stages');
export const createStage = (data) => request('/stages', { method: 'POST', body: JSON.stringify(data) });
export const updateStage = (id, data) => request(`/stages/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteStage = (id) => request(`/stages/${id}`, { method: 'DELETE' });

// Prospects
export const startScrape = (data) => request('/scrape', { method: 'POST', body: JSON.stringify(data) });
export const getScrapeRun = (runId) => request(`/scrape/${runId}`);
export const getProspects = ({ niche, city, stage_id } = {}) => {
  const p = new URLSearchParams();
  if (niche) p.set('niche', niche);
  if (city) p.set('city', city);
  if (stage_id) p.set('stage_id', stage_id);
  const qs = p.toString();
  return request(`/prospects${qs ? `?${qs}` : ''}`);
};
export const updateProspect = (id, data) =>
  request(`/prospects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export async function downloadProspectsCsv({ niche, city } = {}) {
  const p = new URLSearchParams();
  if (niche) p.set('niche', niche);
  if (city) p.set('city', city);
  const qs = p.toString();
  const res = await fetch(`${API_BASE}/prospects/export/csv${qs ? `?${qs}` : ''}`, {
    headers: { 'X-Access-Code': getStoredAccessCode() },
  });
  if (res.status === 401) { clearStoredAccessCode(); throw new Error('UNAUTHORIZED'); }
  if (!res.ok) throw new Error('Failed to export CSV');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'leads.csv';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
