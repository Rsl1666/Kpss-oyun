/* KPSS Oyun — oyun motoru (bağımlılıksız, vanilla JS) */
(function () {
  "use strict";
  const $app = document.getElementById("app");
  const SUBJ = window.SUBJECTS;
  const SAVE_KEY = "kpss-oyun-v1";

  /* ---------------- yardımcılar ---------------- */
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); };
  const findUnit = (uid) => { for (const s of SUBJ) for (const u of s.units) if (u.id === uid) return { s, u }; return null; };

  /* ---------------- kayıt ---------------- */
  const fresh = () => ({
    xp: 0, stars: {}, streak: 0, lastDay: null, dailyDone: null, mistakes: [], badges: [], sound: true,
    stats: { correct: 0, wrong: 0, games: 0, bestCombo: 0, cleared: 0, bossWins: 0, duelWins: 0, ladderTop: 0 }
  });
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!raw) return fresh();
      const s = Object.assign(fresh(), raw);
      s.stats = Object.assign(fresh().stats, raw.stats || {});
      return s;
    } catch (e) { return fresh(); }
  }
  let S = load();
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* özel pencere vb. */ } };

  /* ---------------- seviye ---------------- */
  const TITLES = ["Aday", "Çırak", "Kalfa", "Usta", "Uzman", "Bilge", "Üstat", "Efsane"];
  function levelInfo(xp) {
    let lvl = 1, need = 100;
    while (xp >= need) { xp -= need; lvl++; need = 100 + (lvl - 1) * 50; }
    return { lvl, cur: xp, need, title: TITLES[Math.min(TITLES.length - 1, Math.floor((lvl - 1) / 2))] };
  }

  /* ---------------- rozetler ---------------- */
  const BADGES = [
    { id: "first", icon: "🎯", name: "İlk Adım", desc: "İlk oyununu tamamla", test: (s) => s.stats.games >= 1 },
    { id: "combo10", icon: "🔥", name: "Alev Alev", desc: "10'luk kombo yap", test: (s) => s.stats.bestCombo >= 10 },
    { id: "star3", icon: "⭐", name: "Kusursuz", desc: "Bir bölümden 3 yıldız al", test: (s) => Object.values(s.stars).some((v) => v >= 3) },
    { id: "boss", icon: "🐉", name: "Ejderha Avcısı", desc: "Bir boss'u yen", test: (s) => s.stats.bossWins >= 1 },
    { id: "streak3", icon: "📅", name: "İstikrar", desc: "3 gün üst üste çalış", test: (s) => s.streak >= 3 },
    { id: "streak7", icon: "🗓️", name: "Haftalık Savaşçı", desc: "7 günlük seri", test: (s) => s.streak >= 7 },
    { id: "c100", icon: "💯", name: "Yüzlük", desc: "Toplam 100 doğru cevap", test: (s) => s.stats.correct >= 100 },
    { id: "clean", icon: "🧹", name: "Hata Avcısı", desc: "Hata defterinden 10 soru temizle", test: (s) => s.stats.cleared >= 10 },
    { id: "lvl5", icon: "🏅", name: "Usta Aday", desc: "5. seviyeye ulaş", test: (s) => levelInfo(s.xp).lvl >= 5 },
    { id: "duel", icon: "⚔️", name: "Düellocu", desc: "Bir düello kazan", test: (s) => s.stats.duelWins >= 1 },
    { id: "tower", icon: "🗼", name: "Kule Fatihi", desc: "Bilgi Kulesi'nin zirvesine çık", test: (s) => s.stats.ladderTop >= 12 }
  ];

  /* ---------------- ses ---------------- */
  let actx = null;
  function beep(freqs, dur = 0.09, type = "sine") {
    if (!S.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * dur;
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 1.6);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur * 1.7);
      });
    } catch (e) { /* ses yok */ }
  }
  const sfx = {
    ok: () => beep([660, 880]), bad: () => beep([220, 160], 0.12, "square"),
    win: () => beep([523, 659, 784, 1047], 0.1), click: () => beep([500], 0.04)
  };

  function confetti() {
    const colors = ["#f1c40f", "#e74c3c", "#2ecc71", "#3498db", "#9b59b6", "#e67e22"];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement("i");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = Math.random() * 0.6 + "s";
      c.style.animationDuration = 1.8 + Math.random() * 1.4 + "s";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 3800);
    }
  }

  /* ---------------- içerik → oyun öğeleri ---------------- */
  function mcItems(u, n) {
    if (u.gen) return Array.from({ length: n }, () => Object.assign(u.gen.mc(), { src: u.title }));
    return shuffle(u.mc).slice(0, n).map(([q, opts, ai, ex]) => ({ type: "mc", q, opts: shuffle(opts), a: opts[ai], ex, src: u.title }));
  }
  function tfItems(u, n) {
    if (u.gen) return Array.from({ length: n }, () => Object.assign(u.gen.tf(), { src: u.title }));
    return shuffle(u.tf).slice(0, n).map(([q, a, ex]) => ({ type: "tf", q, a, ex, src: u.title }));
  }
  const mixed = (u, n) => shuffle([...mcItems(u, Math.ceil(n / 2)), ...tfItems(u, Math.floor(n / 2))]);
  const pairsOf = (u) => (u.gen ? u.gen.pairs() : shuffle(u.pairs).slice(0, 6));
  function groupsOf(u) {
    const g = u.gen && u.gen.groups ? u.gen.groups() : u.groups;
    return g ? { A: g[0][0], B: g[1][0], a: g[0][1], b: g[1][1] } : null;
  }
  const ALL_UNITS = () => SUBJ.flatMap((s) => s.units);
  const setBar = (f) => { const b = document.querySelector(".bar.grow span"); if (b) b.style.width = Math.min(100, f * 100) + "%"; };
  const BOTS = [{ name: "Bilge Baykuş", icon: "🦉" }, { name: "Hızlı Tavşan", icon: "🐇" }, { name: "Kurnaz Tilki", icon: "🦊" }, { name: "Çalışkan Arı", icon: "🐝" }];
  const LADDER = [5, 10, 20, 30, 45, 60, 80, 100, 130, 160, 200, 250];
  const SAFE = [3, 7];
  const ALPHA = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");
  const isLetter = (ch) => ALPHA.includes(ch);
  const optLabels = (it) => (it.type === "tf" ? ["Doğru", "Yanlış"] : it.opts);
  const isRight = (it, idx) => (it.type === "tf" ? (idx === 0) === it.a : it.opts[idx] === it.a);
  const rightIdx = (it) => (it.type === "tf" ? (it.a ? 0 : 1) : it.opts.indexOf(it.a));

  /* ---------------- harita düğümleri ---------------- */
  function nodesFor(u) {
    const n = [
      { kind: "quiz", label: "Bilgi Yarışı", icon: "❓" },
      { kind: "memory", label: "Hafıza Kartları", icon: "🃏" },
      { kind: "sort", label: "İki Kutu", icon: "🗂️" },
      { kind: "speed", label: "Hız Turu: Doğru mu?", icon: "⚡" }
    ];
    if (u.words) n.push({ kind: "word", label: "Gizli Kelime", icon: "🔤" });
    n.push({ kind: "balloon", label: "Balon Avı", icon: "🎈" });
    n.push({ kind: "match", label: "Eşleştir", icon: "🧩" });
    if (u.order) n.push({ kind: "order", label: "Kronoloji", icon: "📜" });
    n.push({ kind: "boss", label: "Boss Savaşı", icon: "🐉" });
    return n.map((x, i) => Object.assign(x, { key: `${u.id}:${i}` }));
  }
  const subjectNodes = (s) => s.units.flatMap((u) => nodesFor(u).map((n) => Object.assign(n, { unit: u })));
  function isUnlocked(s, key) {
    const list = subjectNodes(s);
    const i = list.findIndex((n) => n.key === key);
    return i <= 0 || (S.stars[list[i - 1].key] || 0) >= 1;
  }
  const subjectProgress = (s) => { const l = subjectNodes(s); return { got: l.reduce((t, n) => t + (S.stars[n.key] || 0), 0), max: l.length * 3 }; };

  /* ================= EKRANLAR ================= */
  let G = null; // aktif oyun
  function stopTimers() {
    if (!G) return;
    if (G.timer) { clearInterval(G.timer); G.timer = null; }
    if (G.botTO) { clearTimeout(G.botTO); G.botTO = null; }
  }

  function header() {
    const L = levelInfo(S.xp);
    return `<header class="top">
      <div class="lvl"><div class="lvl-badge">${L.lvl}</div>
        <div class="lvl-info"><b>${L.title}</b><div class="bar"><span style="width:${(L.cur / L.need) * 100}%"></span></div><small>${L.cur} / ${L.need} XP</small></div></div>
      <div class="chips"><span class="chip" title="Günlük seri">🔥 ${S.streak}</span>
        <button class="chip btn-ghost" data-act="sound" title="Ses">${S.sound ? "🔊" : "🔇"}</button></div>
    </header>`;
  }

  function renderHome() {
    stopTimers(); G = null;
    const dailyDone = S.dailyDone === dayStr();
    $app.innerHTML = `${header()}
      <main class="home">
        <button class="card daily ${dailyDone ? "done" : ""}" data-act="daily">
          <div class="big-ico">${dailyDone ? "✅" : "🎁"}</div>
          <div><h3>Günün Görevi</h3><p>${dailyDone ? "Bugünkü görevi tamamladın! Yine de oynayabilirsin." : "Tüm derslerden 10 karışık soru · <b>+50 bonus XP</b>"}</p></div>
        </button>
        <h2 class="sec">Oyun Salonu</h2>
        <div class="grid">
          <button class="card arc duel-card" data-act="arcade" data-mode="duel"><div class="subj-ico">⚔️</div><h3>Düello</h3><small>Rakip bota karşı hız ve bilgi yarışı</small></button>
          <button class="card arc tower-card" data-act="arcade" data-mode="ladder"><div class="subj-ico">🗼</div><h3>Bilgi Kulesi</h3><small>12 kat, 3 joker. Yanlışta düşersin!</small></button>
        </div>
        <h2 class="sec">Dünyalar</h2>
        <div class="grid">
          ${SUBJ.map((s) => { const p = subjectProgress(s); return `
            <button class="card subj" style="--c:${s.color}" data-act="subject" data-id="${s.id}">
              <div class="subj-ico">${s.icon}</div><h3>${s.name}</h3><small>${s.world}</small>
              <div class="bar"><span style="width:${(p.got / p.max) * 100}%"></span></div><small>⭐ ${p.got}/${p.max}</small>
            </button>`; }).join("")}
        </div>
        <button class="card review" data-act="review" ${S.mistakes.length ? "" : "disabled"}>
          <div class="big-ico">📕</div>
          <div><h3>Hata Defteri <span class="pill">${S.mistakes.length}</span></h3>
          <p>${S.mistakes.length ? "Yanlış yaptığın sorular burada. Doğru cevapladıkça defterden silinir." : "Henüz hatan yok. Yanlış yaptığın sorular buraya düşer."}</p></div>
        </button>
        <h2 class="sec">Rozetler</h2>
        <div class="badges">${BADGES.map((b) => `<div class="badge ${S.badges.includes(b.id) ? "on" : ""}" title="${esc(b.desc)}"><span>${b.icon}</span><small>${b.name}</small></div>`).join("")}</div>
        <p class="stats">✔ ${S.stats.correct} doğru · ✘ ${S.stats.wrong} yanlış · 🎮 ${S.stats.games} oyun · 🔥 en iyi kombo ${S.stats.bestCombo}</p>
        <button class="link" data-act="reset">İlerlemeyi sıfırla</button>
      </main>`;
  }

  const ARC = {
    duel: { icon: "⚔️", name: "Düello", desc: "7 soru, aynı anda sen ve rakibin. Hem doğru hem hızlı olan kazanır. Rakip seviyen yükseldikçe güçlenir." },
    ladder: { icon: "🗼", name: "Bilgi Kulesi", desc: "12 katlı kuleyi tırman. Her kat daha çok XP. Yanlış cevapta düşersin ama 🛡️ barajlardaki ödül cebinde kalır. Jokerler: %50, +15 sn, Pas. İstediğin an çekilebilirsin." }
  };
  function renderArcade(mode) {
    stopTimers(); G = null;
    const a = ARC[mode];
    $app.innerHTML = `<header class="top sub"><button class="btn-ghost back" data-act="home">‹</button>
        <div><h2>${a.icon} ${a.name}</h2><small>Oyun Salonu</small></div><span></span></header>
      <main class="home"><div class="card"><p>${a.desc}</p></div>
        <h2 class="sec">Hangi ders?</h2>
        <div class="grid">
          <button class="card subj" style="--c:#7c5cff" data-act="arcgo" data-mode="${mode}" data-sid="mix"><div class="subj-ico">🎲</div><h3>Karışık</h3><small>Tüm dersler</small></button>
          ${SUBJ.map((s) => `<button class="card subj" style="--c:${s.color}" data-act="arcgo" data-mode="${mode}" data-sid="${s.id}"><div class="subj-ico">${s.icon}</div><h3>${s.name}</h3><small>${s.world}</small></button>`).join("")}
        </div></main>`;
  }
  function startArcade(mode, sid) {
    const pool = sid === "mix" ? ALL_UNITS() : SUBJ.find((s) => s.id === sid).units;
    startGame(mode, { pool, arcSid: sid });
  }

  function renderSubject(sid) {
    stopTimers(); G = null;
    const s = SUBJ.find((x) => x.id === sid);
    let idx = 0;
    $app.innerHTML = `<header class="top sub" style="--c:${s.color}">
        <button class="btn-ghost back" data-act="home">‹</button>
        <div><h2>${s.icon} ${s.name}</h2><small>${s.world}</small></div><span></span>
      </header>
      <main class="map" style="--c:${s.color}">
        ${s.units.map((u) => `
          <section class="unit"><h3>${esc(u.title)}</h3>
            <div class="path">
              ${nodesFor(u).map((n) => {
                const st = S.stars[n.key] || 0, open = isUnlocked(s, n.key), side = ["c", "r", "c", "l"][idx++ % 4];
                return `<div class="node-wrap ${side}">
                  <button class="node ${open ? "" : "locked"} ${n.kind === "boss" ? "boss" : ""} ${st ? "done" : ""}" ${open ? `data-act="play" data-key="${n.key}" data-kind="${n.kind}" data-unit="${u.id}"` : "disabled"}>
                    <span>${open ? n.icon : "🔒"}</span></button>
                  <div class="node-label">${n.label}<div class="stars">${[1, 2, 3].map((k) => `<i class="${st >= k ? "on" : ""}">★</i>`).join("")}</div></div>
                </div>`;
              }).join("")}
            </div>
          </section>`).join("")}
      </main>`;
  }

  /* ================= OYUN BAŞLATMA ================= */
  function startGame(kind, opts) {
    stopTimers();
    G = Object.assign({ kind, i: 0, correct: 0, total: 0, combo: 0, maxCombo: 0, xp: 0, wrongs: [], lives: Infinity, maxLives: 3 }, opts);
    if (kind === "quiz") { G.items = mcItems(G.unit, 6); G.qTime = 20; }
    if (kind === "boss") { G.items = mixed(G.unit, 10); G.lives = 3; G.qTime = 15; }
    if (kind === "daily") {
      const all = SUBJ.flatMap((s) => s.units);
      G.items = shuffle(Array.from({ length: 10 }, () => mixed(shuffle(all)[0], 2)[0]));
      G.qTime = 20;
    }
    if (kind === "review") {
      G.items = shuffle(S.mistakes).slice(0, 10).map((m) => Object.assign({}, m, m.type === "mc" ? { opts: shuffle(m.opts) } : {}));
      G.qTime = 30;
    }
    if (kind === "duel") {
      G.items = shuffle(Array.from({ length: 7 }, () => mixed(pick(G.pool), 2)[0]));
      G.qTime = 15; G.bot = pick(BOTS); G.me = 0; G.botScore = 0;
      G.botAcc = Math.min(0.85, 0.55 + levelInfo(S.xp).lvl * 0.03);
    }
    if (kind === "ladder") {
      const per = Math.ceil(15 / G.pool.length) + 1;
      const all = shuffle(G.pool.flatMap((u) => mcItems(u, per)));
      G.items = all.slice(0, 12); G.reserve = all.slice(12, 15);
      G.qTime = 30; G.lives = 1; G.maxLives = 1; G.jokers = { fifty: true, time: true, skip: true };
    }
    if (["quiz", "boss", "daily", "review", "duel", "ladder"].includes(kind)) return renderQuiz();
    if (kind === "memory") return startMemory();
    if (kind === "sort") return startSort();
    if (kind === "balloon") return startBalloon();
    if (kind === "word") return startWord();
    if (kind === "speed") { G.items = tfItems(G.unit, G.unit.gen ? 15 : 8); G.timeLeft = G.unit.gen ? 60 : 45; return renderSpeed(); }
    if (kind === "match") return startMatch();
    if (kind === "order") return startOrder();
  }

  function gameTop(extra = "") {
    const prog = G.items ? (G.i / G.items.length) * 100 : 0;
    return `<header class="game-top">
      <button class="btn-ghost back" data-act="quit">✕</button>
      <div class="bar grow"><span style="width:${prog}%"></span></div>
      ${G.lives !== Infinity ? `<span class="chip hearts">${hearts()}</span>` : ""}
      ${extra}
    </header>`;
  }

  const hearts = () => "❤️".repeat(Math.max(0, G.lives)) + "🖤".repeat(G.maxLives - Math.max(0, G.lives));
  function addMistake(it) {
    const clean = { type: it.type, q: it.q, a: it.a, ex: it.ex, src: it.src };
    if (it.type === "mc") clean.opts = it.opts.slice();
    if (!S.mistakes.some((m) => m.q === clean.q)) S.mistakes.push(clean);
    if (S.mistakes.length > 200) S.mistakes.shift();
  }
  function recordAnswer(it, ok, timeLeft = 0) {
    G.total++;
    if (ok) {
      G.correct++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
      G.xp += Math.round((10 + Math.floor(timeLeft / 2)) * (1 + Math.min(G.combo, 10) * 0.1));
      if (G.kind === "review") { S.mistakes = S.mistakes.filter((m) => m.q !== it.q); S.stats.cleared++; }
      sfx.ok();
    } else {
      G.combo = 0; G.wrongs.push(it); if (G.kind !== "review") addMistake(it);
      if (G.lives !== Infinity) G.lives--;
      sfx.bad();
    }
  }

  /* ---------------- 1) Bilgi Yarışı / Boss / Günlük / Hata Defteri ---------------- */
  function renderQuiz() {
    stopTimers();
    const it = G.items[G.i];
    const titles = { quiz: "Bilgi Yarışı", boss: "🐉 Boss Savaşı", daily: "🎁 Günün Görevi", review: "📕 Hata Defteri", duel: "⚔️ Düello", ladder: "🗼 Bilgi Kulesi" };
    $app.innerHTML = `${gameTop(G.combo >= 2 ? `<span class="chip combo">🔥x${G.combo}</span>` : "")}
      <main class="play ${G.kind === "boss" ? "boss-bg" : ""}">
        <div class="meta"><span>${titles[G.kind]}</span><span>${G.i + 1} / ${G.items.length}</span></div>
        ${G.kind === "duel" ? `<div class="duel">
            <div class="side me"><b>🙂 Sen</b><span id="dme">${G.me}</span></div><div class="vs">VS</div>
            <div class="side bot"><b>${G.bot.icon} ${G.bot.name}</b><span id="dbot">${G.botScore}</span><small id="bstat">düşünüyor…</small></div></div>` : ""}
        ${G.kind === "ladder" ? `<div class="tower">${LADDER.map((x, k) => `<span class="${k < G.i ? "done" : ""} ${k === G.i ? "cur" : ""} ${SAFE.includes(k) ? "safe" : ""}">${SAFE.includes(k) ? "🛡️" : k + 1}</span>`).join("")}</div>
            <p class="hint">${G.i + 1}. kat ödülü: <b>${LADDER[G.i]} XP</b> · 🛡️ baraj katları ödülü korur</p>` : ""}
        <div class="timer"><span id="tbar"></span></div>
        <div class="qcard"><small class="src">${esc(it.src || "")}</small><p class="q">${esc(it.q)}</p></div>
        <div class="opts ${it.type === "tf" ? "tf" : ""}">
          ${optLabels(it).map((o, k) => `<button class="opt" data-act="ans" data-k="${k}"><b>${it.type === "tf" ? (k ? "✘" : "✔") : "ABCD"[k]}</b>${esc(o)}</button>`).join("")}
        </div>
        ${G.kind === "ladder" ? `<div class="jokers" id="jk">
            <button class="btn joker" data-act="joker" data-j="fifty" ${G.jokers.fifty ? "" : "disabled"}>½ %50</button>
            <button class="btn joker" data-act="joker" data-j="time" ${G.jokers.time ? "" : "disabled"}>⏱ +15 sn</button>
            <button class="btn joker" data-act="joker" data-j="skip" ${G.jokers.skip && G.reserve.length ? "" : "disabled"}>⏭ Pas</button></div>` : ""}
        <div id="fb"></div>
      </main>`;
    const bar = document.getElementById("tbar");
    G.answered = false;
    G.qEnd = Date.now() + G.qTime * 1000;
    G.qDur = G.qTime * 1000;
    if (G.kind === "duel") {
      G.botPlan = { ok: Math.random() < G.botAcc, t: 2.5 + Math.random() * (G.qTime - 5) };
      G.botTO = setTimeout(() => { const b = document.getElementById("bstat"); if (b) { b.textContent = "cevapladı!"; b.className = "hot"; } }, G.botPlan.t * 1000);
    }
    G.timer = setInterval(() => {
      const left = Math.max(0, G.qEnd - Date.now());
      bar.style.width = Math.min(100, (left / G.qDur) * 100) + "%";
      bar.className = left < 5000 ? "warn" : "";
      if (left <= 0) answerQuiz(-1);
    }, 100);
  }

  function answerQuiz(k) {
    if (G.answered) return;
    G.answered = true; stopTimers();
    const it = G.items[G.i], ok = k >= 0 && isRight(it, k);
    const tLeft = Math.max(0, (G.qEnd - Date.now()) / 1000);
    recordAnswer(it, ok, tLeft);
    let duelLine = "";
    if (G.kind === "duel") {
      const mine = ok ? 10 + Math.floor(tLeft / 2) : 0;
      const botPts = G.botPlan.ok ? 10 + Math.floor((G.qTime - G.botPlan.t) / 2) : 0;
      G.me += mine; G.botScore += botPts;
      document.getElementById("dme").textContent = G.me;
      document.getElementById("dbot").textContent = G.botScore;
      const bs = document.getElementById("bstat"); bs.textContent = G.botPlan.ok ? "✔ doğru" : "✘ yanlış"; bs.className = G.botPlan.ok ? "okc" : "noc";
      duelLine = `<p class="duel-line">Sen <b>+${mine}</b> · ${G.bot.icon} ${G.botPlan.ok ? `<b>+${botPts}</b> (${G.botPlan.t.toFixed(1)} sn)` : "yanlış cevapladı"}</p>`;
    }
    const jk = document.getElementById("jk"); if (jk) jk.remove();
    document.querySelectorAll(".opt").forEach((b, idx) => {
      b.disabled = true;
      if (idx === rightIdx(it)) b.classList.add("right");
      else if (idx === k) b.classList.add("wrong");
    });
    const last = G.i + 1 >= G.items.length || G.lives <= 0;
    document.getElementById("fb").innerHTML = `<div class="feedback ${ok ? "ok" : "no"}">
        <b>${ok ? pick(["Harika! 🎉", "Doğru! 💪", "Süper! ✨", "Aynen böyle! 🚀"]) : k < 0 ? "Süre doldu ⏰" : "Yanlış 😕"}</b>
        ${duelLine}<p>${esc(it.ex || "")}</p>
        <button class="btn primary" data-act="next">${last ? "Sonuçları gör" : G.kind === "ladder" ? `${G.i + 2}. kata çık ⬆` : "Devam"}</button>
        ${G.kind === "ladder" && ok && !last ? `<button class="btn" data-act="walk">🏳️ Çekil ve ${LADDER[G.i]} XP al</button>` : ""}
      </div>`;
    if (!ok && G.lives !== Infinity) document.querySelector(".hearts").innerHTML = hearts();
    const c = document.querySelector(".combo"); if (c && !ok) c.remove();
  }
  function nextQuiz() {
    G.i++;
    if (G.i >= G.items.length || G.lives <= 0) return finish();
    renderQuiz();
  }

  /* ---------------- 2) Hız Turu (Doğru / Yanlış) ---------------- */
  function renderSpeed() {
    $app.innerHTML = `${gameTop(`<span class="chip" id="clock">⏱ ${G.timeLeft}</span>`)}
      <main class="play speed">
        <div class="meta"><span>⚡ Hız Turu</span><span id="sc">✔ 0</span></div>
        <div class="qcard big"><p class="q" id="sq"></p></div>
        <div class="opts tf">
          <button class="opt yes" data-act="sp" data-k="0"><b>✔</b>Doğru</button>
          <button class="opt no" data-act="sp" data-k="1"><b>✘</b>Yanlış</button>
        </div>
        <p class="hint">Klavye: ← Doğru · → Yanlış</p>
      </main>`;
    showSpeedItem();
    G.timer = setInterval(() => {
      G.timeLeft--;
      const c = document.getElementById("clock"); if (c) c.textContent = "⏱ " + G.timeLeft;
      if (G.timeLeft <= 0) finish();
    }, 1000);
  }
  function showSpeedItem() {
    document.getElementById("sq").textContent = G.items[G.i].q;
    document.querySelector(".bar.grow span").style.width = (G.i / G.items.length) * 100 + "%";
  }
  function answerSpeed(k) {
    if (G.lock) return;
    const it = G.items[G.i], ok = isRight(it, k);
    recordAnswer(it, ok, 4);
    const card = document.querySelector(".qcard");
    card.classList.add(ok ? "flash-ok" : "flash-no");
    document.getElementById("sc").textContent = `✔ ${G.correct}${G.combo >= 3 ? ` · 🔥x${G.combo}` : ""}`;
    G.lock = true;
    setTimeout(() => {
      if (G.over) return;
      G.lock = false; G.i++;
      if (G.i >= G.items.length) return finish();
      card.classList.remove("flash-ok", "flash-no");
      showSpeedItem();
    }, 350);
  }

  /* ---------------- 3) Eşleştirme ---------------- */
  function startMatch() {
    G.pairs = pairsOf(G.unit);
    G.left = shuffle(G.pairs.map((_, i) => i));
    G.right = shuffle(G.pairs.map((_, i) => i));
    G.sel = null; G.matched = new Set(); G.misses = 0; G.start = Date.now();
    renderMatch();
  }
  function renderMatch() {
    $app.innerHTML = `${gameTop(`<span class="chip">✘ ${G.misses}</span>`)}
      <main class="play">
        <div class="meta"><span>🧩 Eşleştir</span><span>${G.matched.size} / ${G.pairs.length}</span></div>
        <p class="hint">Soldan bir kart seç, sağdaki eşini bul.</p>
        <div class="match">
          <div class="col">${G.left.map((i) => `<button class="mcard ${G.matched.has(i) ? "gone" : ""} ${G.sel === i ? "sel" : ""}" data-act="ml" data-i="${i}" ${G.matched.has(i) ? "disabled" : ""}>${esc(G.pairs[i][0])}</button>`).join("")}</div>
          <div class="col">${G.right.map((i) => `<button class="mcard r ${G.matched.has(i) ? "gone" : ""}" data-act="mr" data-i="${i}" ${G.matched.has(i) ? "disabled" : ""}>${esc(G.pairs[i][1])}</button>`).join("")}</div>
        </div>
      </main>`;
    document.querySelector(".bar.grow span").style.width = (G.matched.size / G.pairs.length) * 100 + "%";
  }
  function matchRight(i, el) {
    if (G.sel === null) { el.classList.add("shake"); setTimeout(() => el.classList.remove("shake"), 400); return; }
    if (G.sel === i) {
      G.matched.add(i); G.correct++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
      G.xp += Math.round(12 * (1 + Math.min(G.combo, 10) * 0.1)); sfx.ok(); G.sel = null;
      if (G.matched.size === G.pairs.length) { G.total = G.pairs.length + G.misses; return finish(); }
      renderMatch();
    } else {
      G.misses++; G.combo = 0; sfx.bad();
      G.wrongs.push({ q: `${G.pairs[G.sel][0]} → ?`, ex: `Doğru eşleşme: ${G.pairs[G.sel][0]} ↔ ${G.pairs[G.sel][1]}` });
      el.classList.add("shake");
      setTimeout(renderMatch, 400);
    }
  }

  /* ---------------- Jokerler (Bilgi Kulesi) ---------------- */
  function useJoker(j) {
    if (G.answered || !G.jokers[j]) return;
    G.jokers[j] = false; sfx.click();
    const it = G.items[G.i];
    if (j === "fifty") {
      const wrong = shuffle(it.opts.map((_, i) => i).filter((i) => i !== rightIdx(it))).slice(0, 2);
      const btns = document.querySelectorAll(".opt");
      wrong.forEach((i) => { btns[i].disabled = true; btns[i].classList.add("gone"); });
    }
    if (j === "time") { G.qEnd += 15000; G.qDur = Math.max(G.qDur, G.qEnd - Date.now()); }
    if (j === "skip") { G.items[G.i] = G.reserve.pop(); return renderQuiz(); }
    const b = document.querySelector(`[data-j="${j}"]`); if (b) b.disabled = true;
  }

  /* ---------------- Hafıza Kartları ---------------- */
  function startMemory() {
    G.pairs = pairsOf(G.unit);
    G.cards = shuffle(G.pairs.flatMap((p, i) => [{ i, t: p[0], s: 0 }, { i, t: p[1], s: 1 }]));
    G.open = []; G.found = new Set(); G.moves = 0; G.misses = 0;
    renderMemory();
  }
  function renderMemory() {
    $app.innerHTML = `${gameTop(`<span class="chip">🔁 ${G.moves} hamle</span>`)}
      <main class="play">
        <div class="meta"><span>🃏 Hafıza Kartları</span><span>${G.found.size} / ${G.pairs.length}</span></div>
        <p class="hint">Kartları çevir, birbirine ait iki kartı bul. Ne kadar az hamle, o kadar çok yıldız!</p>
        <div class="memory">${G.cards.map((c, k) => {
          const up = G.open.includes(k) || G.found.has(c.i);
          return `<button class="mem ${up ? "up" : ""} ${G.found.has(c.i) ? "found" : ""} ${c.s ? "s1" : ""}" data-act="mem" data-k="${k}" ${up ? "disabled" : ""}>${up ? esc(c.t) : "?"}</button>`;
        }).join("")}</div>
      </main>`;
    setBar(G.found.size / G.pairs.length);
  }
  function flipMemory(k) {
    if (G.open.length >= 2 || G.open.includes(k)) return;
    G.open.push(k); sfx.click();
    if (G.open.length === 2) {
      G.moves++;
      const [x, y] = G.open.map((j) => G.cards[j]);
      if (x.i === y.i) {
        G.found.add(x.i); G.open = []; G.correct++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
        G.xp += Math.round(12 * (1 + Math.min(G.combo, 10) * 0.1)); sfx.ok();
        if (G.found.size === G.pairs.length) {
          G.total = G.pairs.length; G.wrongCount = G.misses;
          G.pct = G.pairs.length / (G.pairs.length + G.misses * 0.5);
          renderMemory(); return setTimeout(finish, 700);
        }
      } else {
        G.misses++; G.combo = 0;
        renderMemory();
        return setTimeout(() => { if (G.over || G.kind !== "memory") return; G.open = []; renderMemory(); }, 1000);
      }
    }
    renderMemory();
  }

  /* ---------------- İki Kutu (kategorize et) ---------------- */
  function startSort() {
    G.g = groupsOf(G.unit);
    G.items = shuffle([...shuffle(G.g.a).slice(0, 5).map((t) => ({ t, s: 0 })), ...shuffle(G.g.b).slice(0, 5).map((t) => ({ t, s: 1 }))]);
    renderSort();
  }
  function renderSort() {
    const it = G.items[G.i];
    $app.innerHTML = `${gameTop(G.combo >= 2 ? `<span class="chip combo">🔥x${G.combo}</span>` : "")}
      <main class="play">
        <div class="meta"><span>🗂️ İki Kutu</span><span>${G.i + 1} / ${G.items.length}</span></div>
        <p class="hint">Kart hangi kutuya ait? Kutuya dokun (klavye: ← / →)</p>
        <div class="qcard big sortcard" id="scard"><p class="q">${esc(it.t)}</p></div>
        <div class="bins">
          <button class="bin a" data-act="bin" data-k="0"><span>⬅</span>${esc(G.g.A)}</button>
          <button class="bin b" data-act="bin" data-k="1"><span>➡</span>${esc(G.g.B)}</button>
        </div>
      </main>`;
    setBar(G.i / G.items.length);
  }
  function answerSort(k) {
    if (G.lock) return;
    const it = G.items[G.i], ok = it.s === k, right = it.s ? G.g.B : G.g.A;
    recordAnswer({ type: "tf", q: `“${it.t}” → ${G.g.A}`, a: it.s === 0, ex: `“${it.t}” ${right} grubuna aittir.`, src: G.unit.title }, ok, 6);
    const card = document.getElementById("scard");
    card.classList.add(k ? "fly-r" : "fly-l", ok ? "flash-ok" : "flash-no");
    if (!ok) card.insertAdjacentHTML("beforeend", `<small class="src">→ ${esc(right)}</small>`);
    G.lock = true;
    setTimeout(() => {
      G.lock = false;
      if (G.over) return;
      G.i++;
      if (G.i >= G.items.length) return finish();
      renderSort();
    }, ok ? 450 : 1300);
  }

  /* ---------------- Balon Avı ---------------- */
  function startBalloon() {
    const g = groupsOf(G.unit), useA = Math.random() < 0.5;
    G.target = useA ? g.A : g.B; G.other = useA ? g.B : g.A;
    const tg = useA ? g.a : g.b, ot = useA ? g.b : g.a;
    G.queue = shuffle([...shuffle(tg).slice(0, 7).map((t) => ({ t, ok: true })), ...shuffle(ot).slice(0, 6).map((t) => ({ t, ok: false }))]);
    G.targets = G.queue.filter((x) => x.ok).length;
    G.hits = 0; G.bad = 0; G.escaped = 0; G.lives = 3; G.maxLives = 3; G.spawned = 0; G.alive = 0;
    $app.innerHTML = `${gameTop(`<span class="chip" id="bscore">🎯 0/${G.targets}</span>`)}
      <main class="play">
        <div class="target-banner">Sadece <b>${esc(G.target)}</b> olanları patlat! 🎈</div>
        <div class="sky" id="sky"></div>
        <p class="hint">Yanlış balon = 1 can · Kaçan doğru balon puan kaybettirir</p>
      </main>`;
    spawnBalloon();
    G.timer = setInterval(spawnBalloon, 1250);
  }
  const BCOLORS = ["#e74c3c", "#3498db", "#9b59b6", "#e67e22", "#16a085", "#d35400", "#2c82c9", "#c0392b"];
  function spawnBalloon() {
    if (G.over) return;
    if (G.spawned >= G.queue.length) { clearInterval(G.timer); G.timer = null; return; }
    const k = G.spawned++, item = G.queue[k], sky = document.getElementById("sky");
    const b = document.createElement("button");
    b.className = "balloon"; b.dataset.act = "pop"; b.dataset.k = k;
    b.style.left = 2 + Math.random() * 58 + "%";
    b.style.background = BCOLORS[k % BCOLORS.length];
    b.style.animationDuration = 6 + Math.random() * 1.5 + "s";
    b.textContent = item.t;
    b.addEventListener("animationend", () => {
      if (b.dataset.done) return;
      b.dataset.done = "1"; b.remove(); G.alive--;
      if (item.ok) { G.escaped++; G.combo = 0; G.wrongs.push({ type: "tf", q: `“${item.t}” → ${G.target}`, a: true, ex: `“${item.t}” ${G.target} grubundandı, kaçırdın.` }); }
      checkBalloonEnd();
    });
    sky.appendChild(b); G.alive++;
  }
  function popBalloon(el) {
    if (el.dataset.done || G.over) return;
    el.dataset.done = "1";
    const item = G.queue[+el.dataset.k];
    el.style.transform = getComputedStyle(el).transform;
    el.style.animation = "none";
    el.classList.add(item.ok ? "popped" : "bad");
    G.alive--;
    if (item.ok) {
      G.hits++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
      G.xp += Math.round(10 * (1 + Math.min(G.combo, 10) * 0.1)); sfx.ok();
    } else {
      G.bad++; G.lives--; G.combo = 0; sfx.bad();
      const mistake = { type: "tf", q: `“${item.t}” → ${G.target}`, a: false, ex: `“${item.t}” ${G.other} grubuna aittir.`, src: G.unit.title };
      G.wrongs.push(mistake); addMistake(mistake);
      document.querySelector(".hearts").innerHTML = hearts();
    }
    document.getElementById("bscore").textContent = `🎯 ${G.hits}/${G.targets}`;
    setTimeout(() => el.remove(), 300);
    checkBalloonEnd();
  }
  function checkBalloonEnd() {
    setBar(G.spawned / G.queue.length);
    if (G.over) return;
    if (G.lives <= 0 || (G.spawned >= G.queue.length && G.alive <= 0)) {
      G.correct = G.hits; G.total = G.targets; G.wrongCount = G.bad + G.escaped;
      G.pct = Math.max(0, G.hits - G.bad * 0.5) / G.targets;
      document.querySelectorAll(".balloon").forEach((b) => { b.dataset.done = "1"; });
      setTimeout(finish, 400);
      G.lockEnd = true;
    }
  }

  /* ---------------- Gizli Kelime ---------------- */
  function startWord() {
    G.words = shuffle(G.unit.words).slice(0, 3);
    G.w = 0; G.scoreSum = 0; G.total = G.words.length;
    newWord();
  }
  function newWord() {
    const [ans, clue] = G.words[G.w];
    G.ans = ans.toLocaleUpperCase("tr"); G.clue = clue;
    G.guessed = new Set(); G.tries = 6; G.wordDone = false; G.solved = false;
    renderWord();
  }
  function renderWord() {
    const show = (ch) => G.guessed.has(ch) || G.wordDone;
    $app.innerHTML = `${gameTop(`<span class="chip">${"💡".repeat(G.tries)}${"▫️".repeat(6 - G.tries)}</span>`)}
      <main class="play">
        <div class="meta"><span>🔤 Gizli Kelime</span><span>${G.w + 1} / ${G.words.length}</span></div>
        <div class="qcard"><small class="src">İpucu</small><p class="q">${esc(G.clue)}</p></div>
        <div class="word">${[...G.ans].map((ch) => ch === " " ? `<span class="gap"></span>`
          : !isLetter(ch) ? `<span class="ch sym">${esc(ch)}</span>`
          : `<span class="ch ${show(ch) ? "show" : ""} ${G.wordDone && !G.guessed.has(ch) ? "miss" : ""}">${show(ch) ? ch : ""}</span>`).join("")}</div>
        ${G.wordDone ? `<div class="feedback ${G.solved ? "ok" : "no"}"><b>${G.solved ? `Bildin! 🎉 (+${10 + G.tries * 4} XP)` : "Hakların bitti 😕"}</b>
            <p>Cevap: <b>${esc(G.words[G.w][0])}</b></p>
            <button class="btn primary" data-act="wnext">${G.w + 1 >= G.words.length ? "Sonuçları gör" : "Sonraki kelime"}</button></div>`
          : `<div class="keys">${ALPHA.map((c) => `<button class="key ${G.guessed.has(c) ? (G.ans.includes(c) ? "hit" : "miss") : ""}" data-act="key" data-c="${c}" ${G.guessed.has(c) ? "disabled" : ""}>${c}</button>`).join("")}</div>
             <button class="btn" data-act="whint" ${G.tries > 1 ? "" : "disabled"}>💡 Harf aç (1 hak)</button>`}
      </main>`;
    setBar((G.w + (G.wordDone ? 1 : 0)) / G.words.length);
  }
  function guessLetter(c) {
    if (G.wordDone || G.guessed.has(c)) return;
    G.guessed.add(c);
    if (G.ans.includes(c)) sfx.ok(); else { G.tries--; sfx.bad(); }
    checkWord();
  }
  function wordHint() {
    if (G.wordDone || G.tries <= 1) return;
    const hidden = [...new Set([...G.ans].filter((ch) => isLetter(ch) && !G.guessed.has(ch)))];
    if (!hidden.length) return;
    G.tries--; G.guessed.add(pick(hidden)); sfx.click();
    checkWord();
  }
  function checkWord() {
    const solved = [...G.ans].every((ch) => !isLetter(ch) || G.guessed.has(ch));
    if (solved || G.tries <= 0) {
      G.wordDone = true; G.solved = solved;
      const [ans, clue] = G.words[G.w];
      if (solved) {
        G.correct++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
        G.xp += 10 + G.tries * 4; G.scoreSum += 0.5 + (0.5 * G.tries) / 6; sfx.win();
      } else {
        G.combo = 0;
        const others = shuffle(G.unit.words.filter((w) => w[0] !== ans)).slice(0, 3).map((w) => w[0]);
        const m = { type: "mc", q: clue, opts: shuffle([ans, ...others]), a: ans, ex: `Cevap: ${ans}`, src: G.unit.title };
        G.wrongs.push(m); addMistake(m);
      }
    }
    renderWord();
  }
  function nextWord() {
    G.w++;
    if (G.w >= G.words.length) { G.pct = G.scoreSum / G.words.length; G.wrongCount = G.words.length - G.correct; return finish(); }
    newWord();
  }

  /* ---------------- 4) Kronoloji ---------------- */
  function startOrder() {
    G.set = pick(G.unit.order);
    G.pool = shuffle(G.set.items.map((_, i) => i));
    G.ans = [];
    renderOrder();
  }
  function renderOrder(checked) {
    const n = G.set.items.length;
    $app.innerHTML = `${gameTop()}
      <main class="play">
        <div class="meta"><span>📜 Kronoloji</span><span>${G.ans.length} / ${n}</span></div>
        <p class="hint">${esc(G.set.prompt)} — kartlara sırayla dokun.</p>
        <ol class="slots">${Array.from({ length: n }, (_, k) => {
          const i = G.ans[k];
          if (i === undefined) return `<li class="slot empty">${k + 1}</li>`;
          const cls = checked ? (i === k ? "right" : "wrong") : "";
          return `<li class="slot ${cls}" ${checked ? "" : `data-act="ounpick" data-k="${k}"`}><b>${k + 1}</b>${esc(G.set.items[i][0])}${checked ? `<em>${G.set.items[i][1]}</em>` : ""}</li>`;
        }).join("")}</ol>
        ${checked ? `<div class="feedback ${G.correct === n ? "ok" : "no"}"><b>Doğru sıra</b>
            <ol class="answer">${G.set.items.map(([e, y]) => `<li>${esc(e)} <em>${y}</em></li>`).join("")}</ol>
            <button class="btn primary" data-act="finish">Sonuçları gör</button></div>`
          : `<div class="pool">${G.pool.map((i) => `<button class="mcard" data-act="opick" data-i="${i}">${esc(G.set.items[i][0])}</button>`).join("")}</div>
             <button class="btn primary" data-act="ocheck" ${G.ans.length === n ? "" : "disabled"}>Kontrol et</button>`}
      </main>`;
  }
  function checkOrder() {
    const n = G.set.items.length;
    G.total = n;
    G.ans.forEach((i, k) => {
      if (i === k) { G.correct++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo); G.xp += 15; }
      else { G.combo = 0; G.wrongs.push({ q: `${k + 1}. sıra`, ex: `${G.set.items[k][0]} (${G.set.items[k][1]}) olmalıydı.` }); }
    });
    G.correct === n ? sfx.win() : sfx.bad();
    renderOrder(true);
  }

  /* ================= SONUÇ ================= */
  function finish() {
    stopTimers();
    if (G.over) return;
    G.over = true;
    const total = G.total || 1;
    let pct = G.pct !== undefined ? G.pct : G.correct / total;
    if (G.kind === "speed") pct = G.correct / G.items.length;
    const lost = (G.kind === "boss" || G.kind === "balloon") && G.lives <= 0;
    let stars = lost ? 0 : pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;
    let bonus = 0, title = "Bölüm bitti", msgOverride = null;
    if (G.kind === "ladder") {
      const r = G.correct;
      G.xp = G.walked || r >= 12 ? (r ? LADDER[r - 1] : 0) : r >= 8 ? LADDER[7] : r >= 4 ? LADDER[3] : 0;
      S.stats.ladderTop = Math.max(S.stats.ladderTop, r);
      stars = r >= 12 ? 3 : r >= 8 ? 2 : r >= 4 ? 1 : 0;
      title = r >= 12 ? "🗼 Zirvedesin!" : G.walked ? "🏳️ Çekildin" : "💥 Kuleden düştün";
      msgOverride = r >= 12 ? "12 katın hepsini çıktın. Efsanesin! 👑" : G.walked ? `${r}. katta akıllıca çekildin.` : `${r}. kata kadar çıktın. ${r >= 4 ? "Baraj ödülün cebinde 🛡️" : "Bir sonraki sefere ilk baraj 4. kat!"}`;
    }
    if (G.kind === "duel") {
      const win = G.me > G.botScore, draw = G.me === G.botScore;
      if (win) { bonus += 40; S.stats.duelWins++; }
      stars = win ? Math.max(1, stars) : draw ? Math.min(stars, 1) : 0;
      title = win ? `⚔️ Kazandın! ${G.me} - ${G.botScore}` : draw ? `🤝 Berabere ${G.me} - ${G.botScore}` : `😤 Kaybettin ${G.me} - ${G.botScore}`;
      msgOverride = win ? `${G.bot.icon} ${G.bot.name} yenildi! +40 bonus XP` : draw ? "Kıl payı! Bir rövanş?" : `${G.bot.icon} ${G.bot.name} bu sefer önde. Rövanş al!`;
    }
    if (G.kind === "daily" && S.dailyDone !== dayStr()) { bonus = 50; S.dailyDone = dayStr(); }
    if (G.kind === "boss" && !lost && stars) { bonus += 30; S.stats.bossWins++; }
    const earned = G.xp + bonus;
    const before = levelInfo(S.xp).lvl;

    S.xp += earned;
    S.stats.games++;
    S.stats.correct += G.correct;
    S.stats.wrong += G.wrongCount !== undefined ? G.wrongCount : G.kind === "match" ? G.misses : Math.max(0, total - G.correct);
    S.stats.bestCombo = Math.max(S.stats.bestCombo, G.maxCombo);
    if (G.key) S.stars[G.key] = Math.max(S.stars[G.key] || 0, stars);
    const t = dayStr();
    if (S.lastDay !== t) { S.streak = S.lastDay === yesterday() ? S.streak + 1 : 1; S.lastDay = t; }
    const newBadges = BADGES.filter((b) => !S.badges.includes(b.id) && b.test(S));
    newBadges.forEach((b) => S.badges.push(b.id));
    save();
    const levelUp = levelInfo(S.xp).lvl > before;

    if (stars === 3 || levelUp) { sfx.win(); confetti(); } else if (stars) sfx.win();

    const msg = msgOverride ? msgOverride : lost ? "Boss seni yendi! Hatalarını incele, tekrar dene 💪"
      : stars === 3 ? "Muhteşem! Konuyu fethettin 👑" : stars === 2 ? "Çok iyi! Biraz daha pratikle 3 yıldız senin." : stars === 1 ? "Geçtin! Sonraki bölüm açıldı 🔓" : "Bu sefer olmadı. Açıklamaları oku ve tekrar dene.";
    const retry = { kind: G.kind, key: G.key, unit: G.unit && G.unit.id, arc: G.arcSid };
    G.retry = retry;
    $app.innerHTML = `<main class="result">
        <div class="big-stars">${[1, 2, 3].map((k) => `<i class="${stars >= k ? "on" : ""}" style="animation-delay:${k * 0.2}s">★</i>`).join("")}</div>
        <h2>${lost ? "💀 Yenildin" : G.kind === "boss" && stars ? "🐉 Boss yenildi!" : title}</h2>
        <p class="msg">${msg}</p>
        <div class="res-grid">
          <div><b>${G.correct}/${G.kind === "speed" ? G.items.length : G.kind === "ladder" ? 12 : total}</b><small>${G.kind === "ladder" ? "Kat" : G.kind === "balloon" ? "Vurulan" : "Doğru"}</small></div>
          <div><b>+${earned}</b><small>XP${bonus ? ` (+${bonus} bonus)` : ""}</small></div>
          <div><b>🔥${G.maxCombo}</b><small>En iyi kombo</small></div>
        </div>
        ${levelUp ? `<div class="lvlup">⬆️ Seviye atladın! Artık <b>${levelInfo(S.xp).lvl}. seviye ${levelInfo(S.xp).title}</b></div>` : ""}
        ${newBadges.map((b) => `<div class="newbadge">${b.icon} Yeni rozet: <b>${b.name}</b> — ${b.desc}</div>`).join("")}
        ${G.wrongs.length ? `<details class="wrongs" open><summary>Gözden geçir (${G.wrongs.length})</summary>
            ${G.wrongs.map((w) => `<div class="w"><p>${esc(w.q)}</p>${w.a !== undefined ? `<small>Cevap: <b>${esc(w.type === "tf" ? (w.a ? "Doğru" : "Yanlış") : w.a)}</b></small>` : ""}<small>${esc(w.ex || "")}</small></div>`).join("")}
            ${["quiz", "boss", "daily", "speed", "duel", "ladder", "sort"].includes(G.kind) ? `<small class="muted">Bu sorular Hata Defteri'ne eklendi.</small>` : ""}
          </details>` : ""}
        <div class="row">
          <button class="btn" data-act="retry">↻ Tekrar</button>
          <button class="btn primary" data-act="${G.unit && G.kind !== "daily" ? "backmap" : "home"}">${G.unit && G.kind !== "daily" ? "Haritaya dön" : "Ana sayfa"}</button>
        </div>
      </main>`;
  }

  /* ================= OLAY YÖNETİMİ ================= */
  $app.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    const d = el.dataset;
    switch (d.act) {
      case "home": return renderHome();
      case "subject": sfx.click(); return renderSubject(d.id);
      case "sound": S.sound = !S.sound; save(); return renderHome();
      case "reset": if (el.dataset.armed) { S = fresh(); save(); renderHome(); } else { el.dataset.armed = "1"; el.textContent = "Tüm ilerleme silinecek — onaylamak için tekrar dokun"; } return;
      case "daily": return startGame("daily", {});
      case "review": return startGame("review", {});
      case "play": { const f = findUnit(d.unit); G = null; return startGame(d.kind, { key: d.key, unit: f.u, sid: f.s.id }); }
      case "quit": { const sid = G && G.sid; stopTimers(); return sid ? renderSubject(sid) : renderHome(); }
      case "ans": return answerQuiz(+d.k);
      case "next": return nextQuiz();
      case "sp": return answerSpeed(+d.k);
      case "ml": sfx.click(); G.sel = +d.i; return renderMatch();
      case "mr": return matchRight(+d.i, el);
      case "opick": sfx.click(); G.ans.push(+d.i); G.pool = G.pool.filter((x) => x !== +d.i); return renderOrder();
      case "ounpick": { const i = G.ans.splice(+d.k, 1)[0]; G.pool.push(i); return renderOrder(); }
      case "ocheck": return checkOrder();
      case "finish": return finish();
      case "arcade": sfx.click(); return renderArcade(d.mode);
      case "arcgo": return startArcade(d.mode, d.sid);
      case "joker": return useJoker(d.j);
      case "walk": G.walked = true; return finish();
      case "mem": return flipMemory(+d.k);
      case "bin": return answerSort(+d.k);
      case "pop": return popBalloon(el);
      case "key": return guessLetter(d.c);
      case "whint": return wordHint();
      case "wnext": return nextWord();
      case "retry": { const r = G.retry, sid = G.sid; if (r.arc) return startArcade(r.kind, r.arc); const f = r.unit && findUnit(r.unit); return startGame(r.kind, f ? { key: r.key, unit: f.u, sid } : {}); }
      case "backmap": return renderSubject(G.sid);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!G) return;
    if (G.kind === "speed" && G.timer) {
      if (e.key === "ArrowLeft") answerSpeed(0);
      if (e.key === "ArrowRight") answerSpeed(1);
    } else if (G.kind === "sort" && !G.over) {
      if (e.key === "ArrowLeft") answerSort(0);
      if (e.key === "ArrowRight") answerSort(1);
    } else if (G.kind === "word" && !G.over && !G.wordDone && e.key.length === 1) {
      const c = e.key.toLocaleUpperCase("tr"); if (isLetter(c)) guessLetter(c);
    } else if (document.querySelector(".opt:not([disabled])") && /^[1-4]$/.test(e.key)) {
      const b = document.querySelectorAll(".opt")[+e.key - 1]; if (b) b.click();
    } else if (e.key === "Enter") {
      const n = document.querySelector('[data-act="next"]'); if (n) n.click();
    }
  });

  renderHome();
})();
