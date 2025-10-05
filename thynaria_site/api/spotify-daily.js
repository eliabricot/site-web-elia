// api/spotify-daily.js — Vercel/Node: utilise le fetch global, pas "node-fetch".

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Id par défaut : ta playlist
const DEFAULT_PLAYLIST_ID = "4QT911TLoITPYZX3Ja72SO";

// jour de l'année (pour un choix déterministe)
function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

async function getAccessToken() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
  }
  const body = new URLSearchParams({ grant_type: "client_credentials" }).toString();
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
    },
    body,
  });
  const json = await r.json();
  if (!r.ok || !json.access_token) {
    throw new Error("Spotify token error: " + JSON.stringify(json));
  }
  return json.access_token;
}

async function getAllTracksFromPlaylist(token, playlistId) {
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
  const items = [];
  while (url) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await r.json();
    if (!r.ok) throw new Error("Spotify playlist error: " + JSON.stringify(json));
    (json.items || []).forEach((it) => it && it.track && items.push(it.track));
    url = json.next || null; // pagination si >100
  }
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
    const playlistId = (req.query && req.query.playlist) || DEFAULT_PLAYLIST_ID;
    const single = req.query && (req.query.single === "1" || req.query.single === 1);
    const debug = req.query && req.query.debug === "1";

    const token = await getAccessToken();
    const tracks = await getAllTracksFromPlaylist(token, playlistId);

    if (!tracks.length) {
      throw new Error("Playlist empty or private");
    }

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");

    if (single) {
      const idx = dayOfYear() % tracks.length;
      return res.status(200).json(tracks[idx]);
    }

    return res.status(200).json(tracks);
  } catch (e) {
    // En prod on reste simple; en debug=1 on expose le message complet
    const msg = (req.query && req.query.debug === "1") ? String(e && e.message) : "Internal error";
    console.error("spotify-daily error:", e);
    return res.status(500).json({ error: msg });
  }
};
