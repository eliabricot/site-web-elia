/* ========= CONFIG ========= */
const DISCORD_ID = "554436717260832770"; // ton ID Discord exact

/* ========= Utils ========= */
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function copyUID(uid) {
  navigator.clipboard.writeText(uid);
  showToast("UID copié !");
}

/* ========= NOW PLAYING (via Discord Lanyard) ========= */
async function loadNowPlaying() {
  const box = document.getElementById("np-content");

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
    const data = await res.json();
    if (!data.success) throw new Error("Lanyard error");

    const spotify = data.data.spotify;
    if (spotify) {
      box.innerHTML = `
        <div class="np">
          <img src="${spotify.album_art_url}" alt="cover">
          <div class="t">
            <span class="title">${spotify.song}</span>
            <span class="artist">${spotify.artist}</span>
            <a href="https://open.spotify.com/track/${spotify.track_id}" target="_blank">ouvrir sur Spotify</a>
          </div>
        </div>
      `;
    } else {
      box.innerHTML = `<p style="opacity:.7">rien en écoute pour le moment…</p>`;
    }
  } catch (e) {
    console.error(e);
    box.innerHTML = `<p style="opacity:.7">erreur de connexion à Lanyard</p>`;
  }
}

/* ========= Murmure du jour (Anime / Genshin / Hollow Knight) ========= */
const QUOTES = [
  { t: "No cost too great.", s: "Hollow Knight" },
  { t: "Embrace the void.", s: "Hollow Knight" },
  { t: "Our strength will return.", s: "Hollow Knight" },
  { t: "May the wind bless your journey.", s: "Venti — Genshin Impact" },
  { t: "Through wisdom, we endure.", s: "Nahida — Genshin Impact" },
  { t: "Stars guide those who listen.", s: "Mona — Genshin Impact" },
  { t: "Fly.", s: "Haikyuu!!" },
  { t: "Get in the robot.", s: "Evangelion" },
  { t: "Plus Ultra!", s: "My Hero Academia" },
  { t: "I'll be King of the Pirates!", s: "One Piece" },
];

function seededPick(arr) {
  const d = new Date();
  const seed = d.getUTCFullYear()*10000 + (d.getUTCMonth()+1)*100 + d.getUTCDate();
  let x = seed ^ 0x9e3779b9;
  x ^= x << 13; x ^= x >> 17; x ^= x << 5;
  return arr[Math.abs(x) % arr.length];
}

function renderDailyQuote() {
  const { t, s } = seededPick(QUOTES);
  document.getElementById("quote-box").innerHTML = `<p>"${t}"<br><span style="opacity:.7">— ${s}</span></p>`;
}

/* ========= Twitch (via /api/twitch) ========= */
async function checkTwitchLive() {
  const twBox = document.getElementById("twitch-box");
  const section = document.getElementById("tw");

  try {
    const r = await fetch("/api/twitch");
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();

    if (data.live) {
      section.classList.add("live");
      const thumb = data.thumbnail ? `<img src="${data.thumbnail}" alt="" style="width:100%;max-width:560px;border-radius:10px;margin:8px auto;display:block">` : "";
      twBox.innerHTML = `
        <p>🏮 En live : <strong>${data.title || "Stream en cours"}</strong>${data.game ? ` — <span style="opacity:.8">${data.game}</span>` : ""}</p>
        ${thumb}
        <p style="margin-top:.5rem"><a href="${data.url}" target="_blank" rel="noopener">Rejoindre le stream</a></p>
      `;
    } else {
      section.classList.remove("live");
      twBox.innerHTML = `<p>Actuellement <strong>hors ligne</strong> 🌙</p>`;
    }
  } catch (e) {
    console.error(e);
    twBox.innerHTML = `<p>Impossible de vérifier le statut Twitch.</p>`;
  }
}

/* ========= INIT ========= */
window.addEventListener("DOMContentLoaded", () => {
  loadNowPlaying();
  renderDailyQuote();
  checkTwitchLive();

  // Mise à jour Spotify auto toutes les 15s
  setInterval(loadNowPlaying, 15000);
});
