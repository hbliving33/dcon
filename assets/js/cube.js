(() => {
  const services = [
    { name: "Microsoft 365", pos: [0, 0, 1] },   // front
    { name: "Cybersecurity", pos: [1, 0, 0] },   // right
    { name: "Network",       pos: [0, 0, -1] },  // back
    { name: "Cloud",         pos: [-1, 0, 0] },  // left
    { name: "Compliance",    pos: [0, -1, 0] },  // top
    { name: "IT Strategy",   pos: [0, 1, 0] },   // bottom
    { name: "Physical Security", pos: [1, -1, 1] } // front-top-right corner
  ];
  // rotation that brings each face toward the viewer (rotateX, rotateY), with a slight tilt
  const aim = { "0,0,1": [-14, -18], "1,0,0": [-14, -90 - 18], "0,0,-1": [-14, 180 - 18], "-1,0,0": [-14, 90 - 18], "0,-1,0": [-74, -18], "0,1,0": [74, -18], "1,-1,1": [-38, -63] };
  const glyphs = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&?/*|+<>[]{}$@=";
  const rnd = s => s[Math.floor(Math.random() * s.length)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cube = document.getElementById("cube");
  const stage = document.getElementById("stage");
  const coreText = document.getElementById("coreText");
  const picker = document.getElementById("picker");

  // build 27 blocks
  const faceDefs = [["front", 2, 1], ["back", 2, -1], ["right", 0, 1], ["left", 0, -1], ["top", 1, -1], ["bottom", 1, 1]];
  const blocks = [], cells = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    const el = document.createElement("div");
    el.className = "cubelet";
    const p = [x, y, z];
    faceDefs.forEach(([n, axis, sign]) => {
      const f = document.createElement("div");
      f.className = "cf c-" + n + (p[axis] === sign ? "" : " inner");
      for (let i = 0; i < 9; i++) { const s = document.createElement("span"); s.textContent = rnd(glyphs); f.appendChild(s); if (!f.classList.contains("inner")) cells.push(s); }
      el.appendChild(f);
    });
    const b = { el, p, out: 0, peek: 0, scatter: null };
    el.dataset.key = p.join(",");
    blocks.push(b); cube.appendChild(el);
  }
  const byKey = k => blocks.find(b => b.el.dataset.key === k);
  const unit = () => cube.clientWidth / 3;

  function place(b) {
    const k = unit();
    const push = 1 + b.out * 0.85 + b.peek * 0.22;
    let [x, y, z] = b.p.map(v => v * k * push);
    let rot = "";
    if (b.scatter) { x = b.scatter.t[0] * k; y = b.scatter.t[1] * k; z = b.scatter.t[2] * k; rot = `rotateX(${b.scatter.r[0]}deg) rotateY(${b.scatter.r[1]}deg) rotateZ(${b.scatter.r[2]}deg)`; }
    b.el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) ${rot}`;
  }
  const placeAll = () => blocks.forEach(place);
  placeAll();
  addEventListener("resize", placeAll);

  // glyph scramble on outside faces
  setInterval(() => {
    for (let i = 0; i < 26; i++) {
      const c = cells[Math.floor(Math.random() * cells.length)];
      c.classList.remove("lit", "hot", "star");
      const r = Math.random();
      if (r < .05) { c.textContent = "★"; c.classList.add("star"); }
      else { c.textContent = rnd(glyphs); if (r < .15) c.classList.add("lit"); else if (r < .19) c.classList.add("hot"); }
    }
  }, reduce ? 600 : 90);

  // word decode
  let wordTimer;
  function showWord(w) {
    const target = w.toUpperCase();
    let frame = 0;
    clearInterval(wordTimer);
    coreText.classList.add("on");
    coreText.classList.remove("pop"); void coreText.offsetWidth; coreText.classList.add("pop");
    wordTimer = setInterval(() => {
      frame++;
      coreText.innerHTML = [...target].map((ch, i) => ch === " " ? "<br>" : (i < frame / 2 ? ch : rnd(glyphs))).join("");
      if (frame / 2 >= target.length) clearInterval(wordTimer);
    }, 28);
  }
  const hideWord = () => coreText.classList.remove("on");

  // rotation state
  let rx = -22, ry = 35, vx = 0, vy = 0.25, dragging = false, moved = 0, lx = 0, ly = 0, downTarget = null;
  let aimAt = null, holdUntil = 0;
  const idle = reduce ? 0 : 0.25;
  const near = (cur, t) => cur + ((((t - cur) % 360) + 540) % 360 - 180);

  // selection
  let current = -1, seq = 0;
  function select(i, fromTour) {
    if (!fromTour) stopTour();
    reassemble(true);
    const s = services[i], b = byKey(s.pos.join(","));
    current = i; const my = ++seq;
    picker.querySelectorAll("button").forEach((x, j) => x.setAttribute("aria-pressed", j === i));
    blocks.forEach(o => { if (o !== b) { o.out = 0; o.el.classList.remove("sel", "flash"); } });
    hideWord();
    const [ax, ay] = aim[s.pos.join(",")];
    aimAt = [ax, near(ry, ay)]; vx = vy = 0; holdUntil = Infinity;
    placeAll();
    setTimeout(() => {
      if (my !== seq) return;
      b.out = 1; b.el.classList.add("sel"); place(b);
      setTimeout(() => {
        if (my !== seq) return;
        b.el.classList.remove("flash"); void b.el.offsetWidth; b.el.classList.add("flash");
        showWord(s.name);
        holdUntil = performance.now() + (fromTour ? 2600 : 5000);
      }, 380);
    }, reduce ? 50 : 650);
  }
  function release() {
    seq++;
    blocks.forEach(o => { o.out = 0; o.el.classList.remove("sel", "flash"); });
    placeAll(); hideWord();
    picker.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", false));
    current = -1;
  }

  // explode
  let exploded = false, explodeTimer;
  function explode() {
    stopTour(); release(); clearTimeout(explodeTimer);
    exploded = true;
    blocks.forEach(b => {
      const j = () => (Math.random() - .5) * 1.1;
      b.scatter = {
        t: b.p.map(v => v * (1.35 + Math.random() * .55) + j() * .6),
        r: reduce ? [0, 0, 0] : [(Math.random() - .5) * 300, (Math.random() - .5) * 300, (Math.random() - .5) * 200]
      };
      b.el.classList.add("flying");
    });
    placeAll();
    showWord("D Consulting");
    vy = reduce ? 0 : 1.6;
    explodeTimer = setTimeout(() => reassemble(), 2200);
  }
  function reassemble(instant) {
    if (!exploded) return;
    clearTimeout(explodeTimer);
    exploded = false;
    blocks.forEach(b => { b.scatter = null; });
    placeAll();
    if (!instant) hideWord();
    setTimeout(() => blocks.forEach(b => b.el.classList.remove("flying")), 1100);
  }

  // tour
  let tourTimer = null, tourIdx = 0;
  function startTour() {
    stopTour(); tourIdx = 0;
    const step = () => { select(tourIdx % services.length, true); tourIdx++; tourTimer = setTimeout(step, 3400); };
    step();
  }
  function stopTour() {
    if (tourTimer) { clearTimeout(tourTimer); tourTimer = null; }
  }

  // service buttons
  services.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.id = "svc" + i; btn.type = "button"; btn.textContent = s.name; btn.setAttribute("aria-pressed", false);
    const b = byKey(s.pos.join(","));
    btn.onclick = () => select(i);
    btn.onmouseenter = btn.onfocus = () => { if (!b.out) { b.peek = 1; b.el.classList.add("peek"); place(b); } };
    btn.onmouseleave = btn.onblur = () => { b.peek = 0; b.el.classList.remove("peek"); place(b); };
    picker.appendChild(btn);
  });

  // pointer: drag to spin, click to pick a piece or break apart
  stage.addEventListener("pointerdown", e => {
    dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; vx = vy = 0; aimAt = null;
    downTarget = e.target.closest(".cubelet");
    stage.classList.add("dragging"); stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 6) { if (tourTimer) stopTour(); hideWord(); }
    ry += dx * 0.4; rx -= dy * 0.4; vy = dx * 0.4; vx = -dy * 0.4;
    lx = e.clientX; ly = e.clientY;
  });
  const end = () => {
    if (!dragging) return;
    dragging = false; stage.classList.remove("dragging");
    if (moved < 6) {
      const i = downTarget ? services.findIndex(s => s.pos.join(",") === downTarget.dataset.key) : -1;
      if (i >= 0 && !exploded) select(i);
      else if (exploded) reassemble();
      else explode();
    } else if (current >= 0) {
      release();
    }
  };
  stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);

  (function tick(now) {
    now = now || performance.now();
    if (!dragging) {
      if (aimAt && now < holdUntil) {
        rx += (aimAt[0] - rx) * 0.09; ry += (aimAt[1] - ry) * 0.09;
      } else {
        if (aimAt) { aimAt = null; if (!tourTimer && current >= 0) release(); }
        ry += vy; rx += vx; vy += (idle - vy) * 0.03; vx *= 0.95; rx += (-22 - rx) * 0.01;
      }
    }
    cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    requestAnimationFrame(tick);
  })();

  if (!reduce) setTimeout(startTour, 900); else select(0, true);
})();
