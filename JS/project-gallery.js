/*
  AEME — project-gallery.js
  Convierte cualquier grupo de imágenes marcadas con class="galleryThumb"
  en un carrusel grande al hacer clic. Se puede reutilizar en cualquier
  página de proyecto: solo hace falta repetir el mismo HTML de galería.
*/
/*
  AEME — project-gallery.js
  Lightbox para imágenes y vídeos.
*/

(() => {
  const thumbs = [...document.querySelectorAll(".galleryThumb")];

  if (!thumbs.length) return;

  const items = thumbs.map(btn => {
    const image = btn.querySelector("img");
    const video = btn.querySelector("video");

    if (video) {
      const source = video.querySelector("source");

      return {
        type: "video",
        src: source ? source.src : video.currentSrc,
        alt: btn.getAttribute("aria-label") || ""
      };
    }

    return {
      type: "image",
      src: btn.dataset.full || image.src,
      alt: image.alt || ""
    };
  });

  const lightbox = document.createElement("div");
  lightbox.className = "projectLightbox";

  lightbox.innerHTML = `
    <div class="lightboxStage">

      <img class="lightboxImage" alt="">

      <video
        class="lightboxVideo"
        controls
        autoplay
        muted
        loop
        playsinline>
      </video>

      <button
        class="lightboxPrev"
        type="button"
        aria-label="Previous image">
        ‹
      </button>

      <button
        class="lightboxNext"
        type="button"
        aria-label="Next image">
        ›
      </button>

      <button
        class="lightboxClose"
        type="button"
        aria-label="Close">
        ×
      </button>

    </div>
  `;

  document.body.appendChild(lightbox);

  const lightboxImage = lightbox.querySelector(".lightboxImage");
  const lightboxVideo = lightbox.querySelector(".lightboxVideo");

  let current = 0;

  function show(index) {

    current = (index + items.length) % items.length;

    const item = items[current];

    /* Reset */
    lightboxImage.style.display = "none";
    lightboxVideo.style.display = "none";

    lightboxImage.removeAttribute("src");
    lightboxVideo.removeAttribute("src");

    lightboxVideo.pause();

    /* IMAGE */
    if (item.type === "image") {

      lightboxImage.src = item.src;
      lightboxImage.alt = item.alt;
      lightboxImage.style.display = "block";

    }

    /* VIDEO */
    else if (item.type === "video") {

      lightboxVideo.src = item.src;
      lightboxVideo.style.display = "block";

      lightboxVideo.play().catch(() => {
        /* Algunos navegadores pueden bloquear autoplay */
      });

    }
  }

  function open(index) {

    show(index);

    lightbox.classList.add("isOpen");

    document.body.style.overflow = "hidden";
  }

  function close() {

    lightbox.classList.remove("isOpen");

    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");

    document.body.style.overflow = "";
  }

  /* Click en las miniaturas */

  thumbs.forEach((btn, index) => {

    btn.addEventListener("click", () => {
      open(index);
    });

  });

  /* Flecha anterior */

  lightbox
    .querySelector(".lightboxPrev")
    .addEventListener("click", () => {
      show(current - 1);
    });

  /* Flecha siguiente */

  lightbox
    .querySelector(".lightboxNext")
    .addEventListener("click", () => {
      show(current + 1);
    });

  /* Cerrar */

  lightbox
    .querySelector(".lightboxClose")
    .addEventListener("click", close);

  /* Clicar fuera */

  lightbox.addEventListener("click", event => {

    if (event.target === lightbox) {
      close();
    }

  });

  /* Teclado */

  window.addEventListener("keydown", event => {

    if (!lightbox.classList.contains("isOpen")) return;

    if (event.key === "Escape") {
      close();
    }

    if (event.key === "ArrowLeft") {
      show(current - 1);
    }

    if (event.key === "ArrowRight") {
      show(current + 1);
    }

  });

})();