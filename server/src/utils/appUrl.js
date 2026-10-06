// Public URL of the frontend, used to build links in emails. Falls back to
// the first allowed CORS origin so local development needs no extra config.
export function getAppUrl() {
  const fallback = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0].trim();
  return (process.env.APP_URL || fallback).replace(/\/$/, '');
}
