(() => {
  // Mobile/tablet nav menu
  const nav = document.querySelector(".nav");
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
})();
