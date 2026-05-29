// Custom Cursor
const dot = document.getElementById("cursor-dot");
const ring = document.getElementById("cursor-ring");
let mx = 0,
  my = 0,
  rx = 0,
  ry = 0;
document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
});
(function animC() {
  dot.style.left = mx + "px";
  dot.style.top = my + "px";
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + "px";
  ring.style.top = ry + "px";
  requestAnimationFrame(animC);
})();

// Reveal Animation
const obs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        obs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 },
);
document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));

// ===== CAROUSEL MANAGER =====
const Carousel = (() => {
  const state = {
    current: 0,
    total: 0,
    isAutoPlay: true,
    autoPlayTimer: null,
    touchStart: 0,
    touchEnd: 0,
  };

  const dom = {
    track: null,
    slots: null,
    prevBtn: null,
    nextBtn: null,
    counter: null,
    indicators: null,
    status: null,
  };

  const config = {
    autoPlayDelay: 5000,
    slideDistance: 33.33, // 32% slot + 1.33% gap
  };

  // Initialize DOM references
  const init = () => {
    dom.track = document.getElementById("carouselTrack");
    dom.slots = document.querySelectorAll(".carousel-slot");
    dom.prevBtn = document.getElementById("prevBtn");
    dom.nextBtn = document.getElementById("nextBtn");
    dom.counter = document.getElementById("currentSlide");
    dom.indicators = document.getElementById("indicators");
    dom.status = document.getElementById("carouselStatus");
    state.total = dom.slots.length;

    // Create indicator dots
    for (let i = 0; i < state.total; i++) {
      const dot = document.createElement("button");
      dot.className = `carousel-dot ${i === 0 ? "active" : ""}`;
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.setAttribute("aria-selected", i === 0);
      dot.addEventListener("click", () => goToSlide(i));
      dom.indicators.appendChild(dot);
    }

    bindEvents();
    updateCarousel();
    startAutoPlay();
  };

  const bindEvents = () => {
    dom.prevBtn.addEventListener("click", () => {
      prev();
    });
    dom.nextBtn.addEventListener("click", () => {
      next();
    });
    dom.track.addEventListener("click", handleSlotClick);

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        prev();
        state.isAutoPlay = false;
      }
      if (e.key === "ArrowRight") {
        next();
        state.isAutoPlay = false;
      }
    });

    // Touch/swipe support
    dom.track.addEventListener(
      "touchstart",
      (e) => {
        state.touchStart = e.changedTouches[0].clientX;
      },
      false,
    );
    dom.track.addEventListener(
      "touchend",
      (e) => {
        state.touchEnd = e.changedTouches[0].clientX;
        handleSwipe();
      },
      false,
    );

    // Pause auto-play on hover
    dom.track.addEventListener("mouseenter", () => {
      clearInterval(state.autoPlayTimer);
    });
    dom.track.addEventListener("mouseleave", () => {
      if (state.isAutoPlay) startAutoPlay();
    });
  };

  const handleSlotClick = (e) => {
    const slot = e.target.closest(".carousel-slot");
    if (slot) openVideoModal(slot);
  };

  const handleSwipe = () => {
    const diff = state.touchStart - state.touchEnd;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
      state.isAutoPlay = false;
    }
  };

  const updateCarousel = () => {
    // Update track position: simple centering
    const offset = -state.current * config.slideDistance;
    dom.track.style.transform = `translateX(calc(50vw - 16% + ${offset}%))`;

    // Update counter
    dom.counter.textContent = state.current + 1;

    // Update active slot
    dom.slots.forEach((slot, i) => {
      slot.classList.toggle("active", i === state.current);
    });

    // Update dots
    document.querySelectorAll(".carousel-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === state.current);
      dot.setAttribute("aria-selected", i === state.current);
    });

    // Screen reader announcement
    dom.status.textContent = `Slide ${state.current + 1} of ${state.total}`;

    // Update button states
    dom.prevBtn.disabled = state.current === 0;
    dom.nextBtn.disabled = state.current === state.total - 1;
  };

  const next = () => {
    if (state.current < state.total - 1) {
      state.current++;
      updateCarousel();
      resetAutoPlay();
    }
  };

  const prev = () => {
    if (state.current > 0) {
      state.current--;
      updateCarousel();
      resetAutoPlay();
    }
  };

  const goToSlide = (index) => {
    state.current = Math.max(0, Math.min(index, state.total - 1));
    updateCarousel();
    resetAutoPlay();
  };

  const autoAdvance = () => {
    if (state.current < state.total - 1) {
      state.current++;
    } else {
      state.current = 0;
    }
    updateCarousel();
  };

  const startAutoPlay = () => {
    state.autoPlayTimer = setInterval(autoAdvance, config.autoPlayDelay);
  };

  const resetAutoPlay = () => {
    clearInterval(state.autoPlayTimer);
    startAutoPlay();
  };

  return { init };
})();

// Initialize carousel when DOM is ready
document.addEventListener("DOMContentLoaded", Carousel.init);
if (document.readyState !== "loading") Carousel.init();

