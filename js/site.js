(function () {
  const wrap = document.querySelector("[data-share]");
  if (!wrap) return;

  const url = encodeURIComponent(location.href);
  const title = encodeURIComponent(document.title);

  const wa = wrap.querySelector('[data-share="wa"]');
  const fb = wrap.querySelector('[data-share="fb"]');
  const pin = wrap.querySelector('[data-share="pin"]');
  const copyBtn = wrap.querySelector('[data-share="copy"]');

  if (wa) wa.href = `https://wa.me/?text=${title}%0A${url}`;
  if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  if (pin) pin.href = `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`;

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        copyBtn.textContent = "Copiado ✅";
        setTimeout(() => (copyBtn.textContent = "Copiar link"), 1200);
      } catch {
        alert("No pude copiar. Copialo manualmente de la barra.");
      }
    });
  }
})();
