import { useState } from 'react';
import UnlockScreen from './components/UnlockScreen';
import Scraper from './pages/Scraper';
import Pipeline from './pages/Pipeline';
import { getStoredAccessCode } from './api';
import './App.css';

const TABS = [
  { id: 'scraper',  label: 'Lead Scraper' },
  { id: 'pipeline', label: 'Pipeline' },
];

export default function App() {
  const [unlocked, setUnlocked] = useState(!!getStoredAccessCode());
  const [tab, setTab] = useState('scraper');

  if (!unlocked) return <UnlockScreen onUnlock={() => setUnlocked(true)} />;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <h1>Lead Scraper</h1>
          <p className="app-subtitle">Google Maps businesses, via Apify — no Base44 required.</p>
        </div>
        <nav className="app-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nav-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === 'scraper'  && <Scraper  onUnauthorized={() => setUnlocked(false)} />}
        {tab === 'pipeline' && <Pipeline />}
      </main>
    </div>
  );
}
