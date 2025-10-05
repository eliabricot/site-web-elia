// api/env.js — ne fait RIEN d'externe, juste un écho d'état
module.exports = (req, res) => {
  res.status(200).json({
    node: process.version,
    hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
    hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
    env: process.env.VERCEL_ENV || "unknown",
    cwd: process.cwd(),
  });
};
