// ======== 🎧 Spotify Daily Song (CommonJS version for Vercel) ========
// Fetch a random track from your playlist every day and return as JSON.

const fetch = require("node-fetch");

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Replace with your playlist ID (from your playlist URL)
const PLAYLIST_ID = "4QT911TLoITPYZX3Ja72SO"; // Eliabricot’s playlist 🎵

async function getAccessToken() {
  const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error("Unable to get Spotify token");
  const data = await res.json();
  return data.access_token;
}

async function getPlaylistTracks(token) {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Unable to load playlist");
  const data = await res.json();
  return data.items.map((item) => item.track);
}

function getDailyIndex(length) {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / 86400000
  );
  return dayOfYear % length;
}

module.exports = async (req, res) => {
  try {
    const token = await getAccessToken();
    const tracks = await getPlaylistTracks(token);

    if (!tracks.length) throw new Error("No tracks in playlist");

    const index = getDailyIndex(tracks.length);
    const track = tracks[index];

    res.status(200).json({
      name: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      url: track.external_urls.spotify,
      albumArt: track.album.images?.[0]?.url || null,
    });
  } catch (err) {
    console.error("Spotify API error:", err);
    res.status(500).json({ error: "Impossible de charger la playlist..." });
  }
};
