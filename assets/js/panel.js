// Home page: when a service is picked on the cube, its piece flies off the cube,
// stretches into a red bar, and unrolls into a service panel under the hero.
(() => {
  const panel = document.getElementById("svcPanel");
  if (!panel) return;
  const body = document.getElementById("spBody");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const glyphs = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&/*+$@";
  const rnd = (s) => s[Math.floor(Math.random() * s.length)];
  let openSlug = null, busy = 0, decodeTimer;

  const announce = (open) => dispatchEvent(new CustomEvent("dc:panel", { detail: { open } }));

  function decode(el) {
    const target = el.dataset.text || el.textContent;
    let f = 0;
    clearInterval(decodeTimer);
    if (reduce) { el.textContent = target; return; }
    decodeTimer = setInterval(() => {
      f++;
      el.textContent = [...target].map((c, i) => (c === " " ? " " : i < f / 2 ? c : rnd(glyphs))).join("");
      if (f / 2 >= target.length) clearInterval(decodeTimer);
    }, 26);
  }

  function render(slug) {
    const tpl = document.getElementById("sp-" + slug);
    body.innerHTML = "";
    body.appendChild(tpl.content.cloneNode(true));
    body.querySelectorAll(".sp-item").forEach((el, i) => el.style.setProperty("--d", (i * 70) + "ms"));
    const close = body.querySelector(".sp-close");
    if (close) close.addEventListener("click", closePanel);
    const next = body.querySelector(".sp-next");
    if (next) next.addEventListener("click", () => window.dcCube && window.dcCube.select(+next.dataset.next));
  }

  function fly(from, toX, toY, toW) {
    const el = document.createElement("div");
    el.className = "sp-fly";
    document.body.appendChild(el);
    const a = el.animate([
      { left: from.left + "px", top: from.top + "px", width: from.width + "px", height: from.height + "px", borderRadius: "6px", opacity: 1 },
      { left: (from.left + toX) / 2 + "px", top: Math.min(from.top, toY) + (Math.abs(toY - from.top) * 0.45) + "px", width: from.width * 0.7 + "px", height: from.height * 0.7 + "px", borderRadius: "50%", opacity: 1, offset: 0.45 },
      { left: toX + "px", top: toY + "px", width: toW + "px", height: "4px", borderRadius: "2px", opacity: 1 }
    ], { duration: 700, easing: "cubic-bezier(.55,.05,.25,1)", fill: "forwards" });
    return a.finished.then(() => el.remove());
  }

  function open(detail) {
    const token = ++busy;
    const wasOpen = !panel.hidden;
    render(detail.slug);
    openSlug = detail.slug;
    panel.hidden = false;
    panel.classList.remove("unrolled", "rolling");
    void panel.offsetWidth;
    announce(true);

    // Where the panel's top edge will sit once the page has scrolled to it
    const r = panel.getBoundingClientRect();
    const docTop = r.top + scrollY;
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    const targetScroll = Math.max(0, Math.min(docTop - 84, maxScroll));
    const viewTop = docTop - targetScroll;

    if (reduce) {
      scrollTo(0, targetScroll);
      panel.classList.add("unrolled");
      decode(body.querySelector(".sp-title"));
      return;
    }
    scrollTo({ top: targetScroll, behavior: "smooth" });
    const from = detail.rect && detail.rect.width ? detail.rect : { left: innerWidth / 2 - 30, top: 120, width: 60, height: 60 };
    fly(from, r.left, viewTop, r.width).then(() => {
      if (token !== busy) return;
      panel.classList.add("rolling");
      requestAnimationFrame(() => {
        panel.classList.add("unrolled");
        decode(body.querySelector(".sp-title"));
      });
    });
    if (wasOpen) panel.classList.add("swap");
    else panel.classList.remove("swap");
  }

  function closePanel() {
    if (panel.hidden) return;
    const token = ++busy;
    panel.classList.remove("unrolled");
    panel.classList.add("rolling");
    const done = () => {
      if (token !== busy) return;
      panel.hidden = true; panel.classList.remove("rolling");
      openSlug = null;
      announce(false);
      if (window.dcCube) window.dcCube.release();
    };
    if (reduce) done(); else setTimeout(done, 520);
    const stage = document.getElementById("stage");
    if (stage) scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  addEventListener("dc:service", (e) => open(e.detail));
  addEventListener("dc:close", closePanel);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) closePanel(); });
})();
