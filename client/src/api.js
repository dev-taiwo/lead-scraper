const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';
const ACCESS_CODE_KEY = 'leadScraperAccessCode';

export function getStoredAccessCode() {
  return sessionStorage.getItem(ACCESS_CODE_KEY) || '';
}

export function setStoredAccessCode(code) {
  sessionStorage.setItem(ACCESS_CODE_KEY, code);
}

export function clearStoredAccessCode() {
  sessionStorage.removeItem(ACCESS_CODE_KEY);
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Access-Code': getStoredAccessCode(),
    },
    ...options,
  });

  if (res.status === 401) {
    clearStoredAccessCode();
    throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.details || body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export function startScrape({ niche, city, maxResults }) {
  return request('/scrape', {
    method: 'POST',
    body: JSON.stringify({ niche, city, maxResults }),
  });
}

export function getScrapeRun(runId) {
  return request(`/scrape/${runId}`);
}

export function getProspects({ niche, city } = {}) {
  const params = new URLSearchParams();
  if (niche) params.set('niche', niche);
  if (city) params.set('city', city);
  const qs = params.toString();
  return request(`/prospects${qs ? `?${qs}` : ''}`);
}

export function setProspectQualified(id, qualified) {
  return request(`/prospects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ qualified }),
  });
}

export async function downloadProspectsCsv({ niche, city } = {}) {
  const params = new URLSearchParams();
  if (niche) params.set('niche', niche);
  if (city) params.set('city', city);
  const qs = params.toString();

  const res = await fetch(`${API_BASE}/prospects/export/csv${qs ? `?${qs}` : ''}`, {
    headers: { 'X-Access-Code': getStoredAccessCode() },
  });

  if (res.status === 401) {
    clearStoredAccessCode();
    throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) {
    throw new Error('Failed to export CSV');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
