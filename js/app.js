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
    stats: { correct: 0, wrong: 0, games: 0, bestCombo: 0, cleared: 0, bossWins: 0 }
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
    { id: "lvl5", icon: "🏅", name: "Usta Aday", desc: "5. seviyeye ulaş", test: (s) => levelInfo(s.xp).lvl >= 5 }
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
  const optLabels = (it) => (it.type === "tf" ? ["Doğru", "Yanlış"] : it.opts);
  const isRight = (it, idx) => (it.type === "tf" ? (idx === 0) === it.a : it.opts[idx] === it.a);
  const rightIdx = (it) => (it.type === "tf" ? (it.a ? 0 : 1) : it.opts.indexOf(it.a));

  /* ---------------- harita düğümleri ---------------- */
  function nodesFor(u) {
    const n = [
      { kind: "quiz", label: "Bilgi Yarışı", icon: "❓" },
      { kind: "speed", label: "Hız Turu: Doğru mu?", icon: "⚡" },
      { kind: "match", label: "Eşleştir", icon: "🧩" }
    ];
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
  function stopTimers() { if (G && G.timer) { clearInterval(G.timer); G.timer = null; } }

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
    G = Object.assign({ kind, i: 0, correct: 0, total: 0, combo: 0, maxCombo: 0, xp: 0, wrongs: [], lives: Infinity }, opts);
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
    if (["quiz", "boss", "daily", "review"].includes(kind)) return renderQuiz();
    if (kind === "speed") { G.items = tfItems(G.unit, G.unit.gen ? 15 : 8); G.timeLeft = G.unit.gen ? 60 : 45; return renderSpeed(); }
    if (kind === "match") return startMatch();
    if (kind === "order") return startOrder();
  }

  function gameTop(extra = "") {
    const prog = G.items ? (G.i / G.items.length) * 100 : 0;
    return `<header class="game-top">
      <button class="btn-ghost back" data-act="quit">✕</button>
      <div class="bar grow"><span style="width:${prog}%"></span></div>
      ${G.lives !== Infinity ? `<span class="chip hearts">${"❤️".repeat(G.lives)}${"🖤".repeat(3 - G.lives)}</span>` : ""}
      ${extra}
    </header>`;
  }

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
    const titles = { quiz: "Bilgi Yarışı", boss: "🐉 Boss Savaşı", daily: "🎁 Günün Görevi", review: "📕 Hata Defteri" };
    $app.innerHTML = `${gameTop(G.combo >= 2 ? `<span class="chip combo">🔥x${G.combo}</span>` : "")}
      <main class="play ${G.kind === "boss" ? "boss-bg" : ""}">
        <div class="meta"><span>${titles[G.kind]}</span><span>${G.i + 1} / ${G.items.length}</span></div>
        <div class="timer"><span id="tbar"></span></div>
        <div class="qcard"><small class="src">${esc(it.src || "")}</small><p class="q">${esc(it.q)}</p></div>
        <div class="opts ${it.type === "tf" ? "tf" : ""}">
          ${optLabels(it).map((o, k) => `<button class="opt" data-act="ans" data-k="${k}"><b>${it.type === "tf" ? (k ? "✘" : "✔") : "ABCD"[k]}</b>${esc(o)}</button>`).join("")}
        </div>
        <div id="fb"></div>
      </main>`;
    const end = Date.now() + G.qTime * 1000;
    const bar = document.getElementById("tbar");
    G.answered = false;
    G.qEnd = end;
    G.timer = setInterval(() => {
      const left = Math.max(0, end - Date.now());
      bar.style.width = (left / (G.qTime * 1000)) * 100 + "%";
      bar.className = left < 5000 ? "warn" : "";
      if (left <= 0) answerQuiz(-1);
    }, 100);
  }

  function answerQuiz(k) {
    if (G.answered) return;
    G.answered = true; stopTimers();
    const it = G.items[G.i], ok = k >= 0 && isRight(it, k);
    recordAnswer(it, ok, Math.max(0, (G.qEnd - Date.now()) / 1000));
    document.querySelectorAll(".opt").forEach((b, idx) => {
      b.disabled = true;
      if (idx === rightIdx(it)) b.classList.add("right");
      else if (idx === k) b.classList.add("wrong");
    });
    const last = G.i + 1 >= G.items.length || G.lives <= 0;
    document.getElementById("fb").innerHTML = `<div class="feedback ${ok ? "ok" : "no"}">
        <b>${ok ? pick(["Harika! 🎉", "Doğru! 💪", "Süper! ✨", "Aynen böyle! 🚀"]) : k < 0 ? "Süre doldu ⏰" : "Yanlış 😕"}</b>
        <p>${esc(it.ex || "")}</p>
        <button class="btn primary" data-act="next">${last ? "Sonuçları gör" : "Devam"}</button>
      </div>`;
    if (!ok && G.lives !== Infinity) document.querySelector(".hearts").innerHTML = "❤️".repeat(Math.max(0, G.lives)) + "🖤".repeat(3 - Math.max(0, G.lives));
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
    let pct = G.correct / total;
    if (G.kind === "speed") pct = G.correct / G.items.length;
    const lost = G.kind === "boss" && G.lives <= 0;
    const stars = lost ? 0 : pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;
    let bonus = 0;
    if (G.kind === "daily" && S.dailyDone !== dayStr()) { bonus = 50; S.dailyDone = dayStr(); }
    if (G.kind === "boss" && !lost && stars) { bonus += 30; S.stats.bossWins++; }
    const earned = G.xp + bonus;
    const before = levelInfo(S.xp).lvl;

    S.xp += earned;
    S.stats.games++;
    S.stats.correct += G.correct;
    S.stats.wrong += G.kind === "match" ? G.misses : total - G.correct;
    S.stats.bestCombo = Math.max(S.stats.bestCombo, G.maxCombo);
    if (G.key) S.stars[G.key] = Math.max(S.stars[G.key] || 0, stars);
    const t = dayStr();
    if (S.lastDay !== t) { S.streak = S.lastDay === yesterday() ? S.streak + 1 : 1; S.lastDay = t; }
    const newBadges = BADGES.filter((b) => !S.badges.includes(b.id) && b.test(S));
    newBadges.forEach((b) => S.badges.push(b.id));
    save();
    const levelUp = levelInfo(S.xp).lvl > before;

    if (stars === 3 || levelUp) { sfx.win(); confetti(); } else if (stars) sfx.win();

    const msg = lost ? "Boss seni yendi! Hatalarını incele, tekrar dene 💪"
      : stars === 3 ? "Muhteşem! Konuyu fethettin 👑" : stars === 2 ? "Çok iyi! Biraz daha pratikle 3 yıldız senin." : stars === 1 ? "Geçtin! Sonraki bölüm açıldı 🔓" : "Bu sefer olmadı. Açıklamaları oku ve tekrar dene.";
    const retry = { kind: G.kind, key: G.key, unit: G.unit && G.unit.id };
    G.retry = retry;
    $app.innerHTML = `<main class="result">
        <div class="big-stars">${[1, 2, 3].map((k) => `<i class="${stars >= k ? "on" : ""}" style="animation-delay:${k * 0.2}s">★</i>`).join("")}</div>
        <h2>${lost ? "💀 Yenildin" : G.kind === "boss" && stars ? "🐉 Boss yenildi!" : "Bölüm bitti"}</h2>
        <p class="msg">${msg}</p>
        <div class="res-grid">
          <div><b>${G.correct}/${G.kind === "speed" ? G.items.length : total}</b><small>Doğru</small></div>
          <div><b>+${earned}</b><small>XP${bonus ? ` (+${bonus} bonus)` : ""}</small></div>
          <div><b>🔥${G.maxCombo}</b><small>En iyi kombo</small></div>
        </div>
        ${levelUp ? `<div class="lvlup">⬆️ Seviye atladın! Artık <b>${levelInfo(S.xp).lvl}. seviye ${levelInfo(S.xp).title}</b></div>` : ""}
        ${newBadges.map((b) => `<div class="newbadge">${b.icon} Yeni rozet: <b>${b.name}</b> — ${b.desc}</div>`).join("")}
        ${G.wrongs.length ? `<details class="wrongs" open><summary>Gözden geçir (${G.wrongs.length})</summary>
            ${G.wrongs.map((w) => `<div class="w"><p>${esc(w.q)}</p>${w.a !== undefined ? `<small>Cevap: <b>${esc(w.type === "tf" ? (w.a ? "Doğru" : "Yanlış") : w.a)}</b></small>` : ""}<small>${esc(w.ex || "")}</small></div>`).join("")}
            ${["quiz", "boss", "daily", "speed"].includes(G.kind) ? `<small class="muted">Bu sorular Hata Defteri'ne eklendi.</small>` : ""}
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
      case "retry": { const r = G.retry, sid = G.sid; const f = r.unit && findUnit(r.unit); return startGame(r.kind, f ? { key: r.key, unit: f.u, sid } : {}); }
      case "backmap": return renderSubject(G.sid);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!G) return;
    if (G.kind === "speed" && G.timer) {
      if (e.key === "ArrowLeft") answerSpeed(0);
      if (e.key === "ArrowRight") answerSpeed(1);
    } else if (document.querySelector(".opt:not([disabled])") && /^[1-4]$/.test(e.key)) {
      const b = document.querySelectorAll(".opt")[+e.key - 1]; if (b) b.click();
    } else if (e.key === "Enter") {
      const n = document.querySelector('[data-act="next"]'); if (n) n.click();
    }
  });

  renderHome();
})();
