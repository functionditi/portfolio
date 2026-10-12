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
  if (!toggle) return null;

  const sections = Array.from(document.querySelectorAll(".project-section"));
  const archivedSections = sections.slice(5); // hide everything after the fifth project

  if (!archivedSections.length) {
    toggle.style.display = "none";
    return null;
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

  return {
    toggle,
    archivedSections,
    setHiddenState,
    isExpanded: () => toggle.getAttribute("aria-expanded") === "true",
  };
};

const initProjectFilter = (archiveController) => {
  const filter = document.querySelector(".project-filter");
  if (!filter) return;

  const filterOptions = filter.querySelector(".filter-options");
  const buttons = Array.from(filter.querySelectorAll(".filter-chip"));
  const sections = Array.from(document.querySelectorAll(".project-section"));

  if (!filterOptions || !buttons.length || !sections.length) return;

  const getTags = (section) =>
    (section.dataset.filterTags || "").split(/\s+/).filter(Boolean);

  const selectedFilters = new Set();
  const allButton = buttons.find((button) => button.dataset.filter === "all");
  const tagButtons = buttons.filter((button) => button.dataset.filter !== "all");
  const originalButtonOrder = buttons.map((button) => button.dataset.filter || "");

  const sortByOriginalOrder = (firstButton, secondButton) =>
    originalButtonOrder.indexOf(firstButton.dataset.filter || "") -
    originalButtonOrder.indexOf(secondButton.dataset.filter || "");

  const reorderButtons = () => {
    const selectedButtons = Array.from(selectedFilters)
      .map((filterValue) =>
        tagButtons.find((button) => button.dataset.filter === filterValue)
      )
      .filter(Boolean);
    const inactiveButtons = tagButtons
      .filter((button) => !selectedFilters.has(button.dataset.filter || ""))
      .sort(sortByOriginalOrder);

    if (selectedButtons.length) {
      filterOptions.append(
        ...selectedButtons,
        ...(allButton ? [allButton] : []),
        ...inactiveButtons
      );
    } else if (allButton) {
      filterOptions.append(allButton, ...inactiveButtons);
    }
  };

  const applyFilter = () => {
    const isFiltering = selectedFilters.size > 0;

    reorderButtons();

    buttons.forEach((button) => {
      const filterValue = button.dataset.filter || "";
      const isActive =
        filterValue === "all"
          ? !isFiltering
          : selectedFilters.has(filterValue);
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    sections.forEach((section) => {
      const sectionTags = getTags(section);
      const matches =
        !isFiltering ||
        sectionTags.some((tag) => selectedFilters.has(tag));

      section.classList.toggle("filter-hidden", !matches);

      if (isFiltering && matches) {
        section.classList.remove("archive-hidden");
      }
    });

    if (archiveController?.toggle) {
      archiveController.toggle.style.display = isFiltering ? "none" : "";

      if (!isFiltering) {
        archiveController.setHiddenState(!archiveController.isExpanded());
      }
    }

    window.dispatchEvent(new Event("resize"));
  };

  allButton?.addEventListener("click", () => {
    selectedFilters.clear();
    applyFilter();
  });

  tagButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filterValue = button.dataset.filter;
      if (!filterValue) return;

      if (selectedFilters.has(filterValue)) {
        selectedFilters.delete(filterValue);
      } else {
        selectedFilters.add(filterValue);
      }

      applyFilter();
    });
  });
};

const initMobileMenu = () => {
  const menu = document.querySelector(".project.language");
  if (!menu || document.querySelector(".mobile-menu-toggle")) return;

  if (!menu.id) {
    menu.id = "site-menu";
  }

  const menuGroups = menu.querySelectorAll("p");
  menuGroups[0]?.classList.add("mobile-menu-primary");
  menuGroups[1]?.classList.add("mobile-menu-social");

  const button = document.createElement("button");
  button.type = "button";
  button.className = "mobile-menu-toggle";
  button.setAttribute("aria-controls", menu.id);
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", "Open menu");
  button.innerHTML = '<span class="menu-bar"></span><span class="menu-bar"></span><span class="menu-bar"></span>';

  const setOpen = (isOpen) => {
    document.documentElement.classList.toggle("mobile-menu-open", isOpen);
    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  };

  document.documentElement.classList.add("has-mobile-menu");
  document.body.appendChild(button);

  menu.querySelectorAll(".select").forEach((item) => {
    const link = item.querySelector("a");
    if (!link) return;

    const rawLabel = link.textContent.trim();
    const label = rawLabel.replace(/[↓→]+$/g, "");
    link.dataset.menuLabel = label;
    link.dataset.menuArrow = "→";

    if (rawLabel.includes("↓")) {
      item.classList.add("mobile-menu-active");
    }

    if (link.href.includes("instagram.com")) {
      item.classList.add("mobile-menu-instagram");
    }

    if (link.href.includes("linkedin.com")) {
      item.classList.add("mobile-menu-linkedin");
    }
  });

  button.addEventListener("click", () => {
    setOpen(!document.documentElement.classList.contains("mobile-menu-open"));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });
};

