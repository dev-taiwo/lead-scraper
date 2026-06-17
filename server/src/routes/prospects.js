const express = require('express');
const store = require('../db/store');

const router = express.Router();

/**
 * GET /api/prospects?niche=&city=
 * Returns prospects, optionally filtered.
 */
router.get('/', (req, res) => {
  const { niche, city } = req.query;
  const prospects = store.getProspects({ niche, city });
  res.json(prospects);
});

/**
 * PATCH /api/prospects/:id
 * Body: { qualified: true/false }
 * Used by the results table's "Qualified" checkbox.
 */
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { qualified } = req.body;

  if (typeof qualified !== 'boolean') {
    return res.status(400).json({ error: 'qualified must be a boolean' });
  }

  const updated = store.updateProspect(id, { qualified });

  if (!updated) {
    return res.status(404).json({ error: 'Prospect not found' });
  }

  res.json(updated);
});

/**
 * GET /api/prospects/export/csv?niche=&city=
 * Streams a CSV file of the (optionally filtered) prospects.
 */
router.get('/export/csv', (req, res) => {
  const { niche, city } = req.query;
  const prospects = store.getProspects({ niche, city });

  const headers = [
    'Name',
    'Phone',
    'Email',
    'Website',
    'Address',
    'Rating',
    'Reviews Count',
    'Niche',
    'City',
    'Qualified',
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = prospects.map((p) =>
    [
      p.name,
      p.phone,
      p.email,
      p.website,
      p.address,
      p.rating,
      p.reviewsCount,
      p.niche,
      p.city,
      p.qualified ? 'Yes' : 'No',
    ]
      .map(escapeCsv)
      .join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
  res.send(csv);
});

module.exports = router;
