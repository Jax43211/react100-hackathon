// server/index.js (CommonJS)

const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);

const {
  OPENSKY_CLIENT_ID,
  OPENSKY_CLIENT_SECRET,
  PORT = 4000,
} = process.env;

if (!OPENSKY_CLIENT_ID || !OPENSKY_CLIENT_SECRET) {
  console.error('Missing OPENSKY_CLIENT_ID or OPENSKY_CLIENT_SECRET in .env');
  process.exit(1);
}

const TOKEN_URL =
  'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
const OPENSKY_API = 'https://opensky-network.org/api/states/all';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const body = new URLSearchParams();
  body.append('grant_type', 'client_credentials');
  body.append('client_id', OPENSKY_CLIENT_ID);
  body.append('client_secret', OPENSKY_CLIENT_SECRET);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  const accessToken = json.access_token;
  const expiresIn = json.expires_in || 1800;

  cachedToken = accessToken;
  tokenExpiresAt = Date.now() + expiresIn * 1000;

  return accessToken;
}

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/flights', async (req, res) => {
  try {
    const token = await getAccessToken();

    const { lamin, lomin, lamax, lomax } = req.query;

    const url = new URL(OPENSKY_API);
    if (lamin) url.searchParams.set('lamin', lamin);
    if (lomin) url.searchParams.set('lomin', lomin);
    if (lamax) url.searchParams.set('lamax', lamax);
    if (lomax) url.searchParams.set('lomax', lomax);

    const openskyRes = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!openskyRes.ok) {
      const text = await openskyRes.text();
      return res
        .status(openskyRes.status)
        .json({ error: 'OpenSky error', details: text });
    }

    const data = await openskyRes.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
