// /api/spotify-daily.js
export default async function handler(req, res) {
  const playlistId = req.query.playlist || "4QT911TLoITPYZX3Ja72SO"; // ta playlist par défaut
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  try {
    // Obtenir le token d’accès (client credentials)
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) throw new Error("Impossible d’obtenir le token Spotify.");

    // Récupérer les morceaux de la playlist
    const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
