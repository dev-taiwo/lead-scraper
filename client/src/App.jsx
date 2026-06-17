import { useState, useEffect, useRef, useCallback } from 'react';
import ScrapeForm from './components/ScrapeForm';
import ScrapeStatus from './components/ScrapeStatus';
import ProspectsTable from './components/ProspectsTable';
import UnlockScreen from './components/UnlockScreen';
import { startScrape, getScrapeRun, getProspects, getStoredAccessCode } from './api';
import './App.css';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes

export default function App() {
  const [unlocked, setUnlocked] = useState(!!getStoredAccessCode());
  const [prospects, setProspects] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [filters, setFilters] = useState({});
  const pollTimerRef = useRef(null);
  const pollAttemptsRef = useRef(0);

  const loadProspects = useCallback(async (currentFilters = filters) => {
    try {
      const data = await getProspects(currentFilters);
      setProspects(data);
      setLoadError(null);
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        setUnlocked(false);
        return;
      }
      setLoadError(err.message);
    }
  }, [filters]);

  useEffect(() => {
    if (unlocked) loadProspects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  useEffect(() => {
    return () => clearTimeout(pollTimerRef.current);
  }, []);

  if (!unlocked) {
    return <UnlockScreen onUnlock={() => setUnlocked(true)} />;
  }

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

        if (run.status === 'SUCCEEDED') {
          await loadProspects(runFilters);
          stopPolling();
          return;
        }

        if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) {
          stopPolling();
          return;
        }

        if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
          stopPolling();
          setLoadError('Scrape is taking longer than expected. Check Apify console for run status.');
          return;
        }

        pollRun(runId, runFilters);
      } catch (err) {
        setLoadError(err.message);
        stopPolling();
      }
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
      if (err.message === 'UNAUTHORIZED') {
        setUnlocked(false);
        return;
      }
      throw err;
    }
  }

  function handleProspectUpdate(updated) {
    setProspects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  const isScraping = activeRun && ['RUNNING', 'READY'].includes(activeRun.status);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Lead Scraper</h1>
        <p className="app-subtitle">Google Maps businesses, via Apify — no Base44 required.</p>
      </header>

      <main className="app-main">
        <section className="panel">
          <ScrapeForm onScrapeStarted={handleScrapeStarted} disabled={isScraping} />
          <ScrapeStatus run={activeRun} />
          {loadError && <p className="form-error">{loadError}</p>}
        </section>

        <section className="panel">
          <ProspectsTable prospects={prospects} onUpdate={handleProspectUpdate} filters={filters} />
        </section>
      </main>
    </div>
  );
}
