// Test home page: when a service is picked on the cube, the hero text turns into that service.
(() => {
  const wrap = document.getElementById("heroSwap");
  const picker = document.getElementById("picker");
  if (!wrap || !picker) return;
  const items = [...wrap.querySelectorAll(".hs-item")];
  const def = wrap.querySelector(".hs-default");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const glyphs = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&/*+$@";
  const rnd = (s) => s[Math.floor(Math.random() * s.length)];
  let timer, shown = def;

  function decode(el) {
    const t = el.dataset.text; let f = 0;
    clearInterval(timer);
    if (reduce) { el.textContent = t; return; }
    timer = setInterval(() => {
      f++;
      el.textContent = [...t].map((c, i) => (c === " " ? " " : i < f / 2 ? c : rnd(glyphs))).join("");
      if (f / 2 >= t.length) clearInterval(timer);
    }, 30);
  }
  function show(el) {
    if (el === shown) return;
    items.forEach((x) => { const on = x === el; x.classList.toggle("on", on); x.setAttribute("aria-hidden", !on); });
    shown = el;
    const n = el.querySelector(".hs-name");
    if (n) decode(n);
  }
  const back = () => { if (window.dcCube) window.dcCube.release(); show(def); };

  addEventListener("dc:service", (e) => {
    const el = wrap.querySelector(`.hs-svc[data-slug="${e.detail.slug}"]`);
    if (el) show(el);
  });
  addEventListener("dc:close", () => show(def));
  // pressing the button that is already lit goes back to the overview
  picker.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b && b.getAttribute("aria-pressed") === "true" && shown !== def) { e.stopPropagation(); back(); }
  }, true);
  wrap.addEventListener("click", (e) => { if (e.target.closest(".hs-x")) back(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && shown !== def) back(); });
  // if the cube lets go of the piece (for example after a drag), go back too
  new MutationObserver(() => {
    if (shown !== def && !picker.querySelector('[aria-pressed="true"]')) show(def);
  }).observe(picker, { subtree: true, attributes: true, attributeFilter: ["aria-pressed"] });
})();
