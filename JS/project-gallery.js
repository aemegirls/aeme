/*
  AEME — project-gallery.js
  Lightbox para imágenes y vídeos
*/

(() => {

  const thumbs = [...document.querySelectorAll(".galleryThumb")];

  if (!thumbs.length) return;


  /* =========================================
     CREAR LISTA DE ELEMENTOS
     ========================================= */

  const items = thumbs.map((btn) => {

    const image = btn.querySelector("img");
    const video = btn.querySelector("video");

    /* Si el elemento es un vídeo */
    if (video) {

      const source = video.querySelector("source");

      return {
        type: "video",
        src: source ? source.src : video.currentSrc,
        alt: btn.getAttribute("aria-label") || ""
      };

    }

    /* Si el elemento es una imagen */
    if (image) {

      return {
        type: "image",
        src: btn.dataset.full || image.currentSrc || image.src,
        alt: image.alt || ""
      };

    }

    return null;

  }).filter(Boolean);


  if (!items.length) return;


  /* =========================================
     CREAR LIGHTBOX
     ========================================= */

  const lightbox = document.createElement("div");

  lightbox.className = "projectLightbox";

  lightbox.innerHTML = `

    <div class="lightboxStage">

      <img
        class="lightboxImage"
        alt=""
      >

      <video
        class="lightboxVideo"
        controls
        autoplay
        muted
        loop
        playsinline
      ></video>


      <button
        class="lightboxPrev"
        type="button"
        aria-label="Previous"
      >
        ‹
      </button>


      <button
        class="lightboxNext"
        type="button"
        aria-label="Next"
      >
        ›
      </button>


      <button
        class="lightboxClose"
        type="button"
        aria-label="Close"
      >
        ×
      </button>

    </div>

  `;


  document.body.appendChild(lightbox);


  const lightboxImage =
    lightbox.querySelector(".lightboxImage");

  const lightboxVideo =
    lightbox.querySelector(".lightboxVideo");


  let current = 0;


  /* =========================================
     MOSTRAR ELEMENTO
     ========================================= */

  function show(index) {

    current =
      (index + items.length) % items.length;

    const item = items[current];


    /* Ocultar ambos */

    lightboxImage.style.display = "none";

    lightboxVideo.style.display = "none";


    /* Limpiar */

    lightboxImage.removeAttribute("src");

    lightboxVideo.pause();

    lightboxVideo.removeAttribute("src");


    /* =====================================
       IMAGEN
       ===================================== */

    if (item.type === "image") {

      lightboxImage.src = item.src;

      lightboxImage.alt = item.alt;

      lightboxImage.style.display = "block";

    }


    /* =====================================
       VÍDEO
       ===================================== */

    if (item.type === "video") {

      lightboxVideo.src = item.src;

      lightboxVideo.style.display = "block";

      lightboxVideo.play().catch(() => {});

    }

  }


  /* =========================================
     ABRIR
     ========================================= */

  function open(index) {

    show(index);

    lightbox.classList.add("isOpen");

    document.body.style.overflow = "hidden";

  }


  /* =========================================
     CERRAR
     ========================================= */

  function close() {

    lightbox.classList.remove("isOpen");

    lightboxVideo.pause();

    lightboxVideo.removeAttribute("src");

    document.body.style.overflow = "";

  }


  /* =========================================
     CLICK EN LAS IMÁGENES
     ========================================= */

  thumbs.forEach((btn, index) => {

    btn.addEventListener("click", () => {

      open(index);

    });

  });


  /* =========================================
     ANTERIOR
     ========================================= */

  lightbox
    .querySelector(".lightboxPrev")
    .addEventListener("click", (event) => {

      event.stopPropagation();

      show(current - 1);

    });


  /* =========================================
     SIGUIENTE
     ========================================= */

  lightbox
    .querySelector(".lightboxNext")
    .addEventListener("click", (event) => {

      event.stopPropagation();

      show(current + 1);

    });


  /* =========================================
     CERRAR BOTÓN
     ========================================= */

  lightbox
    .querySelector(".lightboxClose")
    .addEventListener("click", (event) => {

      event.stopPropagation();

      close();

    });


  /* =========================================
     CLIC FUERA
     ========================================= */

  lightbox.addEventListener("click", (event) => {

    if (event.target === lightbox) {

      close();

    }

  });


  /* =========================================
     TECLADO
     ========================================= */

  window.addEventListener("keydown", (event) => {

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