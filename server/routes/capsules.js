const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

// READ - get all of the logged-in user's capsules
router.get('/', async (req, res) => {
  const db = await getDb();
  const rows = await db.all(
    'SELECT * FROM capsules WHERE user_id = ?',
    req.user.user_id
  );
  res.json(rows);
});

// CREATE - add a new capsule for the logged-in user
router.post('/', async (req, res) => {
  const db = await getDb();
  const b = req.body;

  const result = await db.run(
    `INSERT INTO capsules
     (user_id, project_name, prompt_title, prompt_version, prompt_text,
      response_summary, category, usefulness, reviewed, improved, screenshot_url, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    req.user.user_id,
    b.project_name,
    b.prompt_title,
    b.prompt_version,
    b.prompt_text,
    b.response_summary,
    b.category,
    b.usefulness,
    b.reviewed ? 1 : 0,
    b.improved ? 1 : 0,
    b.screenshot_url,
    b.notes
  );

  const newRow = await db.get('SELECT * FROM capsules WHERE id = ?', result.lastID);
  res.status(201).json(newRow);
});

// UPDATE - edit a capsule, only if it belongs to the logged-in user
router.put('/:id', async (req, res) => {
  const db = await getDb();
  const existing = await db.get('SELECT * FROM capsules WHERE id = ?', req.params.id);

  if (!existing || existing.user_id !== req.user.user_id) {
    return res.status(404).json({ error: 'Not found' });
  }

  const b = req.body;
  await db.run(
    `UPDATE capsules SET
      project_name = ?, prompt_title = ?, prompt_version = ?, prompt_text = ?,
      response_summary = ?, category = ?, usefulness = ?, reviewed = ?,
      improved = ?, screenshot_url = ?, notes = ?
     WHERE id = ? AND user_id = ?`,
    b.project_name, b.prompt_title, b.prompt_version, b.prompt_text,
    b.response_summary, b.category, b.usefulness, b.reviewed ? 1 : 0,
    b.improved ? 1 : 0, b.screenshot_url, b.notes,
    req.params.id, req.user.user_id
  );

  const updated = await db.get('SELECT * FROM capsules WHERE id = ?', req.params.id);
  res.json(updated);
});

// DELETE - remove a capsule, only if it belongs to the logged-in user
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  const existing = await db.get('SELECT * FROM capsules WHERE id = ?', req.params.id);

  if (!existing || existing.user_id !== req.user.user_id) {
    return res.status(404).json({ error: 'Not found' });
  }

  await db.run(
    'DELETE FROM capsules WHERE id = ? AND user_id = ?',
    req.params.id,
    req.user.user_id
  );
  res.status(204).end();
});

module.exports = router;