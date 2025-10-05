// thynaria_site/api/spotifyDaily.js
module.exports = async (req, res) => {
  try {
    const playlistId = (req.query && req.query.playlist) || "4QT911TLoITPYZX3Ja72SO";
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Missing SPOTIFY_CLIENT_ID/SECRET env vars" });
    }

    // 1) Token (Client Credentials)
    const tokenResp = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });
    const tokenJson = await tokenResp.json();
    if (!tokenResp.ok || !tokenJson.access_token) {
      return res.status(500).json({ error: "Spotify token error", details: tokenJson });
    }

    // 2) Playlist tracks (public)
    const plResp = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(name,artists(name),external_urls,album(images),preview_url)),next`,
      { headers: { Authorization: `Bearer ${tokenJson.access_token}` } }
    );
    const plJson = await plResp.json();
    if (!plResp.ok || !plJson.items) {
      return res.status(500).json({ error: "Spotify playlist error", details: plJson });
    }

    const items = plJson.items
      .map((it) => it.track)
      .filter(Boolean)
      .map((t) => ({
        title: t.name,
        artist: (t.artists || []).map((a) => a.name).join(", "),
        url: t.external_urls?.spotify || "",
        cover: t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || "",
        preview_url: t.preview_url || "",
      }));

    // Option: renvoyer directement "le morceau du jour"
    if (req.query && (req.query.single === "1" || req.query.single === 1)) {
      const today = Math.floor(Date.now() / 86400000);
      const pick = items.length ? items[today % items.length] : null;
      res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
      return res.status(200).json(pick || {});
    }

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    return res.status(200).json(items);
  } catch (e) {
    console.error(e);
    return res.status(200).json([]); // front gère le vide
  }
};