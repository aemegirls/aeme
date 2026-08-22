/* Show each floating About collage only while its name is hovered/focused. */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".aboutNameTrigger").forEach((trigger) => {
    const image = document.getElementById(trigger.dataset.aboutImage);
    if (!image) return;

    const show = () => image.classList.add("isVisible");
    const hide = () => image.classList.remove("isVisible");

    trigger.addEventListener("mouseenter", show);
    trigger.addEventListener("mouseleave", hide);
    trigger.addEventListener("focus", show);
    trigger.addEventListener("blur", hide);
  });
});