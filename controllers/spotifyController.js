/**
 * Spotify OAuth and token handling for Web Playback SDK.
 * Requires SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REDIRECT_URI in .env.
 */

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

function getRedirectUri(req) {
  const base = process.env.SPOTIFY_REDIRECT_URI;
  if (base) return base;
  const host = req.get('host') || 'localhost:3000';
  const proto = req.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}/music/spotify-callback`;
}

function getCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  return { clientId, clientSecret };
}

function isConfigured() {
  return !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_REDIRECT_URI);
}

/**
 * Return whether Spotify app is configured (so the Music page can hide the block if not).
 */
function status(req, res) {
  res.json({ configured: isConfigured() });
}

/**
 * Redirect user to Spotify authorization.
 */
function login(req, res) {
  if (!isConfigured()) {
    return res.redirect('/music?spotify=unconfigured');
  }
  const { clientId } = getCredentials();
  const redirectUri = getRedirectUri(req);
  const state = Math.random().toString(36).slice(2);
  req.session.spotify_state = state;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  });
  res.redirect(SPOTIFY_AUTH_URL + '?' + params.toString());
}

/**
 * Handle callback from Spotify: exchange code for tokens and store in session.
 */
async function callback(req, res) {
  const { code, state, error } = req.query;
  if (error) {
    return res.redirect('/music?spotify_error=' + encodeURIComponent(error));
  }
  if (state !== req.session.spotify_state) {
    return res.redirect('/music?spotify_error=invalid_state');
  }
  req.session.spotify_state = undefined;

  const { clientId, clientSecret } = getCredentials();
  if (!clientId || !clientSecret) {
    return res.redirect('/music?spotify_error=not_configured');
  }

  const redirectUri = getRedirectUri(req);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Spotify token exchange failed:', response.status, text);
    return res.redirect('/music?spotify_error=token_failed');
  }

  const data = await response.json();
  req.session.spotify_access_token = data.access_token;
  req.session.spotify_refresh_token = data.refresh_token;
  req.session.spotify_expires_at = Date.now() + (data.expires_in || 3600) * 1000;
  res.redirect('/music');
}

/**
 * Return current access token, refreshing if expired. For Web Playback SDK.
 */
async function getToken(req, res) {
  let accessToken = req.session.spotify_access_token;
  const refreshToken = req.session.spotify_refresh_token;
  const expiresAt = req.session.spotify_expires_at;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Not connected to Spotify' });
  }

  if (!accessToken || (expiresAt && Date.now() >= expiresAt - 60 * 1000)) {
    const refreshed = await refreshAccessToken(req);
    if (!refreshed) {
      req.session.spotify_access_token = undefined;
      req.session.spotify_refresh_token = undefined;
      req.session.spotify_expires_at = undefined;
      return res.status(401).json({ error: 'Spotify session expired' });
    }
    accessToken = req.session.spotify_access_token;
  }

  return res.json({ accessToken });
}

async function refreshAccessToken(req) {
  const refreshToken = req.session.spotify_refresh_token;
  const { clientId, clientSecret } = getCredentials();
  if (!refreshToken || !clientId || !clientSecret) return false;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    },
    body: body.toString(),
  });

  if (!response.ok) return false;
  const data = await response.json();
  req.session.spotify_access_token = data.access_token;
  if (data.refresh_token) req.session.spotify_refresh_token = data.refresh_token;
  req.session.spotify_expires_at = Date.now() + (data.expires_in || 3600) * 1000;
  return true;
}

/**
 * Refresh token via API (e.g. when SDK reports 401).
 */
async function refresh(req, res) {
  const ok = await refreshAccessToken(req);
  if (!ok) {
    return res.status(401).json({ error: 'Spotify session expired' });
  }
  res.json({ accessToken: req.session.spotify_access_token });
}

/**
 * Disconnect Spotify (clear session).
 */
function disconnect(req, res) {
  req.session.spotify_access_token = undefined;
  req.session.spotify_refresh_token = undefined;
  req.session.spotify_expires_at = undefined;
  res.json({ ok: true });
}

module.exports = {
  status,
  login,
  callback,
  getToken,
  refresh,
  disconnect,
};
