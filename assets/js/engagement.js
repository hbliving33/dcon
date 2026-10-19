(() => {
  const btns = document.querySelectorAll("#chooser button");
  btns.forEach((b) => b.addEventListener("click", () => {
    btns.forEach((x) => x.setAttribute("aria-pressed", x === b));
    document.querySelectorAll(".eng").forEach((c) => c.classList.toggle("pick", c.id === b.dataset.target));
    document.querySelectorAll(".eng").forEach((c) => c.classList.toggle("dim", c.id !== b.dataset.target));
    const card = document.getElementById(b.dataset.target);
    if (card) card.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }));
})();
