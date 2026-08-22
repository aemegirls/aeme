(() => {
  const projects = [
    { title: "Closet Staples", keywords: ["closet staples", "tex", "carrefour", "supermarket", "clothes"], url: "tex.html" },
    { title: "Uncaptured", keywords: ["uncaptured", "tuborg", "beer", "packaging", "bottle"], url: "tuborg.html" },
    { title: "404 Lesson Found", keywords: ["404 lesson found", "duolingo", "google chrome", "owl", "dinosaur"], url: "duolingo.html" },
    { title: "Irrechiptible", keywords: ["irrechipstible", "irrechiptible", "pepsico", "lays", "chips", "eating while shopping"], url: "pepsico.html" },
    { title: "El Tren de la Feria", keywords: ["el tren de la feria", "tren de la feria", "andalusia", "andalucía", "andalusia campaign", "feria", "el sol"], url: "el-tren-de-la-feria.html" }
  ];

  function ensureOverlay() {
    let overlay = document.getElementById("searchOverlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "searchOverlay";
    overlay.className = "searchOverlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="searchPanel" role="dialog" aria-modal="true" aria-label="Search projects">
        <button class="searchClose" type="button" aria-label="Close search">×</button>
        <label class="searchLabel" for="projectSearch">Find a project</label>
        <input class="projectSearch" id="projectSearch" type="search" autocomplete="off" placeholder="Type a project name...">
        <div class="searchResults" id="searchResults"></div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function init() {
    const buttons = document.querySelectorAll(".searchButton, .projectSearchButton, .aboutSearchButton");
    if (!buttons.length) return;
    const overlay = ensureOverlay();
    const input = overlay.querySelector("#projectSearch");
    const results = overlay.querySelector("#searchResults");
    const close = overlay.querySelector(".searchClose");

    function render(q = "") {
      const query = q.trim().toLowerCase();
      const matches = projects.filter(project => {
        if (!query) return true;
        const haystack = [project.title, ...project.keywords].join(" ").toLowerCase();
        return haystack.includes(query);
      });
      results.innerHTML = "";
      if (!matches.length) {
        results.innerHTML = '<div class="searchEmpty">No projects found.</div>';
        return;
      }
      matches.forEach(project => {
        const link = document.createElement("a");
        link.className = "searchResult";
        link.href = project.url;
        link.innerHTML = `<span>${project.title}</span><span class="searchResultMeta">Open project →</span>`;
        results.appendChild(link);
      });
    }

    function open() {
      overlay.classList.add("isOpen");
      overlay.setAttribute("aria-hidden", "false");
      input.value = "";
      render();
      setTimeout(() => input.focus(), 30);
    }
    function shut() {
      overlay.classList.remove("isOpen");
      overlay.setAttribute("aria-hidden", "true");
    }

    buttons.forEach(button => button.addEventListener("click", open));
    close.addEventListener("click", shut);
    overlay.addEventListener("click", event => { if (event.target === overlay) shut(); });
    input.addEventListener("input", event => render(event.target.value));
    document.addEventListener("keydown", event => { if (event.key === "Escape") shut(); });
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
