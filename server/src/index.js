require('dotenv').config();
const express = require('express');
const cors = require('cors');

const scrapeRoutes = require('./routes/scrape');
const prospectsRoutes = require('./routes/prospects');
const stagesRoutes = require('./routes/stages');
const { requireAccessCode } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/stages',    requireAccessCode, stagesRoutes);
app.use('/api/scrape',    requireAccessCode, scrapeRoutes);
app.use('/api/prospects', requireAccessCode, prospectsRoutes);

app.listen(PORT, () => {
  console.log(`Lead scraper API running on http://localhost:${PORT}`);
  if (!process.env.APIFY_TOKEN) console.warn('NOTE: APIFY_TOKEN not set.');
  if (!process.env.ACCESS_CODE) console.warn('NOTE: ACCESS_CODE not set — API is open.');
});
