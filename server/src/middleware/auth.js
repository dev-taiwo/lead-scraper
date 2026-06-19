// Simple shared-secret protection.
//
// This app is meant for a single user (you), but once deployed publicly,
// anyone who finds the URL could otherwise trigger scrapes on your Apify
// account. This middleware requires a passcode header on every request,
// checked against an env var you set in your hosting dashboard (never in code).
//
// This is NOT full authentication (no accounts, no sessions) — it's a basic
// gate appropriate for "only I use this" deployments. If you ever open this
// up to a team, swap this for real auth.

function requireAccessCode(req, res, next) {
  const expected = process.env.ACCESS_CODE;

  // If no ACCESS_CODE is set (e.g. local dev), skip the check entirely.
  if (!expected) {
    return next();
  }

  const provided = req.headers['x-access-code'];

  if (provided !== expected) {
    return res.status(401).json({ error: 'Invalid or missing access code.' });
  }

  next();
}

module.exports = { requireAccessCode };
