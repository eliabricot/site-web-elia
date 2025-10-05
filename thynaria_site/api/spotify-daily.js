// api/spotify-daily.js
// Serverless Node (Vercel) – utilise le fetch global. Ajoute ?health=1 ou ?debug=1 pour diagnostiquer.

const DEFAULT_PLAYLIST_ID = "4QT911TLoITPYZX3Ja72SO";

function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

async function getAccessToken({ id, secret }) {
  const body = new URLSearchParams({ grant_type: "client_credentials" }).toString();
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body,
  });
  const json = await r.json();
  if (!r.ok || !json.access_token) {
    throw new Error("TOKEN_ERROR " + JSON.stringify(json));
  }
  return json.access_token;
}

async function getPlaylistTracks(token, playlistId) {
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
  const items = [];
  while (url) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await r.json();
    if (!r.ok) throw new Error("PLAYLIST_ERROR " + JSON.stringify(json));
    (json.items || []).forEach((it) => it && it.track && items.push(it.track));
    url = json.next || null;
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
  const q = (req && req.query) || {};
  const health = q.health === "1";
  const debug = q.debug === "1";
  const playlistId = q.playlist || DEFAULT_PLAYLIST_ID;

  try {
    // --- mode health: ne contacte pas Spotify, retourne juste l’état local
    if (health) {
      const info = {
        node: process.version,
        fetchAvailable: typeof fetch === "function",
        hasClientId: Boolean(process.env.SPOTIFY_CLIENT_ID),
        hasClientSecret: Boolean(process.env.SPOTIFY_CLIENT_SECRET),
        playlistId,
        cwd: process.cwd(),
      };
      return res.status(200).json(info);
    }

    // --- exécution normale
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      throw new Error("ENV_MISSING SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
    }

    console.log("[spotify-daily] getting token…");
    const token = await getAccessToken({
      id: process.env.SPOTIFY_CLIENT_ID,
      secret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    console.log("[spotify-daily] token OK, fetching playlist:", playlistId);
    const tracks = await getPlaylistTracks(token, playlistId);
    if (!tracks.length) throw new Error("EMPTY_PLAYLIST");

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");

    if (q.single === "1") {
      const idx = dayOfYear() % tracks.length;
      return res.status(200).json(tracks[idx]);
    }
    return res.status(200).json(tracks);
  } catch (e) {
    console.error("[spotify-daily] ERROR:", e && e.message);
    // en debug, renvoie le message exact
    const msg = debug ? String(e && e.message) : "Internal error";
    return res.status(500).json({ error: msg });
  }
};
