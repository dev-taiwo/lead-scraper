const express = require('express');
const { v4: uuidv4 } = require('uuid');
const apify = require('../services/apifyService');
const store = require('../db/store');

const router = express.Router();

/**
 * POST /api/scrape
 * Body: { niche, city, maxResults }
 * Kicks off an Apify run and records a ScrapeRun row immediately
 * (status: RUNNING). The frontend then polls /api/scrape/:runId.
 */
router.post('/', async (req, res) => {
  try {
    const { niche, city, maxResults } = req.body;

    if (!niche || !city) {
      return res.status(400).json({ error: 'niche and city are required' });
    }

    const cappedMax = Math.min(Number(maxResults) || 10, 50);

    const apifyRun = await apify.startGoogleMapsScrape({
      niche,
      city,
      maxResults: cappedMax,
    });

    const scrapeRun = {
      id: uuidv4(),
      runId: apifyRun.id,
      datasetId: apifyRun.defaultDatasetId,
      niche,
      city,
      maxResults: cappedMax,
      status: apifyRun.status || 'RUNNING',
      insertedCount: 0,
      skippedCount: 0,
      createdAt: new Date().toISOString(),
    };

    store.insertScrapeRun(scrapeRun);

    res.json(scrapeRun);
  } catch (err) {
    console.error('[POST /api/scrape] error:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to start scrape. Check your APIFY_TOKEN and actor id in server/.env.',
      details: err.response?.data?.error?.message || err.message,
    });
  }
});

/**
 * GET /api/scrape/:runId
 * Polls Apify for run status. If finished and not yet imported, pulls the
 * dataset and imports new prospects (dedup by placeId), mirroring what
 * `checkAndImportRun` did in the original Base44 template.
 */
router.get('/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    let scrapeRun = store.getScrapeRun(runId);

    if (!scrapeRun) {
      return res.status(404).json({ error: 'Scrape run not found' });
    }

    // Already finished and imported — just return cached state.
    if (scrapeRun.status === 'SUCCEEDED' || scrapeRun.status === 'FAILED') {
      return res.json(scrapeRun);
    }

    const apifyStatus = await apify.getRunStatus(runId);

    if (apifyStatus.status === 'RUNNING' || apifyStatus.status === 'READY') {
      scrapeRun = store.updateScrapeRun(runId, { status: 'RUNNING' });
      return res.json(scrapeRun);
    }

    if (apifyStatus.status === 'SUCCEEDED') {
      const items = await apify.getDatasetItems(apifyStatus.defaultDatasetId);

      let inserted = 0;
      let skipped = 0;

      for (const item of items) {
        const prospect = apify.mapPlaceToProspect(item, {
          niche: scrapeRun.niche,
          city: scrapeRun.city,
        });

        if (!prospect.placeId) {
          skipped++;
          continue;
        }

        const existing = store.getProspectByPlaceId(prospect.placeId);
        if (existing) {
          skipped++;
          continue;
        }

        store.insertProspect({
          id: uuidv4(),
          ...prospect,
          qualified: false,
          createdAt: new Date().toISOString(),
        });
        inserted++;
      }

      scrapeRun = store.updateScrapeRun(runId, {
        status: 'SUCCEEDED',
        insertedCount: inserted,
        skippedCount: skipped,
      });

      return res.json(scrapeRun);
    }

    // FAILED, ABORTED, TIMED-OUT, etc.
    scrapeRun = store.updateScrapeRun(runId, { status: apifyStatus.status });
    return res.json(scrapeRun);
  } catch (err) {
    console.error('[GET /api/scrape/:runId] error:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to check scrape run',
      details: err.response?.data?.error?.message || err.message,
    });
  }
});

/**
 * GET /api/scrape
 * Lists all past scrape runs (most recent first).
 */
router.get('/', (req, res) => {
  res.json(store.getAllScrapeRuns());
});

module.exports = router;
