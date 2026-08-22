/*
  AEME — calendar.js
  Construye el esqueleto del calendario: la semana, la cabecera con los
  días/fechas, la columna de horas y la rejilla de fondo.
  Los eventos y decoraciones se pintan aparte, en events.js.
*/

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeek() {
  const start = getMonday(LIVE_WEEK ? new Date() : DESIGN_DATE);
  const dates = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }

  return dates;
}

function renderHeader(dates) {
  const dayHeaders = document.getElementById("dayHeaders");
  const monthLabel = document.getElementById("monthLabel");
  const yearLabel = document.getElementById("yearLabel");

  dayHeaders.innerHTML = "";

  dates.forEach((date, index) => {
    const header = document.createElement("div");
    header.className = "dayHeader";

    const number = document.createElement("span");
    number.className = "dayNumber";
    number.textContent = date.getDate();

    const name = document.createElement("span");
    name.className = "dayName";
    name.textContent = DAY_NAMES[index];

    header.append(number, name);
    dayHeaders.appendChild(header);
  });

  const first = dates[0];

  monthLabel.textContent = first
    .toLocaleDateString("en-US", { month: "long" })
    .toUpperCase();

  yearLabel.textContent = first.getFullYear();
}

function renderTimes() {
  const timeColumn = document.getElementById("timeColumn");
  timeColumn.innerHTML = "";

  TIME_SLOTS.forEach(slot => {
    const time = document.createElement("div");
    time.className = "timeSlot";
    time.textContent = slot;
    timeColumn.appendChild(time);
  });
}

function renderGrid() {
  const daysArea = document.getElementById("daysArea");
  daysArea.innerHTML = "";

  for (let row = 0; row < TIME_SLOTS.length; row++) {
    for (let col = 0; col < 7; col++) {
      const cell = document.createElement("div");
      cell.className = "gridCell";
      cell.dataset.row = row;
      cell.dataset.col = col;
      daysArea.appendChild(cell);
    }
  }
}
