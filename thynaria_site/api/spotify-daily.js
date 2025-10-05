export default async function handler(req, res) {
  try {
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!client_id || !client_secret) {
      throw new Error("Missing Spotify credentials");
    }

    // --- étape 1 : obtenir un token ---
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error("Token error:", tokenData);
      return res.status(500).json({ error: "Failed to get token", details: tokenData });
    }

    const token = tokenData.access_token;

    // --- si juste test debug ---
    if (req.query.debug) {
      return res.status(200).json({ ok: true, tokenPreview: token.slice(0, 10) + "...", env: "ok" });
    }

    // --- étape 2 : récupérer la playlist ---
    const playlistId = req.query.playlist || "4QT911TLoITPYZX3Ja72SO";
    const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const playlistData = await playlistResponse.json();

    if (playlistResponse.status !== 200) {
      console.error("Playlist error:", playlistData);
      return res.status(500).json({ error: "Playlist fetch failed", details: playlistData });
    }

    // --- étape 3 : simplifier les données ---
    const tracks = playlistData.tracks.items.map((item) => ({
      name: item.track.name,
      artist: item.track.artists.map((a) => a.name).join(", "),
      url: item.track.external_urls.spotify,
    }));

    res.status(200).json({
      playlist: playlistData.name,
      tracks,
      count: tracks.length,
    });
  } catch (err) {
    console.error("Handler error:", err);
    res.status(500).json({ error: err.message });
  }
}
