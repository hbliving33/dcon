(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Platform ticker: duplicate the list so the scroll loops seamlessly
  const track = document.querySelector(".ticker-track");
  if (track && !reduce) { track.innerHTML += track.innerHTML; track.classList.add("run"); }

  // Reveal sections as they scroll in (content is visible without JavaScript)
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      e.target.querySelectorAll(".count").forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.18 }) : null;
  document.querySelectorAll(".reveal").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (io && !reduce && r.top > innerHeight) { el.classList.add("pre"); io.observe(el); }
  });

  // Count-up numbers
  function countUp(el) {
    if (reduce || el.dataset.done) return;
    el.dataset.done = 1;
    const to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0);
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const start = performance.now(), dur = 1400;
    (function step(now) {
      const t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 3);
      el.textContent = pre + (to * e).toFixed(dec) + suf;
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  // Spotlight that follows the pointer on the pain-point tiles
  document.querySelectorAll(".pain-tile").forEach((t) => t.addEventListener("pointermove", (e) => {
    const r = t.getBoundingClientRect();
    t.style.setProperty("--mx", `${e.clientX - r.left}px`);
    t.style.setProperty("--my", `${e.clientY - r.top}px`);
  }));

  // IT health check
  const qs = document.getElementById("questions");
  if (!qs) return;
  const answers = {};
  const fill = document.getElementById("gaugeFill");
  const num = document.getElementById("gaugeNum");
  const title = document.getElementById("verdictTitle");
  const text = document.getElementById("verdictText");
  const cta = document.getElementById("checkCta");
  // Six gauge segments, one per question: green for Yes, red for No
  fill.style.display = "none";
  const svg = fill.ownerSVGElement, ns = "http://www.w3.org/2000/svg";
  const pt = (deg) => [100 + 80 * Math.cos(deg * Math.PI / 180), 110 - 80 * Math.sin(deg * Math.PI / 180)];
  const segs = [];
  for (let i = 0; i < 6; i++) {
    const a0 = 180 - i * 30 - 1.5, a1 = 180 - (i + 1) * 30 + 1.5;
    const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
    const seg = document.createElementNS(ns, "path");
    seg.setAttribute("d", `M${x0.toFixed(2)} ${y0.toFixed(2)} A80 80 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`);
    seg.setAttribute("class", "g-seg");
    svg.appendChild(seg); segs.push(seg);
  }
  svg.querySelector(".g-track").style.display = "none";
  const order = [...qs.querySelectorAll("li")].map((li) => li.dataset.q);

  qs.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]");
    if (!b) return;
    const li = b.closest("li");
    answers[li.dataset.q] = +b.dataset.v;
    li.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    li.classList.toggle("yes", b.dataset.v === "1");
    li.classList.toggle("no", b.dataset.v === "0");
    update();
  });
  qs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "false"));

  function update() {
    const done = Object.keys(answers).length;
    const score = Object.values(answers).reduce((a, b) => a + b, 0);
    num.textContent = score;
    order.forEach((q, i) => {
      const st = q in answers ? (answers[q] ? "yes" : "no") : "";
      if (segs[i].dataset.st !== st) { segs[i].dataset.st = st; segs[i].classList.remove("pop"); void segs[i].getBoundingClientRect(); segs[i].classList.add("pop"); }
    });
    num.classList.remove("bump"); void num.offsetWidth; num.classList.add("bump");
    const tier = score <= 2 ? "risk" : score <= 4 ? "gaps" : "good";
    fill.dataset.tier = tier;
    if (done < 6) {
      title.textContent = `${done} of 6 answered`;
      text.textContent = "Keep going.  Every \"No\" is a gap worth closing.";
      cta.hidden = true;
      return;
    }
    if (tier === "risk") { title.textContent = "High risk.  Let's fix that, fast."; text.textContent = "You have several open doors an attacker would love.  The good news: most can be closed in weeks, not months."; }
    else if (tier === "gaps") { title.textContent = "Solid start, with gaps to close."; text.textContent = "You've covered the basics.  The remaining gaps are exactly where most breaches start."; }
    else { title.textContent = "In good shape.  Let's keep it that way."; text.textContent = "You're ahead of most businesses.  A quick review makes sure nothing slipped through."; }
    cta.href = `contact.html?topic=assessment&score=${score}#contactForm`;
    cta.hidden = false;
  }
})();

// Home testimonial strip: rotate quotes
(() => {
  const rot = document.getElementById("tqsRot");
  if (!rot) return;
  const items = [...rot.children];
  if (items.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let i = 0;
  setInterval(() => { items[i].classList.remove("on"); i = (i + 1) % items.length; items[i].classList.add("on"); }, 6000);
})();
