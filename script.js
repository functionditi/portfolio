document.addEventListener("DOMContentLoaded", () => {
  const carousels = document.querySelectorAll(".img__container");

  carousels.forEach((track) => {
    if (track.dataset.carouselReady === "true") return;
    track.dataset.carouselReady = "true";

    const parent = track.closest("#parent") || track.parentElement;
    if (!parent) return;

    const createArrow = (direction) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `carousel-arrow ${direction}`;
      button.setAttribute(
        "aria-label",
        direction === "left" ? "Previous item" : "Next item"
      );
      button.textContent = direction === "left" ? "<" : ">";
      return button;
    };

    const prev = createArrow("left");
    const next = createArrow("right");
    prev.classList.add("is-hidden");
    parent.append(prev, next);

    const scrollAmount = () =>
      Math.max(Math.floor(track.clientWidth * 0.75), 200);

    const attachLoadListeners = () => {
      const images = track.querySelectorAll("img");
      images.forEach((img) => {
        if (img.dataset.carouselBound === "true") return;
        img.dataset.carouselBound = "true";
        img.addEventListener("load", () => {
          updateButtons();
        });
      });
    };

    const updateButtons = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const hasOverflow = maxScroll > 2;
      prev.style.display = hasOverflow ? "flex" : "none";
      next.style.display = "flex";

      const hasScrolled = track.scrollLeft > 4;
      const atStart = !hasScrolled;
      const atEnd = track.scrollLeft >= maxScroll;

      prev.disabled = atStart;
      next.disabled = atEnd;
      prev.classList.toggle("is-hidden", atStart);
    };

    const scrollByDirection = (direction) => {
      track.scrollBy({
        left: direction * scrollAmount(),
        behavior: "smooth",
      });
    };

    prev.addEventListener("click", () => scrollByDirection(-1));
    next.addEventListener("click", () => scrollByDirection(1));
    track.addEventListener("scroll", updateButtons);
    window.addEventListener("resize", updateButtons);
    window.addEventListener("load", updateButtons);

    const observer = new MutationObserver(() => {
      attachLoadListeners();
      updateButtons();
    });
    observer.observe(track, { childList: true, subtree: true });

    attachLoadListeners();
    updateButtons();
  });
});
