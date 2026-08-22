/*
  AEME — project-gallery.js
  Convierte cualquier grupo de imágenes marcadas con class="galleryThumb"
  en un carrusel grande al hacer clic. Se puede reutilizar en cualquier
  página de proyecto: solo hace falta repetir el mismo HTML de galería.
*/
(() => {
  const thumbs = [...document.querySelectorAll(".galleryThumb")];
  if (!thumbs.length) return;

  const images = thumbs.map(btn => ({
    src: btn.dataset.full || btn.querySelector("img").src,
    alt: btn.querySelector("img").alt || ""
  }));

  const lightbox = document.createElement("div");
  lightbox.className = "projectLightbox";
  lightbox.innerHTML = `
    <div class="lightboxStage">
      <img alt="">
      <button class="lightboxPrev" type="button" aria-label="Previous image">‹</button>
      <button class="lightboxNext" type="button" aria-label="Next image">›</button>
      <button class="lightboxClose" type="button" aria-label="Close">×</button>
    </div>`;
  document.body.appendChild(lightbox);

  const img = lightbox.querySelector("img");
  let current = 0;

  function show(index) {
    current = (index + images.length) % images.length;
    img.src = images[current].src;
    img.alt = images[current].alt;
  }

  function open(index) {
    show(index);
    lightbox.classList.add("isOpen");
    document.body.style.overflow = "hidden";
  }

  function close() {
    lightbox.classList.remove("isOpen");
    document.body.style.overflow = "";
  }

  thumbs.forEach((btn, i) => {
    btn.addEventListener("click", () => open(i));
  });

  lightbox.querySelector(".lightboxPrev").addEventListener("click", () => show(current - 1));
  lightbox.querySelector(".lightboxNext").addEventListener("click", () => show(current + 1));
  lightbox.querySelector(".lightboxClose").addEventListener("click", close);
  lightbox.addEventListener("click", e => { if (e.target === lightbox) close(); });

  addEventListener("keydown", e => {
    if (!lightbox.classList.contains("isOpen")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
})();
