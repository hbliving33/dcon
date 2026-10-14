(() => {
  // Send visitors to the thank-you page on this same site after the form submits
  try { document.getElementById("nextUrl").value = new URL("thanks.html", location.href).href; } catch (e) {}

  // Prefill from the home page health check: contact.html?topic=assessment&score=3
  const q = new URLSearchParams(location.search);
  if (q.get("topic") === "assessment") document.getElementById("f-topic").value = "IT and security assessment";
  const score = q.get("score");
  if (score !== null && /^[0-6]$/.test(score)) {
    const msg = document.getElementById("f-msg");
    if (!msg.value) msg.value = `I took the IT health check on your site and scored ${score} of 6.  I'd like to go over the results.`;
  }
})();
