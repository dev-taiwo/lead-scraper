const express = require('express');
const store = require('../db/store');

const router = express.Router();

const ALLOWED_PATCH_FIELDS = [
  'qualified', 'stage_id', 'priority', 'notes',
  'next_step', 'last_contacted_at', 'next_follow_up',
];

router.get('/', (req, res) => {
  const { niche, city, stage_id } = req.query;
  res.json(store.getProspects({ niche, city, stage_id }));
});

router.patch('/:id', (req, res) => {
  const updates = {};
  for (const key of ALLOWED_PATCH_FIELDS) {
    if (key in req.body) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  const updated = store.updateProspect(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'Prospect not found' });
  res.json(updated);
});

router.get('/export/csv', (req, res) => {
  const { niche, city, stage_id } = req.query;
  const prospects = store.getProspects({ niche, city, stage_id });

  const headers = [
    'Name','Phone','Email','Website','Address','Rating','Reviews Count',
    'Niche','City','Stage','Priority','Last Contacted','Next Step',
    'Next Follow-up','Notes','Qualified',
  ];

  const escapeCsv = (val) => {
    if (val == null) return '';
    const str = String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const stages = store.getStages();
  const stageMap = Object.fromEntries(stages.map((s) => [s.id, s.name]));

  const rows = prospects.map((p) =>
    [
      p.name, p.phone, p.email, p.website, p.address, p.rating, p.reviewsCount,
      p.niche, p.city,
      stageMap[p.stage_id] || p.stage_id || 'New',
      p.priority || 'medium',
      p.last_contacted_at || '',
      p.next_step || '',
      p.next_follow_up || '',
      p.notes || '',
      p.qualified ? 'Yes' : 'No',
    ].map(escapeCsv).join(',')
  );

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
  res.send([headers.join(','), ...rows].join('\n'));
});

module.exports = router;
