const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../db/store');

const router = express.Router();

// GET /api/stages
router.get('/', (req, res) => {
  res.json(store.getStages());
});

// POST /api/stages
router.post('/', (req, res) => {
  const { name, order, color } = req.body;
  if (!name || order == null) {
    return res.status(400).json({ error: 'name and order are required' });
  }
  const stage = store.insertStage({
    id: uuidv4(),
    name,
    order: Number(order),
    color: color || '#3b82f6',
  });
  res.status(201).json(stage);
});

// PATCH /api/stages/:id
router.patch('/:id', (req, res) => {
  const updated = store.updateStage(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Stage not found' });
  res.json(updated);
});

// DELETE /api/stages/:id
router.delete('/:id', (req, res) => {
  const ok = store.deleteStage(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Stage not found' });
  res.json({ ok: true });
});

module.exports = router;
