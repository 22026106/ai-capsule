const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const { initDb } = require('./db');

initDb().then(() => {
  app.listen(3000, () => console.log('Server running on port 3000'));
});