// Simple JSON-file-backed data store.
//
// This file is the ONLY place that knows about the storage mechanism.
// Every other file in the app calls these functions (getProspects, saveProspect, etc.)
// without caring how/where the data physically lives.
//
// To swap to a real database later (Postgres, MySQL, etc.):
//   1. Keep the exact same exported function names and shapes.
//   2. Replace the internals below with real queries (e.g. using `pg` or `mysql2`).
//   3. Nothing else in the app needs to change.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ prospects: [], scrapeRuns: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ---------- Prospects ----------

function getProspects({ niche, city } = {}) {
  const db = readDb();
  let results = db.prospects;
  if (niche) {
    results = results.filter((p) => p.niche.toLowerCase() === niche.toLowerCase());
  }
  if (city) {
    results = results.filter((p) => p.city.toLowerCase() === city.toLowerCase());
  }
  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getProspectByPlaceId(placeId) {
  const db = readDb();
  return db.prospects.find((p) => p.placeId === placeId) || null;
}

function insertProspect(prospect) {
  const db = readDb();
  db.prospects.push(prospect);
  writeDb(db);
  return prospect;
}

function updateProspect(id, updates) {
  const db = readDb();
  const idx = db.prospects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.prospects[idx] = { ...db.prospects[idx], ...updates };
  writeDb(db);
  return db.prospects[idx];
}

// ---------- Scrape Runs ----------

function insertScrapeRun(run) {
  const db = readDb();
  db.scrapeRuns.push(run);
  writeDb(db);
  return run;
}

function updateScrapeRun(runId, updates) {
  const db = readDb();
  const idx = db.scrapeRuns.findIndex((r) => r.runId === runId);
  if (idx === -1) return null;
  db.scrapeRuns[idx] = { ...db.scrapeRuns[idx], ...updates };
  writeDb(db);
  return db.scrapeRuns[idx];
}

function getScrapeRun(runId) {
  const db = readDb();
  return db.scrapeRuns.find((r) => r.runId === runId) || null;
}

function getAllScrapeRuns() {
  const db = readDb();
  return db.scrapeRuns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  getProspects,
  getProspectByPlaceId,
  insertProspect,
  updateProspect,
  insertScrapeRun,
  updateScrapeRun,
  getScrapeRun,
  getAllScrapeRuns,
};
