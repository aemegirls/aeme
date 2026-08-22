/*
  AEME — app.js
  Punto de entrada: arranca el calendario y conecta los botones.
  Este archivo debe cargarse SIEMPRE el último (mira el orden en index.html).
*/

// TODO: pon aquí tu enlace real de reservas (por ejemplo, tu link de Cal.com)
const BOOKING_URL = "https://calendar.app.google/QhJZkNdJLSPyAAFX7";

function initCalendar() {
  const dates = buildWeek();

  renderHeader(dates);
  renderTimes();
  renderGrid();
  renderEvents();
  renderDecorations();
}

document.addEventListener("DOMContentLoaded", () => {
  initCalendar();

  const searched = sessionStorage.getItem("aemeSearch");
  if (searched) {
    sessionStorage.removeItem("aemeSearch");
    requestAnimationFrame(() => {
      const needle = searched.toLowerCase();
      document.querySelectorAll(".event").forEach(el => {
        if (el.textContent.toLowerCase().includes(needle)) {
          el.classList.add("searchHit");
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          setTimeout(() => el.classList.remove("searchHit"), 2200);
        }
      });
    });
  }

  const appointmentButton = document.getElementById("appointmentButton");
  if (appointmentButton) {
    appointmentButton.addEventListener("click", () => {
      window.open(BOOKING_URL, "_blank");
    });
  }
});
