// thynaria_site/api/twitch.js
export default async function handler(req, res) {
  try {
    const user = (req.query.user || process.env.TWITCH_USER_LOGIN || "").toLowerCase();
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret || !user) {
      return res.status(500).json({ error: "Missing Twitch config" });
    }

    // Obtenir un app token OAuth
    const tokenResp = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: "POST" }
    );
    const tokenJson = await tokenResp.json();
    const token = tokenJson.access_token;

    // Récupérer le statut du stream
    const streamsResp = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(user)}`,
      {
        headers: {
          "Client-ID": clientId,
          "Authorization": `Bearer ${token}`,
        },
      }
    );
    const payload = await streamsResp.json();
    const isLive = Array.isArray(payload.data) && payload.data.length > 0;

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

    if (!isLive) return res.json({ live: false });

    const s = payload.data[0];
    return res.json({
      live: true,
      title: s.title,
      game_name: s.game_name,
      viewer_count: s.viewer_count,
      started_at: s.started_at,
      thumbnail_url: s.thumbnail_url,
      url: `https://twitch.tv/${user}`,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Twitch API error" });
  }
}
