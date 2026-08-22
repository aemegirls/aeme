(() => {
  document.querySelectorAll('.projectVideo[data-youtube-id]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.youtubeId;
      if (!id) return;
      el.innerHTML = `<iframe
        src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1"
        title="Project video"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen></iframe>`;
    }, { once: true });
  });
})();
