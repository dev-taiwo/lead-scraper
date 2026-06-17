import { useState } from 'react';

export default function ScrapeForm({ onScrapeStarted, disabled }) {
  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!niche.trim() || !city.trim()) {
      setError('Enter both a niche and a city.');
      return;
    }

    try {
      await onScrapeStarted({ niche: niche.trim(), city: city.trim(), maxResults: Number(maxResults) });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="scrape-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="niche">Niche</label>
        <input
          id="niche"
          type="text"
          placeholder="e.g. roofing contractors"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="field">
        <label htmlFor="city">City</label>
        <input
          id="city"
          type="text"
          placeholder="e.g. Indianapolis, IN"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="field field-narrow">
        <label htmlFor="maxResults">Max results</label>
        <input
          id="maxResults"
          type="number"
          min="1"
          max="50"
          value={maxResults}
          onChange={(e) => setMaxResults(e.target.value)}
          disabled={disabled}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={disabled}>
        {disabled ? 'Scraping…' : 'Scrape'}
      </button>

      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
