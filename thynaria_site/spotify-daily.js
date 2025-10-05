// api/spotify-daily.js — CommonJS, zéro warning, zéro dépendance.

const DEFAULT_PLAYLIST_ID = "4QT911TLoITPYZX3Ja72SO";

function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

async function getToken() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("ENV_MISSING");

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(id + ":" + secret).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });

  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error("TOKEN_ERROR " + JSON.stringify(j));
  return j.access_token;
}

async function getTracks(token, playlistId) {
  const r = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const j = await r.json();
  if (!r.ok) throw new Error("PLAYLIST_ERROR " + JSON.stringify(j));

  const items = (j.tracks?.items || []).map((it) => it.track).filter(Boolean);
  return items.map((t) => ({
    title: t.name,
    artist: (t.artists || []).map((a) => a.name).join(", "),
    url: t.external_urls?.spotify || "",
    cover: t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || "",
    preview_url: t.preview_url || "",
  }));
}

module.exports = async (req, res) => {
  try {
    const q = (req && req.query) || {};
    const playlistId = q.playlist || DEFAULT_PLAYLIST_ID;
    const single = q.single === "1";

    const token = await getToken();
    const tracks = await getTracks(token, playlistId);

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");

    if (single) {
      const idx = dayOfYear() % Math.max(tracks.length, 1);
      return res.status(200).json(tracks[idx] || {});
    }
    return res.status(200).json(tracks);
  } catch (e) {
    console.error("[spotify-daily] ERROR:", e?.message);
    return res.status(500).json({ error: "Internal error" });
  }
};

