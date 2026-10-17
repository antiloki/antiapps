// antiHunt free trial: signup -> our side reads public conversations -> live progress here -> leads by email (closing the page is fine).
(() => {
  const API = window.AH_API || "";           // antiHunt trial server (Rust, self-hosted); empty until deployed
  const SITEKEY = window.AH_TURNSTILE || ""; // Cloudflare Turnstile site key
  const $ = (id) => document.getElementById(id);
  const ev = (e, x) => window.ahEvent?.(e, x);
  ev("trial_open");
  let tsToken = "", started = false;
  if (SITEKEY) {
    window.onTs = () => window.turnstile.render("#ts", { sitekey: SITEKEY, callback: (t) => { tsToken = t; } });
    const s = document.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTs"; s.async = true; document.head.appendChild(s);
  }
  $("f").addEventListener("input", () => { if (!started) { started = true; ev("form_start"); } });
  const say = (text, ok) => { const m = $("msg"); m.textContent = text; m.className = `msg ${ok ? "ok" : "err"}`; m.style.display = "block"; };
  const friendly = { 404: "The free trial opens soon. Check back in a few days.", 409: "A free trial was already used for this email or link.", 429: "Too many requests from your network today. Try again tomorrow." };
  $("f").addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = { email: $("email").value.trim(), link: $("link").value.trim() };
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v.email)) return say("Please enter a valid email.");
    if (!/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v.link)) return say("Paste your website or a social profile link.");
    if (!API) return say(friendly[404]);
    if (SITEKEY && !tsToken) return say("Please complete the check above.");
    $("go").disabled = true;
    try {
      const r = await fetch(`${API}/api/trial`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...v, turnstile: tsToken, language: navigator.language.startsWith("pt") ? "pt" : "" }) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) return say(friendly[r.status] || b.error || `Something went wrong (${r.status}). Try again later.`);
      ev("submit");
      localStorage.setItem("ahTrial", JSON.stringify({ id: b.id, view: b.view, email: v.email }));
      $("f").style.display = "none"; watch();
    } catch { say("Could not reach the server. Check your connection and try again."); }
    finally { $("go").disabled = false; }
  });

  // Live progress (public-safe: stages, counts, platforms, public source titles).
  const STAGES = { unconfirmed: "Confirm your email", queued: "In the queue", research: "Understanding your business", campaigns: "Planning where buyers talk", discover: "Reading public conversations", verify: "Checking every candidate", email: "Writing your email", sent: "Sent" };
  async function watch() {
    const t = JSON.parse(localStorage.getItem("ahTrial") || "null");
    if (!t) return;
    $("f").style.display = "none"; $("live").style.display = "block";
    let p = {};
    try { p = await (await fetch(`${API}/api/trial/progress`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: t.id, view: t.view }) })).json(); } catch {}
    const st = p.status === "running" ? p.stage : p.status;
    $("lstage").textContent = p.status === "done" ? "Done! Check your inbox." : STAGES[st] || "Working…";
    $("lnote").textContent = p.status === "unconfirmed" ? `We sent a link to ${t.email}. Click it to start.` : p.status === "queued" ? `You are #${p.position || "?"} in line. Leads arrive within 24 hours.` : p.status === "done" ? `Your leads were emailed to ${t.email}.` : `You can close this page: your leads will be emailed to ${t.email}.`;
    $("lcount").textContent = p.candidates != null ? `${p.candidates} conversations kept · ${p.leads || 0} verified leads so far` : "";
    $("lplat").innerHTML = (p.platforms || []).map((x) => `<li>${x.platform}: ${x.done}/${x.total} searches read</li>`).join("");
    $("lsrc").innerHTML = (p.recent_sources || []).map((x) => `<li>${x.platform} · ${x.title.replace(/</g, "&lt;")}</li>`).join("");
    if (p.status === "done") { localStorage.removeItem("ahTrial"); return; }
    setTimeout(watch, 10000);
  }
  watch();
})();
