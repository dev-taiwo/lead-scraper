const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_STAGES = [
  { id: 'stage-1', name: 'New',       order: 1, color: '#94a3b8' },
  { id: 'stage-2', name: 'Contacted', order: 2, color: '#3b82f6' },
  { id: 'stage-3', name: 'Booked',    order: 3, color: '#a855f7' },
  { id: 'stage-4', name: 'Closed',    order: 4, color: '#22c55e' },
  { id: 'stage-5', name: 'Dead',      order: 5, color: '#ef4444' },
];

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      prospects: [],
      scrapeRuns: [],
      stages: DEFAULT_STAGES,
    }, null, 2));
  } else {
    // Migrate existing DB that doesn't have a stages key yet
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    let dirty = false;
    if (!db.stages) { db.stages = DEFAULT_STAGES; dirty = true; }
    if (dirty) fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ---------- Stages ----------

function getStages() {
  const db = readDb();
  return [...db.stages].sort((a, b) => a.order - b.order);
}

function getStageById(id) {
  const db = readDb();
  return db.stages.find((s) => s.id === id) || null;
}

function insertStage(stage) {
  const db = readDb();
  db.stages.push(stage);
  writeDb(db);
  return stage;
}

function updateStage(id, updates) {
  const db = readDb();
  const idx = db.stages.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  db.stages[idx] = { ...db.stages[idx], ...updates };
  writeDb(db);
  return db.stages[idx];
}

function deleteStage(id) {
  const db = readDb();
  const idx = db.stages.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  db.stages.splice(idx, 1);
  // Reassign any prospects in this stage back to 'new'
  db.prospects = db.prospects.map((p) =>
    p.stage_id === id ? { ...p, stage_id: 'new' } : p
  );
  writeDb(db);
  return true;
}

// ---------- Prospects ----------

function getProspects({ niche, city, stage_id } = {}) {
  const db = readDb();
  let results = db.prospects;
  if (niche)    results = results.filter((p) => p.niche.toLowerCase() === niche.toLowerCase());
  if (city)     results = results.filter((p) => p.city.toLowerCase() === city.toLowerCase());
  if (stage_id) results = results.filter((p) => p.stage_id === stage_id);
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
  getStages, getStageById, insertStage, updateStage, deleteStage,
  getProspects, getProspectByPlaceId, insertProspect, updateProspect,
  insertScrapeRun, updateScrapeRun, getScrapeRun, getAllScrapeRuns,
};
