/*
  AEME — data.js
  Aquí vive TODA la información del calendario: horas, días y eventos.
  Si quieres cambiar un texto, una hora o añadir una imagen, es AQUÍ
  donde tienes que tocar, no en calendar.js ni en events.js.
*/

// true = el calendario sigue la semana real (hoy). false = se queda fijo en DESIGN_DATE.
const LIVE_WEEK = true;
const DESIGN_DATE = new Date(2026, 6, 20); // lunes 20 de julio de 2026 (semana del diseño de Framer)

const TIME_SLOTS = [
  "7:00 - 9:00",
  "9:00 - 11:00",
  "11:00 - 13:00",
  "13:00 - 15:00",
  "15:00 - 17:00",
  "17:00 - 19:00",
  "19:00 - 21:00",
  "21:00 - 23:00",
  "23:00 - 1:00"
];

const DAY_NAMES = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

/*
  EVENTS
  day: 0 = lunes ... 6 = domingo
  row: índice de TIME_SLOTS (0 = 7:00-9:00 ... 8 = 23:00-1:00)
  duration: cuántas franjas horarias ocupa hacia abajo
  type: "teal" (por defecto, no hace falta ponerlo), "yellow" o "navy"

  image (opcional): ruta a una imagen dentro de /Assets/Images.
  imageStyle: posición/tamaño de esa imagen dentro de la tarjeta (CSS en línea).
  Importante: la imagen SIEMPRE se dibuja como una capa independiente,
  por encima de todas las tarjetas. No se mueve ni cambia de brillo
  cuando pasas el ratón por la tarjeta — solo la tarjeta reacciona.

  link (opcional): si lo añades, la tarjeta se convierte en un enlace
  clicable con efecto hover automático (se levanta un poco + sombra).
  Puede ser una ruta interna ("tuborg.html") o una url completa.
*/
const EVENTS = [

  // LUNES
  {
    title: "Clothes in food\npackaging\n(rough idea)",
    day: 0,
    row: 0,
    duration: 1,
    type: "teal",
    image: "Assets/Icons/lapiz-1.webp",
    imageStyle: "right:2px; bottom:9px; width:56px; transform:rotate(4deg);",
    link: "tex.html" // Closet Staples — Carrefour / Tex
  },
  
  {
    title: "AEME\nPORTFOLIO\nWEB",
    day: 0,
    row: 8,
    duration: 1,
    type:  "light-gray",
    confetti: true
  },

  // MIÉRCOLES
  {
    title: "Owl and\ndinosaur\ngame",
    day: 2,
    row: 5,
    duration: 1,
    type: "teal",
     image: "Assets/Icons/lapiz-2.webp",
    imageStyle: "left:50%; bottom:13px; width:56px; transform:translateX(-50%); transform:rotate(6deg);",
    link: "duolingo.html" // Duo x Google Chrome — 404 Lesson Found
  },
  {
    title: "",
    day: 2,
    row: 6,
    duration: 1,
    type: "teal",
    link: "duolingo.html" // Duo x Google Chrome — 404 Lesson Found
  },
  {
    title: "(green light\nfinal meeting)",
    day: 2,
    row: 7,
    duration: 1,
    type: "teal",
    link: "duolingo.html" // Duo x Google Chrome — 404 Lesson Found
  },

  // JUEVES
  {
    title: "Andalusian\ncampaign",
    day: 3,
    row: 0,
    duration: 1,
    type: "teal",
     image: "Assets/Icons/circulo.png",
    imageStyle: "right:7px; bottom:8px; width:66px",
    link: "el-tren-de-la-feria.html" 
  },
  {
    title: "(just in case)",
    day: 3,
    row: 1,
    duration: 1,
    type: "teal",
    link: "el-tren-de-la-feria.html" 
  },

  // VIERNES
  {
    title: "Discuss\nnew beer\npackaging",
    day: 4,
    row: 3,
    duration: 1,
    type:  "light-gray",
    image: "Assets/Images/tuborg%20botella%20sola.png",
    imageStyle: "right:14px; top:-16px; width:40px; transform:rotate(-3deg);",
    link: "tuborg.html"
  },
  {
    title: "(still discussing)",
    day: 4,
    row: 4,
    duration: 1,
    type:  "light-gray",
    link: "tuborg.html"
  },
  {
    title: "Art\nDirection\nstuff",
    day: 4,
    row: 8,
    duration: 1,
    type:  "light-gray",
    confetti: true
  },

  // SÁBADO
  {
  title: "Cattle industry\njob interview",
  day: 5,
  row: 0,
  duration: 1,
  type: "light-gray",
  hover: true
},
{
  title: "",
  day: 5,
  row: 1,
  duration: 1,
  type: "light-gray",
  hover: true
},
 // DOMINGO
  {
    title: "Eating\nwhile\nshopping\nidea",
    day: 6,
    row: 7,
    duration: 1,
    type:  "light-gray",
    image: "Assets/Images/Lays_Imagen.png",
    imageStyle: "right:1px; bottom:-4px; width:70px; transform:rotate(9deg);",
    link: "pepsico.html"
  },
  {
    title: "DEADLINE\nTONIGHT!!!",
    day: 6,
    row: 8,
    duration: 1,
    type:  "light-gray",
    link: "pepsico.html"
  }
];

/*
  DECORATIONS
  Post-its sueltos que en Framer están "pegados" encima del calendario,
  sin pertenecer a ningún evento. Se posicionan igual que un evento
  (day/row) pero puedes afinar con offsetX/offsetY (en píxeles) y rotate.

  image: pon aquí el nombre exacto de tu PNG del post-it
  (por ejemplo "Assets/Images/postit.png"). Mientras no exista ese
  archivo, se ve un cuadrado naranja de repuesto para que no quede vacío.
  width: ancho en px de la imagen del post-it.
*/
const POSTIT_IMAGE = "Assets/Images/postit.png"; // TODO: cambia esto por el nombre real de tu archivo

const DECORATIONS = [
  { day: 0, row: 2, offsetX: 4, offsetY: 6, rotate: -8, width: 127, image: POSTIT_IMAGE, comment: "Brainstorming timeee" },
  { day: 4, row: 4, offsetX: 210, offsetY: -30, rotate: 6, width: 127, image: POSTIT_IMAGE, comment: "Do we really love the idea??" }
];
