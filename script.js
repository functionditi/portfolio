const initCarousels = () => {
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
          setTimeout(updateButtons, 50);
        });
      });
    };

    const updateButtons = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      prev.style.display = "flex";
      next.style.display = "flex";

      const hasScrolled = track.scrollLeft > 4;
      const atStart = !hasScrolled;
      const atEnd = track.scrollLeft >= maxScroll;

      prev.disabled = atStart;
      next.disabled = atEnd && maxScroll > 2;
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
      setTimeout(updateButtons, 50);
    });
    observer.observe(track, { childList: true, subtree: true });

    attachLoadListeners();
    updateButtons();
    setTimeout(updateButtons, 50);
  });
};

const initArchiveToggle = () => {
  const toggle = document.querySelector(".archive-toggle");
  if (!toggle) return;

  const sections = Array.from(document.querySelectorAll(".project-section"));
  const archivedSections = sections.slice(5); // hide everything after the fifth project

  if (!archivedSections.length) {
    toggle.style.display = "none";
    return;
  }

  const setHiddenState = (shouldHide) => {
    archivedSections.forEach((section) =>
      section.classList.toggle("archive-hidden", shouldHide)
    );
    toggle.setAttribute("aria-expanded", String(!shouldHide));
    toggle.textContent = shouldHide ? "SEE MORE PROJECTS↓" : "SEE LESS PROJECTS [x]";
  };

  setHiddenState(true);
  archivedSections.forEach((section) =>
    section.classList.add("archive-archived")
  );

  const handleToggle = () => {
    const currentlyHidden = archivedSections[0].classList.contains("archive-hidden");
    setHiddenState(!currentlyHidden);
  };

  toggle.addEventListener("click", handleToggle);
  toggle.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  });
};

const initPage = () => {
  initCarousels();
  initArchiveToggle();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage);
} else {
  initPage();
}