// ===== VIDEO MODAL MANAGER =====
const VideoModal = (() => {
  const dom = {
    modal: null,
    video: null,
    closeBtn: null,
    overlay: null,
    shortcuts: null,
    title: null,
    info: null,
  };

  const state = {
    currentSlot: null,
    isPlaying: false,
  };

  const init = () => {
    dom.modal = document.getElementById("videoModal");
    dom.video = document.getElementById("modalVideo");
    dom.overlay = dom.modal.querySelector(".video-modal-overlay");
    dom.shortcuts = document.getElementById("videoShortcuts");
    dom.title = document.getElementById("videoTitle");
    dom.info = document.getElementById("videoInfo");

    bindEvents();
  };

  const bindEvents = () => {
    dom.overlay.addEventListener("click", close);

    // Keyboard controls
    document.addEventListener("keydown", handleKeyboard);

    // Video events
    dom.video.addEventListener("play", () => {
      state.isPlaying = true;
      hideShortcuts();
    });
    dom.video.addEventListener("pause", () => {
      state.isPlaying = false;
      showShortcuts();
    });
    dom.video.addEventListener("loadedmetadata", updateVideoInfo);

    // Fullscreen on double-click
    dom.video.addEventListener("dblclick", toggleFullscreen);

    // Add hover zone for shortcuts (will be cleaned up on close)
    const videoContainer = dom.video.parentElement;
    const bottomHoverZone = document.createElement("div");
    bottomHoverZone.style.position = "absolute";
    bottomHoverZone.style.bottom = "0";
    bottomHoverZone.style.left = "0";
    bottomHoverZone.style.right = "0";
    bottomHoverZone.style.height = "80px";
    bottomHoverZone.style.cursor = "pointer";
    bottomHoverZone.style.zIndex = "10";
    bottomHoverZone.addEventListener("mouseenter", showShortcuts);
    videoContainer.appendChild(bottomHoverZone);
    
    // Store reference for cleanup
    dom.hoverZone = bottomHoverZone;
  };

  const showShortcuts = () => {
    dom.shortcuts.classList.add("show");
    clearTimeout(dom.shortcuts.hideTimeout);
    dom.shortcuts.hideTimeout = setTimeout(hideShortcuts, 1000);
  };

  const hideShortcuts = () => {
    dom.shortcuts.classList.remove("show");
  };

  const handleKeyboard = (e) => {
    if (!dom.modal.classList.contains("active")) return;

    switch (e.key) {
      case "Escape":
        close();
        break;
      case " ":
        e.preventDefault();
        dom.video.paused ? dom.video.play() : dom.video.pause();
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "m":
      case "M":
        dom.video.muted = !dom.video.muted;
        break;
      case "ArrowLeft":
        dom.video.currentTime = Math.max(0, dom.video.currentTime - 5);
        break;
      case "ArrowRight":
        dom.video.currentTime = Math.min(
          dom.video.duration,
          dom.video.currentTime + 5,
        );
        break;
      case "ArrowUp":
        dom.video.volume = Math.min(1, dom.video.volume + 0.1);
        break;
      case "ArrowDown":
        dom.video.volume = Math.max(0, dom.video.volume - 0.1);
        break;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      dom.video.requestFullscreen?.() ||
        dom.video.webkitRequestFullscreen?.() ||
        dom.video.mozRequestFullScreen?.() ||
        dom.video.msRequestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const updateVideoInfo = () => {
    if (dom.video.duration) {
      const mins = Math.floor(dom.video.duration / 60);
      const secs = Math.floor(dom.video.duration % 60);
      dom.info.textContent = `Duration: ${mins}:${secs.toString().padStart(2, "0")}`;
    }
  };

  const open = (slotElement) => {
    state.currentSlot = slotElement;
    const video = slotElement.querySelector("video");
    if (!video) {
      console.error("No video element found in slot");
      return;
    }
    
    const sourceEl = video.querySelector("source");
    if (!sourceEl || !sourceEl.src) {
      console.error("No video source found");
      return;
    }
    
    const videoSrc = sourceEl.src;
    const demoLabel =
      slotElement.querySelector(".slot-label")?.textContent || "Demo Video";

    dom.video.src = videoSrc;
    dom.title.textContent = demoLabel.toUpperCase();
    
    // Add error handler
    dom.video.onerror = () => {
      console.error("Failed to load video:", videoSrc);
      close();
    };
    
    dom.modal.classList.add("active");
    dom.video.play().catch((error) => {
      console.warn("Video play failed:", error);
      // User may have blocked autoplay, allow manual play
    });
    document.body.style.overflow = "hidden";

    // Show shortcuts initially, fade after 1 second
    showShortcuts();
  };

  const close = () => {
    dom.modal.classList.remove("active");
    dom.video.pause();
    dom.video.currentTime = 0;
    document.body.style.overflow = "auto";
    state.isPlaying = false;
    clearTimeout(dom.shortcuts.hideTimeout);
    
    // Clean up hover zone
    if (dom.hoverZone && dom.hoverZone.parentElement) {
      dom.hoverZone.remove();
    }
  };

  return { init, open, close };
})();

// Initialize video modal when DOM is ready
document.addEventListener("DOMContentLoaded", VideoModal.init);
if (document.readyState !== "loading") VideoModal.init();

// Update openVideoModal function to use new manager
function openVideoModal(slotElement) {
  VideoModal.open(slotElement);
}

function closeVideoModal() {
  VideoModal.close();
}
