const express = require('express');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/auth', require('./auth'));
app.use('/api/capsules', require('./routes/capsules'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const { initDb } = require('./db');

initDb().then(() => {
  app.listen(3000, () => console.log('Server running on port 3000'));
});