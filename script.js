(() => {
  const nav = document.querySelector(".nav");

  // Scrolled state: nav shadow + logo mark morphs from code to smile
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 4);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile/tablet nav menu
  const toggle = nav.querySelector(".nav-toggle");
  const menu = nav.querySelector(".nav-menu");

  const setOpen = (open) => {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
  };

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  document.addEventListener("click", (e) => { if (!nav.contains(e.target)) setOpen(false); });

  // Scroll reveals: each group of elements plays in (staggered) the first time
  // it comes into view. CSS hides them from first paint; .in + --rd plays them.
  const STAGGER = 0.08;
  const revealGroups = [];
  const group = (items, base = 0) => {
    items = items.filter(Boolean);
    if (items.length) revealGroups.push({ items, base });
  };
  const q = (root, sel) => root.querySelector(sel);
  document.querySelectorAll(".section").forEach((sec) => {
    // hero plays on load, a beat after its illustration starts drawing
    const base = sec.classList.contains("section-hero") ? 0.3 : 0;
    if (sec.classList.contains("section-audit")) {
      group([q(sec, ".display"), q(sec, ".lede")]);
      sec.querySelectorAll(".findings li").forEach((li) => group([q(li, ".num"), q(li, "h3"), q(li, "p")]));
      group([q(sec, ":scope > .btn")]);
    } else if (sec.classList.contains("section-how")) {
      group([q(sec, ".display")]);
      sec.querySelectorAll(".step").forEach((st) => group([q(st, ".num"), q(st, "h3"), q(st, ".step-body")]));
    } else {
      group([q(sec, ".display"), q(sec, ".lede"), q(sec, ":scope > .btn")], base);
    }
  });
  document.querySelectorAll(".divider img").forEach((img) => group([img]));

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      revealIO.unobserve(e.target);
      const g = revealGroups.find((g) => g.items[0] === e.target);
      g.items.forEach((el, i) => {
        el.style.setProperty("--rd", `${(g.base + i * STAGGER).toFixed(2)}s`);
        el.classList.add("in");
      });
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
  revealGroups.forEach((g) => revealIO.observe(g.items[0]));

  // Layered illustrations: CSS keeps the layers hidden from first paint (html.js);
  // once they have loaded and the art is on screen, .drawn plays them in (stroke
  // groups one by one, then pink, then grey wash). Reduced motion skips via CSS.
  document.querySelectorAll(".draw-art").forEach((art) => {
    const loaded = Promise.race([
      Promise.all([...art.querySelectorAll("img")].map((img) => img.decode().catch(() => {}))),
      new Promise((r) => setTimeout(r, 4000)),
    ]);
    const visible = new Promise((resolve) => {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { io.disconnect(); resolve(); }
      }, { threshold: 0.25 });
      io.observe(art);
    });
    Promise.all([loaded, visible]).then(() => requestAnimationFrame(() => {
      art.classList.add("drawn");
      art.closest(".illo")?.classList.add("drawn");   // for extras like the bubble text
    }));
  });

  // "How we bake it" animated screens. Each is a self-contained page rendered
  // at its native size, scaled to fit its slot, and only loaded once the slot
  // scrolls into view so the reveal plays from the start.
  const shots = document.querySelectorAll(".step-shot[data-anim]");

  const fit = (shot) => {
    shot.style.setProperty("--s", shot.clientWidth / Number(shot.dataset.w));
  };

  // The bundle shows a loading screen before it swaps in the real page;
  // keep the frame hidden until the artwork element exists.
  const revealWhenReady = (shot, frame) => {
    let tries = 0;
    const check = () => {
      let ready = true;
      try { ready = !!frame.contentDocument.querySelector('[id$="-art"]'); } catch (e) {}
      if (ready || ++tries > 100) shot.classList.add("ready");
      else setTimeout(check, 50);
    };
    check();
  };

  const load = (shot) => {
    const frame = shot.querySelector("iframe");
    frame.addEventListener("load", () => revealWhenReady(shot, frame), { once: true });
    frame.src = shot.dataset.anim;
  };

  const resize = new ResizeObserver((entries) => entries.forEach((e) => fit(e.target)));
  const inView = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      inView.unobserve(e.target);
      load(e.target);
    });
  }, { rootMargin: "0px 0px -15% 0px" });

  shots.forEach((shot) => {
    const frame = shot.querySelector("iframe");
    frame.width = shot.dataset.w;
    frame.height = shot.dataset.h;
    fit(shot);
    resize.observe(shot);
    inView.observe(shot);
  });
})();
