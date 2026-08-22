document.addEventListener("DOMContentLoaded", () => {

  const stickers = document.querySelectorAll(".draggableSticker");

  stickers.forEach(sticker => {

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    sticker.addEventListener("pointerdown", (e) => {

      dragging = true;

      sticker.classList.add("draggingSticker");

      const rect = sticker.getBoundingClientRect();

      // Distancia entre el punto donde haces click
      // y la esquina del sticker
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      /*
       * MUY IMPORTANTE:
       * Sacamos el sticker de stickerBoard
       * y lo colocamos directamente en el body.
       */

      document.body.appendChild(sticker);

      // Ahora usamos posición respecto a toda la ventana
      sticker.style.position = "fixed";

      sticker.style.left = `${e.clientX - offsetX}px`;
      sticker.style.top = `${e.clientY - offsetY}px`;

      sticker.style.zIndex = "9999";

      sticker.setPointerCapture(e.pointerId);

      e.preventDefault();

    });


    sticker.addEventListener("pointermove", (e) => {

      if (!dragging) return;

      let newLeft = e.clientX - offsetX;
      let newTop = e.clientY - offsetY;

      // Límites de la pantalla
      const maxLeft = window.innerWidth - sticker.offsetWidth;
      const maxTop = window.innerHeight - sticker.offsetHeight;

      newLeft = Math.max(0, Math.min(maxLeft, newLeft));
      newTop = Math.max(0, Math.min(maxTop, newTop));

      sticker.style.left = `${newLeft}px`;
      sticker.style.top = `${newTop}px`;

    });


    function stopDragging(e) {

      dragging = false;

      sticker.classList.remove("draggingSticker");

      if (e && sticker.hasPointerCapture(e.pointerId)) {
        sticker.releasePointerCapture(e.pointerId);
      }

    }


    sticker.addEventListener("pointerup", stopDragging);
    sticker.addEventListener("pointercancel", stopDragging);

  });

});