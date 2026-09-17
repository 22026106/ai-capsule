const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get('/github', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.CALLBACK_URL,
    scope: 'read:user'
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.CALLBACK_URL
    })
  });
  const { access_token } = await tokenRes.json();

  if (!access_token) {
    return res.status(401).send('OAuth failed');
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `token ${access_token}` }
  });
  const ghUser = await userRes.json();

  const appToken = jwt.sign(
    { user_id: String(ghUser.id), username: ghUser.login },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', appToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.redirect('/dashboard');
});

module.exports = router;