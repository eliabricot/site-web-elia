// --- Ton petit script de base ---
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#site-nav");

if (navToggle) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const text = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      const old = btn.textContent;
      btn.textContent = "copié ✓";
      setTimeout(() => (btn.textContent = old), 1200);
    } catch (e) {
      console.error(e);
    }
  });
});

document.getElementById("year").textContent = new Date().getFullYear();


// --- ↓↓↓ Le gros script (tout ton code API et daily) ↓↓↓ ---
// ===== Utils date =====
const pad = n => (n < 10 ? "0" + n : "" + n);
const yyyymmdd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
function dayOfYear(date = new Date()){
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / (1000*60*60*24));
}

// ===== Copier UID =====
function copyUID(uid){
  navigator.clipboard.writeText(uid).then(()=>{
    const t = document.getElementById("toast");
    t.textContent = "UID copié : " + uid;
    t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"), 1600);
  });
}

// ===== Now Playing (Discord -> Spotify via Lanyard) =====
const DISCORD_ID = "554436717260832770";
// ... (et tu continues tout le code comme tu l’as copié) ...
