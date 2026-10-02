// Tema visual de Nina (cafetería de especialidad). Se activa con ?local=nina o <html data-tema="nina">.
// Los demás locales no cambian. Va en el <head>, antes de que se dibuje la página.
(function () {
  var local = new URLSearchParams(location.search).get("local");
  if (local !== "nina" && document.documentElement.getAttribute("data-tema") !== "nina") return;

  document.documentElement.classList.add("tema-nina");
  var base = document.currentScript.src.replace(/tema\.js.*$/, "");
  document.write(
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&display=swap">' +
    '<link rel="stylesheet" href="' + base + 'tema-nina.css?v=20261002d">'
  );

  // La interfaz de Nina no usa emojis: los íconos son SVG y el resto es texto.
  // Se dejan solo en las fotos de los platos (.foto) y donde se marque con data-emoji.
  var EMOJI = /[\p{Extended_Pictographic}️‍]+\s*/gu;
  function limpiar() {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var nodos = [], n;
    while ((n = w.nextNode())) nodos.push(n);
    nodos.forEach(function (t) {
      var p = t.parentElement;
      if (!p || p.closest(".foto, [data-emoji], script, style, textarea")) return;
      var nuevo = t.nodeValue.replace(EMOJI, "");
      if (nuevo !== t.nodeValue) t.nodeValue = nuevo;
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    var pendiente = false;
    var obs = new MutationObserver(function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () {
        pendiente = false;
        obs.disconnect();
        limpiar();
        obs.observe(document.body, { childList: true, subtree: true, characterData: true });
      });
    });
    limpiar();
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
