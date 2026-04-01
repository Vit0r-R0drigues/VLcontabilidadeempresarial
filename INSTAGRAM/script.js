// script.js - Interactions for Instagram landing hub
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".glass-card").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "none";
  });

  document.querySelectorAll(".glass-card, .btn").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      if (window.gsap) {
        gsap.to(el, { scale: 1.02, duration: 0.25, overwrite: "auto" });
      }
    });

    el.addEventListener("mouseleave", () => {
      if (window.gsap) {
        gsap.to(el, { scale: 1, duration: 0.25, overwrite: "auto" });
      }
    });
  });
});
