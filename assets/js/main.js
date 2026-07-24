(function () {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("revamp-theme");
  if (savedTheme) root.dataset.theme = savedTheme;

  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const money = (value) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);

  qs("[data-theme-toggle]")?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "" : "dark";
    if (next) root.dataset.theme = next;
    else delete root.dataset.theme;
    localStorage.setItem("revamp-theme", next);
  });

  qs("[data-menu-toggle]")?.addEventListener("click", () => {
    qs("[data-nav-panel]")?.classList.toggle("open");
  });

  const nav = qs("[data-site-nav]");
  const setNav = () => nav && nav.classList.toggle("scrolled", scrollY > 24);
  addEventListener("scroll", setNav, { passive: true });
  setNav();

  const observer = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 }) : null;
  qsa(".reveal").forEach((el) => observer ? observer.observe(el) : el.classList.add("in-view"));

  qsa("[data-counter]").forEach((el) => {
    const raw = el.dataset.counter || "";
    const number = parseFloat(raw.replace(/[^0-9.]/g, ""));
    if (!number || raw.includes("Rs.")) return;
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      const suffix = raw.replace(/[0-9.,]/g, "");
      const start = performance.now();
      const duration = 900;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = Math.round(number * (1 - Math.pow(1 - t, 3))) + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = raw;
      };
      requestAnimationFrame(tick);
    };
    if (!observer) run();
    else {
      const local = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          run();
          local.disconnect();
        }
      });
      local.observe(el);
    }
  });

  const filters = qsa("[data-filter]");
  const applyFilters = () => {
    const values = Object.fromEntries(filters.map((f) => [f.dataset.filter, (f.value || "").toLowerCase()]));
    qsa("[data-project-grid] .project-card").forEach((card) => {
      const text = card.textContent.toLowerCase();
      const visible =
        (!values.city || card.dataset.city.toLowerCase() === values.city) &&
        (!values.status || card.dataset.status.toLowerCase() === values.status) &&
        (!values.category || card.dataset.category.toLowerCase() === values.category) &&
        (!values.text || text.includes(values.text));
      card.hidden = !visible;
    });
  };
  filters.forEach((field) => field.addEventListener("input", applyFilters));

  const compareTray = qs("[data-compare-tray]");
  const compareCount = qs("[data-compare-count]");
  const selectedProjects = () => qsa(".compare-check:checked").map((input) => input.value);
  qsa(".compare-check").forEach((input) => {
    input.addEventListener("change", () => {
      const selected = selectedProjects();
      if (selected.length > 3) {
        input.checked = false;
        alert("Select up to three projects.");
      }
      const count = selectedProjects().length;
      if (compareTray) compareTray.hidden = count === 0;
      if (compareCount) compareCount.textContent = count + " selected";
    });
  });
  qs("[data-compare-open]")?.addEventListener("click", () => {
    const modal = qs("[data-compare-modal]");
    const content = qs("[data-compare-content]");
    const projects = selectedProjects().map((slug) => window.REVAMP_PROJECTS.find((p) => p.slug === slug)).filter(Boolean);
    if (content) {
      content.innerHTML = projects.map((p) => `<article><h3>${p.name}</h3><p>${p.city} / ${p.category}</p><dl><div><dt>Status</dt><dd>${p.status}</dd></div><div><dt>Price</dt><dd>${p.price}</dd></div><div><dt>Size</dt><dd>${p.area}</dd></div><div><dt>ROI</dt><dd>${p.roi}</dd></div></dl></article>`).join("");
    }
    if (modal) modal.hidden = false;
  });
  qs("[data-compare-close]")?.addEventListener("click", () => {
    const modal = qs("[data-compare-modal]");
    if (modal) modal.hidden = true;
  });

  const searchModal = qs("[data-search-modal]");
  const searchInput = qs("[data-search-input]");
  const searchResults = qs("[data-search-results]");
  qs("[data-search-open]")?.addEventListener("click", () => {
    if (searchModal) searchModal.hidden = false;
    searchInput?.focus();
  });
  qs("[data-search-close]")?.addEventListener("click", () => {
    if (searchModal) searchModal.hidden = true;
  });
  const searchable = [
    ...(window.REVAMP_PAGES || []).map((p) => ({ title: p.title, text: p.description, url: p.path })),
    ...(window.REVAMP_PROJECTS || []).map((p) => ({ title: p.name, text: `${p.city} ${p.location} ${p.category} ${p.status} ${p.price}`, url: `projects/${p.slug}.html` }))
  ];
  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    const matches = query ? searchable.filter((item) => (item.title + " " + item.text).toLowerCase().includes(query)).slice(0, 8) : searchable.slice(0, 5);
    if (searchResults) {
      searchResults.innerHTML = matches.map((item) => `<a href="${window.REVAMP_PREFIX || ""}${item.url}"><strong>${item.title}</strong><span>${item.text}</span></a>`).join("") || "<p>No results found.</p>";
    }
  });

  qsa("[data-enhanced-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const button = form.querySelector("button[type='submit']");
      const original = button ? button.textContent : "";
      if (button) button.textContent = "Submitted";
      form.classList.add("submitted");
      setTimeout(() => {
        if (button) button.textContent = original;
        form.classList.remove("submitted");
      }, 2400);
    });
  });

  qsa("[data-booking-open]").forEach((btn) => btn.addEventListener("click", () => {
    const modal = qs("[data-booking-modal]");
    if (modal) modal.hidden = false;
  }));
  qs("[data-booking-close]")?.addEventListener("click", () => {
    const modal = qs("[data-booking-modal]");
    if (modal) modal.hidden = true;
  });

  qsa(".map-pin").forEach((pin) => {
    pin.addEventListener("click", () => {
      const output = qs("[data-map-output]");
      const office = (window.REVAMP_OFFICES || []).find((item) => item.city === pin.dataset.pin);
      if (output && office) output.value = `${office.city}: ${office.address} / ${office.team}`;
    });
  });

  qs("[data-emi-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const principal = Number(form.amount.value || 0);
    const monthlyRate = Number(form.rate.value || 0) / 12 / 100;
    const months = Number(form.years.value || 0) * 12;
    const emi = monthlyRate ? principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1) : principal / months;
    const result = qs("[data-emi-result]");
    if (result) result.innerHTML = `<span>Estimated EMI</span><strong>Rs. ${money(emi)}</strong><p>Total payable: Rs. ${money(emi * months)}</p>`;
  });

  qs("[data-roi-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const investment = Number(form.investment.value || 0);
    const growth = Number(form.growth.value || 0) / 100;
    const years = Number(form.years.value || 0);
    const projected = investment * Math.pow(1 + growth, years);
    const result = qs("[data-roi-result]");
    if (result) result.innerHTML = `<span>Projected Value</span><strong>Rs. ${money(projected)}</strong><p>Projected gain: Rs. ${money(projected - investment)}</p>`;
  });

  const chatPanel = qs(".chat-panel");
  qsa("[data-chat-toggle]").forEach((btn) => btn.addEventListener("click", () => {
    if (chatPanel) chatPanel.hidden = !chatPanel.hidden;
  }));
  qs("[data-chat-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.message;
    const message = (input.value || "").trim();
    if (!message) return;
    const lower = message.toLowerCase();
    let reply = "A Revamp specialist can help with that. Share your city, budget, and preferred segment for a tighter shortlist.";
    if (lower.includes("emi")) reply = "Open the EMI Calculator to estimate monthly payments by loan amount, rate, and tenure.";
    if (lower.includes("career") || lower.includes("job")) reply = "Careers are open across engineering, architecture, sales, finance, HR, marketing, legal, procurement, and technology.";
    if (lower.includes("mumbai")) reply = "Mumbai projects include Orion Residences, Elysian Towers, Harbor One, and Metro Edge.";
    if (lower.includes("commercial") || lower.includes("office")) reply = "Commercial assets include Meridian Business Park, Capital Square, TechAxis, Millennium Arcade, and Pinnacle HQ.";
    const log = qs("[data-chat-log]");
    if (log) {
      log.insertAdjacentHTML("beforeend", `<p><strong>You:</strong> ${message}</p><p><strong>Assistant:</strong> ${reply}</p>`);
      log.scrollTop = log.scrollHeight;
    }
    input.value = "";
  });

  qs("[data-language]")?.addEventListener("change", (event) => {
    document.documentElement.lang = event.target.value === "hi" ? "hi" : "en";
  });
})();
