import { useState, useRef, useCallback } from 'react';
import ScrapeForm from '../components/ScrapeForm';
import ScrapeStatus from '../components/ScrapeStatus';
import ProspectsTable from '../components/ProspectsTable';
import { startScrape, getScrapeRun, getProspects, downloadProspectsCsv } from '../api';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;

export default function Scraper({ onUnauthorized }) {
  const [prospects, setProspects] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [filters, setFilters]     = useState({});
  const pollTimerRef    = useRef(null);
  const pollAttemptsRef = useRef(0);

  const loadProspects = useCallback(async (currentFilters = filters) => {
    try {
      const data = await getProspects(currentFilters);
      setProspects(data);
      setLoadError(null);
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') { onUnauthorized(); return; }
      setLoadError(err.message);
    }
  }, [filters, onUnauthorized]);

  function stopPolling() {
    clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
    pollAttemptsRef.current = 0;
  }

  function pollRun(runId, runFilters) {
    pollTimerRef.current = setTimeout(async () => {
      pollAttemptsRef.current += 1;
      try {
        const run = await getScrapeRun(runId);
        setActiveRun(run);
        if (run.status === 'SUCCEEDED') { await loadProspects(runFilters); stopPolling(); return; }
        if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) { stopPolling(); return; }
        if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
          stopPolling();
          setLoadError('Scrape taking longer than expected — check Apify console.');
          return;
        }
        pollRun(runId, runFilters);
      } catch (err) { setLoadError(err.message); stopPolling(); }
    }, POLL_INTERVAL_MS);
  }

  async function handleScrapeStarted({ niche, city, maxResults }) {
    stopPolling();
    const runFilters = { niche, city };
    setFilters(runFilters);
    try {
      const run = await startScrape({ niche, city, maxResults });
      setActiveRun(run);
      pollRun(run.runId, runFilters);
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') { onUnauthorized(); return; }
      throw err;
    }
  }

  function handleProspectUpdate(updated) {
    setProspects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
  }

  async function handleExport() {
    try { await downloadProspectsCsv(filters); }
    catch (err) { if (err.message === 'UNAUTHORIZED') onUnauthorized(); }
  }

  const isScraping = activeRun && ['RUNNING', 'READY'].includes(activeRun.status);

  return (
    <div className="scraper-page">
      <div className="panel">
        <ScrapeForm onScrapeStarted={handleScrapeStarted} disabled={isScraping} />
        <ScrapeStatus run={activeRun} />
        {loadError && <p className="form-error">{loadError}</p>}
      </div>

      <div className="panel">
        <div className="table-toolbar">
          <span className="table-count">{prospects.length} leads</span>
          {prospects.length > 0 && (
            <button className="btn-secondary" onClick={handleExport}>Export CSV</button>
          )}
        </div>
        <ProspectsTable
          prospects={prospects}
          onUpdate={handleProspectUpdate}
          filters={filters}
          hideExport
        />
      </div>
    </div>
  );
}
