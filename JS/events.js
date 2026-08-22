/*
  AEME — events.js
  Lee los arrays EVENTS y DECORATIONS de data.js y los dibuja encima
  de la rejilla. No hace falta tocar este archivo para añadir o
  cambiar eventos: eso se hace en data.js.
*/

function renderEvents() {
  const layer = document.getElementById("eventsLayer");
  layer.innerHTML = "";

  const rowHeight = 100 / TIME_SLOTS.length;
  const colWidth = 100 / 7;
  const imagesToRender = [];

  EVENTS.forEach(event => {
    // Si el evento tiene "link" en data.js, la tarjeta se crea como
    // enlace real (<a>); si no, como tarjeta normal (<article>).
    const element = document.createElement(event.link ? "a" : "article");
    element.className = `event ${event.type || ""} ${event.link ? "isLink" : ""} ${event.hover ? "isHover" : ""} ${event.confetti ? "isConfetti" : ""}`.trim();

    if (event.link) {
      element.href = event.link;
      element.target = "_blank";
      element.rel = "noopener";
    }

    if (event.confetti) {
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "0");
      element.setAttribute("aria-label", "Celebrate AEME portfolio");
      element.addEventListener("click", e => {
        e.preventDefault();
        launchConfetti(e.clientX, e.clientY);
      });
      element.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const rect = element.getBoundingClientRect();
          launchConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      });
    }

    const left = event.day * colWidth;
    const top = event.row * rowHeight;
    const width = (event.span || 1) * colWidth;
    const height = (event.duration || 1) * rowHeight;

    element.style.left = `${left}%`;
    element.style.width = `${width}%`;
    element.style.top = `${top}%`;
    element.style.height = `${height}%`;

    if (event.title) {
      const text = document.createElement("span");
      text.className = "eventText";
      text.textContent = event.title;
      element.appendChild(text);
    }

    layer.appendChild(element);

    // Las imágenes NO se meten dentro de la tarjeta: se guardan aquí y
    // se pintan todas juntas después, en una capa aparte por encima de
    // todo. Así el hover de la tarjeta (levantarse, sombra) nunca
    // afecta a la imagen: son elementos independientes, superpuestos.
    if (event.image) {
      imagesToRender.push({ event, left, top, width, height });
    }
  });

  imagesToRender.forEach(({ event, left, top, width, height }) => {
    const wrap = document.createElement(event.link ? "a" : "div");
    wrap.className = `eventImageWrap ${event.link ? "isLink" : ""}`.trim();
    wrap.style.left = `${left}%`;
    wrap.style.top = `${top}%`;
    wrap.style.width = `${width}%`;
    wrap.style.height = `${height}%`;

    if (event.link) {
      wrap.href = event.link;
      wrap.setAttribute("aria-label", event.title ? event.title.replace(/\n/g, " ") : "Open project");
    }

    const img = document.createElement("img");
    img.className = "eventImage";
    img.src = event.image;
    img.alt = "";
    if (event.imageStyle) img.style.cssText = event.imageStyle;

    wrap.appendChild(img);
    layer.appendChild(wrap);
  });
}

function renderDecorations() {
  const layer = document.getElementById("decorLayer");
  layer.innerHTML = "";

  const rowHeight = 100 / TIME_SLOTS.length;
  const colWidth = 100 / 7;

  (DECORATIONS || []).forEach(deco => {
    const note = document.createElement("div");
    note.className = "postitDraggable";
    note.style.left = `calc(${deco.day * colWidth}% + ${deco.offsetX || 0}px)`;
    note.style.top = `calc(${deco.row * rowHeight}% + ${deco.offsetY || 0}px)`;
    note.style.width = `${deco.width || 127}px`;
    note.style.transform = deco.rotate ? `rotate(${deco.rotate}deg)` : "";
    note.tabIndex = 0;
    note.setAttribute("role", "button");
    note.setAttribute("aria-label", "Draggable post-it");

    if (deco.image) {
      const img = document.createElement("img");
      img.className = "postitImage";
      img.src = deco.image;
      img.alt = "";
      img.draggable = false;
      img.onerror = function () { this.remove(); note.classList.add("postitFallback"); };
      note.appendChild(img);
    } else note.classList.add("postitFallback");

    if (deco.comment) {
      const comment = document.createElement("span");
      comment.className = "postitComment";
      comment.textContent = deco.comment;
      note.appendChild(comment);
    }

    let dragging = false, startX, startY, baseLeft, baseTop;
    note.addEventListener("pointerdown", e => {
      dragging = true;
      note.classList.add("dragging");
      note.setPointerCapture(e.pointerId);
      startX = e.clientX; startY = e.clientY;
      const rect = note.getBoundingClientRect();
      const parent = layer.getBoundingClientRect();
      baseLeft = rect.left - parent.left; baseTop = rect.top - parent.top;
      note.style.left = `${baseLeft}px`; note.style.top = `${baseTop}px`;
      note.style.transform = "rotate(0deg)";
      e.preventDefault();
    });
    note.addEventListener("pointermove", e => {
      if (!dragging) return;
      const parent = layer.getBoundingClientRect();
      const maxX = parent.width - note.offsetWidth;
      const maxY = parent.height - note.offsetHeight;
      const x = Math.max(0, Math.min(maxX, baseLeft + e.clientX - startX));
      const y = Math.max(0, Math.min(maxY, baseTop + e.clientY - startY));
      note.style.left = `${x}px`; note.style.top = `${y}px`;
    });
    const endDrag = () => { dragging = false; note.classList.remove("dragging"); };
    note.addEventListener("pointerup", endDrag);
    note.addEventListener("pointercancel", endDrag);
    layer.appendChild(note);
  });
}


/* Confetti for the AEME PORTFOLIO WEB cells. No external library required. */
function launchConfetti(originX, originY) {
  const colors = ["#ff6b00", "#005066", "#001a3d", "#ffd400", "#ffffff"];
  const pieces = 90;

  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement("span");
    piece.className = "confettiPiece";
    piece.style.left = `${originX}px`;
    piece.style.top = `${originY}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = `${5 + Math.random() * 6}px`;
    piece.style.height = `${7 + Math.random() * 9}px`;

    const angle = Math.random() * Math.PI * 2;
    const distance = 90 + Math.random() * 260;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance + 100;
    const rotation = (Math.random() - 0.5) * 900;

    piece.style.setProperty("--confetti-x", `${x}px`);
    piece.style.setProperty("--confetti-y", `${y}px`);
    piece.style.setProperty("--confetti-rotation", `${rotation}deg`);
    piece.style.animationDelay = `${Math.random() * 80}ms`;
    piece.style.animationDuration = `${700 + Math.random() * 700}ms`;

    document.body.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove(), { once: true });
  }
}