const initIntroSketch = () => {
  const section = document.querySelector(".intro-section");
  const mount = section?.querySelector(".intro-sketch");
  const mobileQuery = window.matchMedia("(max-width: 780px)");

  if (!section || !mount || mount.dataset.sketchReady === "true") return;
  if (mobileQuery.matches) return;
  if (typeof window.p5 !== "function") return;

  mount.dataset.sketchReady = "true";

  const vertices = [];
  const polygonColor = "#ffff00";
  const vertexColor = "#ffff00";

  const vertexLayer = document.createElement("div");
  vertexLayer.className = "intro-vertices";
  section.appendChild(vertexLayer);

  const cursorHint = document.createElement("div");
  cursorHint.className = "intro-click-cursor";
  cursorHint.textContent = "click!";
  section.classList.add("intro-custom-cursor");
  section.appendChild(cursorHint);

  new window.p5((p) => {
    let hasClicked = false;

    const canvasSize = () => ({
      width: Math.max(1, mount.clientWidth),
      height: Math.max(1, mount.clientHeight),
    });

    const eventPoint = (event) => {
      const rect = mount.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      return {
        x,
        y,
        ratioX: x / Math.max(1, rect.width),
        ratioY: y / Math.max(1, rect.height),
      };
    };

    const pointFromVertex = (vertex) => ({
      x: vertex.ratioX * p.width,
      y: vertex.ratioY * p.height,
    });

    const redrawVertices = (points) => {
      vertexLayer.replaceChildren();
      points.forEach((point) => {
        const vertex = document.createElement("span");
        vertex.className = "intro-vertex";
        vertex.style.left = `${point.x}px`;
        vertex.style.top = `${point.y}px`;
        vertex.style.backgroundColor = vertexColor;
        vertexLayer.appendChild(vertex);
      });
    };

    const redrawPolygon = () => {
      const { width, height } = canvasSize();
      const points = vertices.map(pointFromVertex);

      p.clear();
      redrawVertices(points);

      if (points.length < 3) return;

      p.noStroke();
      p.fill(polygonColor);
      p.beginShape();
      points.forEach((point) => {
        p.vertex(point.x, point.y);
      });
      p.endShape(p.CLOSE);
    };

    const addVertex = (event) => {
      const point = eventPoint(event);
      const { width, height } = canvasSize();

      if (point.x < 0 || point.y < 0 || point.x > width || point.y > height) {
        return;
      }

      vertices.push({
        ratioX: point.ratioX,
        ratioY: point.ratioY,
      });
      redrawPolygon();
    };

    const moveCursorHint = (event) => {
      const rect = section.getBoundingClientRect();
      const x = event.clientX - rect.left + (hasClicked ? -10 : 14);
      const y = event.clientY - rect.top + (hasClicked ? -6 : 14);

      cursorHint.style.transform = `translate(${x}px, ${y}px)`;
      cursorHint.classList.add("is-visible");
    };

    const hideCursorHint = () => {
      cursorHint.classList.remove("is-visible");
    };

    const setDrawingCursor = (event) => {
      hasClicked = true;
      cursorHint.textContent = "";
      cursorHint.classList.add("is-drawing");
      moveCursorHint(event);
    };

    const handlePointerDown = (event) => {
      if (event.button !== 0) return;

      if (event.pointerType === "mouse") {
        event.preventDefault();
      }

      if (!hasClicked) {
        setDrawingCursor(event);
      }

      addVertex(event);
    };

    p.setup = () => {
      const { width, height } = canvasSize();
      const canvas = p.createCanvas(width, height);
      canvas.parent(mount);
      canvas.elt.setAttribute("aria-hidden", "true");
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      p.noLoop();
      p.clear();

      mount.addEventListener("pointermove", moveCursorHint);
      mount.addEventListener("pointerleave", hideCursorHint);
      mount.addEventListener("pointerdown", handlePointerDown);
    };

    p.windowResized = () => {
      const { width, height } = canvasSize();
      p.resizeCanvas(width, height);
      redrawPolygon();
    };
  }, mount);
};

const initPage = () => {
  initCarousels();
  const archiveController = initArchiveToggle();
  initProjectFilter(archiveController);
  initMobileMenu();
  initIntroSketch();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage);
} else {
  initPage();
}
