(() => {
  /* ─── CUSTOM CURSOR ─── */
  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  
  // Early exit if cursor elements don't exist
  if (!dot || !ring) return;
  
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
  });
  
  (function animCursor() {
    dot.style.left = mx + "px";
    dot.style.top = my + "px";
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + "px";
    ring.style.top = ry + "px";
    requestAnimationFrame(animCursor);
  })();

  /* ─── NAV SCROLL SHRINK + ACTIVE LINK ─── */
  const nav = document.querySelector("nav");
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a");
  
  // Throttle scroll event for better performance
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          nav.classList.toggle("scrolled", window.scrollY > 60);
          let current = "";
          sections.forEach((s) => {
            if (window.scrollY >= s.offsetTop - 200) current = s.id;
          });
          navLinks.forEach((a) => {
            a.classList.toggle("active", a.getAttribute("href") === "#" + current);
          });
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );

  /* ─── HERO WORD SPLIT ANIMATION ─── */
  document.querySelectorAll(".hero-title").forEach((el, ti) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map((w) => `<span class="word">${w}</span>`)
      .join(" ");
    el.querySelectorAll(".word").forEach((w, i) => {
      const timeoutId = setTimeout(
        () => w.classList.add("show"),
        400 + ti * 250 + i * 120
      );
      // Store timeout ID for potential cleanup
      w.dataset.timeoutId = timeoutId;
    });
  });

  /* ─── INTERSECTION OBSERVER (scroll reveal + skill bars + section title underline) ─── */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          revealObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  document
    .querySelectorAll(".reveal, .reveal-left, .reveal-right")
    .forEach((el) => revealObs.observe(el));

  /* section title underlines */
  const titleObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          titleObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.5 },
  );
  document
    .querySelectorAll(".section-title")
    .forEach((t) => titleObs.observe(t));

  /* skill bars */
  const skillObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.querySelectorAll(".skill-fill").forEach((bar) => {
            bar.style.width = bar.dataset.width + "%";
          });
          skillObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.3 },
  );
  const skillSection = document.getElementById("about");
  if (skillSection) skillObs.observe(skillSection);

  /* ─── PROJECT CARD CLICK NAVIGATION & 3D TILT (Event Delegation) ─── */
  const projectsContainer = document.querySelector("[class*='projects']") || document.body;
  
  projectsContainer.addEventListener("click", (e) => {
    const card = e.target.closest(".project-card[data-href]");
    if (card) {
      card.style.transition = "opacity 0.3s, transform 0.3s";
      card.style.opacity = "0";
      card.style.transform = (card.style.transform || "") + " scale(0.96)";
      setTimeout(() => {
        window.location.href = card.dataset.href;
      }, 300);
    }
  });

  projectsContainer.addEventListener("mousemove", (e) => {
    const card = e.target.closest(".project-card");
    if (card) {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const cx = r.width / 2;
      const cy = r.height / 2;
      const rotY = ((x - cx) / cx) * 8;
      const rotX = -((y - cy) / cy) * 8;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`;
    }
  });

  projectsContainer.addEventListener("mouseleave", (e) => {
    const card = e.target.closest(".project-card");
    if (card) {
      card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)";
    }
  });

  /* ─── RIPPLE ON CLICK (Event Delegation) ─── */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".ripple-wrap");
    if (btn) {
      const r = document.createElement("span");
      r.classList.add("ripple");
      r.style.left = e.clientX - btn.getBoundingClientRect().left + "px";
      r.style.top = e.clientY - btn.getBoundingClientRect().top + "px";
      btn.appendChild(r);
      
      // Auto-cleanup after animation
      const timeoutId = setTimeout(() => {
        r.remove();
      }, 700);
      
      // Store timeout for cleanup if needed
      r.timeoutId = timeoutId;
    }
  });

  /* ─── SECTION TITLE TEXT SCRAMBLE ─── */
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%";
  
  function scramble(el) {
    const text = el.textContent;
    let iter = 0;
    const charArray = text.split("");
    
    const id = setInterval(() => {
      el.textContent = charArray
        .map((c, i) => {
          if (c === " ") return " ";
          if (i < iter) return c;
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join("");
      
      if (iter >= charArray.length) {
        el.textContent = text;
        clearInterval(id);
      }
      iter += 1.5;
    }, 40);
  }
  const scrambleObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          scramble(e.target);
          scrambleObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.8 },
  );
  document
    .querySelectorAll(".section-title")
    .forEach((t) => scrambleObs.observe(t));

  /* ─── SUBTLE BG LINES PARALLAX ON MOUSE (Throttled) ─── */
  const bgLines = document.querySelector(".bg-lines");
  if (bgLines) {
    let parallaxTicking = false;
    document.addEventListener("mousemove", (e) => {
      if (!parallaxTicking) {
        requestAnimationFrame(() => {
          const x = (e.clientX / window.innerWidth - 0.5) * 20;
          const y = (e.clientY / window.innerHeight - 0.5) * 20;
          bgLines.style.transform = `translate(${x}px, ${y}px)`;
          parallaxTicking = false;
        });
        parallaxTicking = true;
      }
    });
  }
})();
