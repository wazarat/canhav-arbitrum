"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";

const INDUSTRIES = [
  {
    name: "Coffee Shops",
    pain: "You are paying retail for beans, cups, and lids while the chain next door gets distributor pricing.",
    solution: "We group your orders with other independent cafes so you all buy at the volume that unlocks wholesale rates.",
    tags: ["Beans", "Cups & Lids", "Syrups", "Milk"],
    monthlySpend: "$1,200 - $3,500/mo on supplies",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>
      </svg>
    ),
  },
  {
    name: "Barbershops",
    pain: "Clippers, capes, and disinfectants add up fast when you are buying one chair at a time.",
    solution: "Pool with other shops in the GTA and access the same bulk pricing that franchise chains get.",
    tags: ["Clippers", "Capes", "Disinfectants", "Styling Products"],
    monthlySpend: "$600 - $1,800/mo on supplies",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="M13 6l-7 12"/><circle cx="18" cy="18" r="3"/><path d="M18 15V3"/>
      </svg>
    ),
  },
  {
    name: "Auto Detailing",
    pain: "Ceramic coatings and polishing compounds are expensive at small-shop quantities.",
    solution: "Combine orders with other detailers to reach the minimums that unlock distributor pricing.",
    tags: ["Ceramic Coatings", "Microfibers", "Polishing Compounds"],
    monthlySpend: "$800 - $2,500/mo on supplies",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>
      </svg>
    ),
  },
  {
    name: "Small Law Firms",
    pain: "Software subscriptions, office supplies, and client tools eat into your margins every month.",
    solution: "Group licenses and bulk office orders with other small firms to cut your overhead.",
    tags: ["Legal Software", "Office Supplies", "Client Tools"],
    monthlySpend: "$1,500 - $4,000/mo on overhead",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    name: "Marketing Agencies",
    pain: "Design tools, analytics platforms, and ad credits cost the same whether you have 3 clients or 300.",
    solution: "Pool subscriptions and ad spend credits with other agencies to unlock volume discounts.",
    tags: ["Ad Credits", "Design Tools", "Analytics"],
    monthlySpend: "$2,000 - $6,000/mo on tools & ads",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    name: "Real Estate",
    pain: "Staging materials, signage, and photography packages drain your commission before you cash it.",
    solution: "Share the cost with other agents and brokerages so everyone gets group rates.",
    tags: ["Staging Materials", "Signage", "Photography"],
    monthlySpend: "$1,000 - $3,000/mo on marketing materials",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    name: "Yoga Studios",
    pain: "Mats, blocks, and cleaning supplies are a recurring cost that never seems to shrink.",
    solution: "Pool orders with studios across the GTA and buy at the same volume as large fitness chains.",
    tags: ["Mats", "Blocks", "Cleaning Supplies", "Wellness Products"],
    monthlySpend: "$500 - $1,500/mo on studio supplies",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
  },
] as const;

function Logo({ height = 40 }: { height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/ch-logo.svg"
      alt="CanHav"
      className="logo-img"
      style={{ height, width: "auto" }}
    />
  );
}

function SunIcon() {
  return (
    <svg className="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IndustriesSlider({ selectIndustry }: { selectIndustry: (name: string) => void }) {
  const VISIBLE = 3;
  const total = INDUSTRIES.length;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % total) + total) % total);
  }, [total]);

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => goTo(current + 1), 4000);
    return () => clearInterval(id);
  }, [current, paused, goTo]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientX;
    setPaused(true);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const delta = e.clientX - dragStart.current;
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
    dragStart.current = null;
    setPaused(false);
  };

  const visibleCards = Array.from({ length: VISIBLE }, (_, i) =>
    INDUSTRIES[(current + i) % total]
  );

  return (
    <section className="mkt-section industries" id="industries">
      <div className="container">
        <div className="section-header">
          <span className="section-label">Industries We Serve</span>
          <h2 className="section-title">Built for the businesses that keep the GTA running</h2>
          <p className="section-sub">Every industry has supplies that cost too much at small quantities. We fix that.</p>
        </div>

        <div className="industries-slider-wrap">
          {/* Prev arrow */}
          <button
            className="slider-arrow slider-arrow--prev"
            aria-label="Previous industry"
            onClick={prev}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Track */}
          <div
            className="industries-track"
            ref={trackRef}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {visibleCards.map((ind, i) => (
              <div
                key={`${ind.name}-${i}`}
                className="industry-card slider-card"
                data-industry={ind.name}
              >
                <div className="industry-icon-wrap">{ind.icon}</div>
                <h3 className="industry-name">{ind.name}</h3>
                <div className="industry-spend">{ind.monthlySpend}</div>
                <p className="industry-pain">{ind.pain}</p>
                <p className="industry-solution">{ind.solution}</p>
                <div className="industry-tags">
                  {ind.tags.map((tag) => (
                    <span key={tag} className="supply-tag">{tag}</span>
                  ))}
                </div>
                <button
                  className="mkt-btn mkt-btn--outline mkt-btn--sm industry-cta"
                  onClick={() => selectIndustry(ind.name)}
                >
                  Get My Estimate
                </button>
              </div>
            ))}
          </div>

          {/* Next arrow */}
          <button
            className="slider-arrow slider-arrow--next"
            aria-label="Next industry"
            onClick={next}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Dot indicators */}
        <div className="slider-dots">
          {INDUSTRIES.map((_, i) => (
            <button
              key={i}
              className={`slider-dot${i === current ? " active" : ""}`}
              aria-label={`Go to ${INDUSTRIES[i].name}`}
              onClick={() => { goTo(i); setPaused(false); }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function MarketingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});
  const [savedEmail, setSavedEmail] = useState("");
  const [savedIndustry, setSavedIndustry] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const industryRef = useRef<HTMLSelectElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) setDarkMode(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const val = params.get(key);
      if (val) utm[key] = val;
    }
    utm.source = window.location.hostname;
    setUtmParams(utm);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reveals = root.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const header = document.querySelector(".marketing-root .site-header");
    const offset = header ? (header as HTMLElement).offsetHeight : 64;
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: "smooth" });
    setMobileOpen(false);
  }, []);

  const selectIndustry = useCallback((name: string) => {
    window.location.href = `/getstarted?industry=${encodeURIComponent(name)}`;
  }, []);

  const handleStepOne = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    form.querySelectorAll(".error").forEach((el) => el.classList.remove("error"));

    const email = emailRef.current?.value.trim() ?? "";
    const industry = industryRef.current?.value ?? "";

    if (!email || !email.includes("@")) {
      emailRef.current?.classList.add("error");
      return;
    }

    setSavedEmail(email);
    setSavedIndustry(industry);
    setSubmitting(true);
    try {
      await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lead-capture",
          email,
          industry,
          step: "partial",
          ...utmParams,
        }),
      });
      setFormStep(2);
    } catch {
      setFormStep(2);
    } finally {
      setSubmitting(false);
    }
  }, [utmParams]);

  const handleStepTwo = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const businessName = (form.elements.namedItem("businessName") as HTMLInputElement).value.trim();
    const yourName = (form.elements.namedItem("yourName") as HTMLInputElement).value.trim();
    const email = savedEmail;
    const industry = savedIndustry;

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lead-capture",
          businessName,
          yourName,
          email,
          phone: (form.elements.namedItem("phone") as HTMLInputElement).value.trim(),
          industry,
          supplies: (form.elements.namedItem("supplies") as HTMLTextAreaElement).value.trim(),
          heardAboutUs: (form.elements.namedItem("heardAboutUs") as HTMLSelectElement).value,
          step: "complete",
          ...utmParams,
        }),
      });
      if (res.ok) {
        setFormSubmitted(true);
      } else {
        throw new Error("Server error");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [savedEmail, savedIndustry, utmParams]);

  const navLinks = [
    { id: "how-it-works", label: "How It Works" },
    { id: "industries", label: "Industries" },
    { id: "why-it-works", label: "Why It Works" },
  ];

  return (
    <div
      ref={rootRef}
      className="marketing-root"
      data-theme={darkMode ? "dark" : undefined}
    >
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* HEADER */}
      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <div className="header-inner container">
          <a
            href="#hero"
            className="logo"
            aria-label="CanHav home"
            onClick={(e) => { e.preventDefault(); scrollToSection("hero"); }}
          >
            <Logo height={36} />
            <span className="logo-text">CanHav</span>
          </a>

          <nav className="main-nav" aria-label="Main navigation">
            <ul className="nav-links">
              {navLinks.map((l) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(l.id); }}>
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/getstarted"
                  className="nav-cta mkt-btn mkt-btn--sm"
                >
                  Get My Savings Estimate
                </a>
              </li>
            </ul>
          </nav>

          <div className="header-actions">
            <button
              className="theme-toggle"
              aria-label="Toggle dark mode"
              type="button"
              onClick={() => setDarkMode((d) => !d)}
            >
              <SunIcon />
              <MoonIcon />
            </button>
            <button
              className={`hamburger${mobileOpen ? " active" : ""}`}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      <div className={`mobile-nav-overlay${mobileOpen ? " open" : ""}`}>
        <nav aria-label="Mobile navigation">
          <ul className="mobile-nav-links">
            {navLinks.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(l.id); }}>
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="/getstarted"
                className="mkt-btn mkt-btn--primary"
              >
                Get My Savings Estimate
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <main id="main-content">
        {/* HERO */}
        <section className="hero" id="hero">
          <div className="container hero-inner">
            <div className="hero-content">
              <p className="hero-eyebrow">Helping businesses in the Greater Toronto Area save on everyday supplies</p>
              <h1 className="hero-title">Stop overpaying for supplies</h1>
              <p className="hero-sub">
                Join forces with other small businesses. Pay what big chains pay.
              </p>
              <p className="hero-supporting">Free to try. If the group order doesn&apos;t go through, you don&apos;t pay.</p>
              <div className="hero-ctas">
                <a href="/getstarted" className="mkt-btn mkt-btn--primary mkt-btn--lg">
                  Get My Savings Estimate
                </a>
                <a href="#how-it-works" className="mkt-btn mkt-btn--outline mkt-btn--lg" onClick={(e) => { e.preventDefault(); scrollToSection("how-it-works"); }}>
                  See How It Works
                </a>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-graphic">
                <svg width="420" height="380" viewBox="0 0 420 380" fill="none">
                  {/* Central pool circle - pulsing */}
                  <circle cx="210" cy="190" r="50" fill="var(--color-accent)" opacity="0.08">
                    <animate attributeName="r" values="50;62;50" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="210" cy="190" r="35" fill="var(--color-accent)" opacity="0.12">
                    <animate attributeName="r" values="35;44;35" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="210" cy="190" r="18" fill="var(--color-accent)" opacity="0.25">
                    <animate attributeName="r" values="18;24;18" dur="3s" repeatCount="indefinite" />
                  </circle>
                  {/* Dollar sign in center */}
                  <text x="210" y="196" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="18" fill="var(--color-accent)" opacity="0.7">$</text>

                  {/* Business owner outlines + fund lines */}
                  {/* Top-left: Coffee shop owner */}
                  <g opacity="0.7">
                    <circle cx="70" cy="60" r="12" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" />
                    <path d="M70 72 v8 M62 84 h16 M62 84 v12 M78 84 v12 M66 80 l4 4 4-4" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <line x1="70" y1="100" x2="185" y2="178" stroke="var(--color-primary)" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.5">
                      <animate attributeName="stroke-dashoffset" values="0;-14" dur="2s" repeatCount="indefinite" />
                    </line>
                    <circle cx="70" cy="100" r="3" fill="var(--color-primary)" opacity="0.4" />
                  </g>

                  {/* Top-right: Barber */}
                  <g opacity="0.7">
                    <circle cx="350" cy="55" r="12" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" />
                    <path d="M350 67 v8 M342 79 h16 M342 79 v12 M358 79 v12 M346 75 l4 4 4-4" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <line x1="350" y1="95" x2="235" y2="178" stroke="var(--color-primary)" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.5">
                      <animate attributeName="stroke-dashoffset" values="0;-14" dur="2.3s" repeatCount="indefinite" />
                    </line>
                    <circle cx="350" cy="95" r="3" fill="var(--color-primary)" opacity="0.4" />
                  </g>

                  {/* Left: Detailer */}
                  <g opacity="0.7">
                    <circle cx="30" cy="200" r="12" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" />
                    <path d="M30 212 v8 M22 224 h16 M22 224 v12 M38 224 v12 M26 220 l4 4 4-4" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <line x1="48" y1="215" x2="175" y2="192" stroke="var(--color-primary)" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.5">
                      <animate attributeName="stroke-dashoffset" values="0;-14" dur="2.6s" repeatCount="indefinite" />
                    </line>
                    <circle cx="48" cy="215" r="3" fill="var(--color-primary)" opacity="0.4" />
                  </g>

                  {/* Right: Yoga owner */}
                  <g opacity="0.7">
                    <circle cx="390" cy="210" r="12" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" />
                    <path d="M390 222 v8 M382 234 h16 M382 234 v12 M398 234 v12 M386 230 l4 4 4-4" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <line x1="372" y1="225" x2="245" y2="195" stroke="var(--color-primary)" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.5">
                      <animate attributeName="stroke-dashoffset" values="0;-14" dur="2.1s" repeatCount="indefinite" />
                    </line>
                    <circle cx="372" cy="225" r="3" fill="var(--color-primary)" opacity="0.4" />
                  </g>

                  {/* Bottom-left: Lawyer */}
                  <g opacity="0.7">
                    <circle cx="90" cy="320" r="12" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" />
                    <path d="M90 332 v8 M82 344 h16 M82 344 v12 M98 344 v12 M86 340 l4 4 4-4" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <line x1="100" y1="325" x2="195" y2="215" stroke="var(--color-primary)" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.5">
                      <animate attributeName="stroke-dashoffset" values="0;-14" dur="2.4s" repeatCount="indefinite" />
                    </line>
                    <circle cx="100" cy="325" r="3" fill="var(--color-primary)" opacity="0.4" />
                  </g>

                  {/* Bottom-right: Real estate */}
                  <g opacity="0.7">
                    <circle cx="340" cy="330" r="12" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" />
                    <path d="M340 342 v8 M332 354 h16 M332 354 v12 M348 354 v12 M336 350 l4 4 4-4" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <line x1="328" y1="330" x2="228" y2="210" stroke="var(--color-primary)" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.5">
                      <animate attributeName="stroke-dashoffset" values="0;-14" dur="2.7s" repeatCount="indefinite" />
                    </line>
                    <circle cx="328" cy="330" r="3" fill="var(--color-primary)" opacity="0.4" />
                  </g>

                  {/* Building icon in center (shop front outline) */}
                  <g transform="translate(193, 150)" opacity="0.5">
                    <rect x="0" y="14" width="34" height="26" rx="2" stroke="var(--color-accent)" strokeWidth="1.5" fill="none" />
                    <polyline points="-3,14 17,2 37,14" stroke="var(--color-accent)" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                    <rect x="12" y="26" width="10" height="14" rx="1" stroke="var(--color-accent)" strokeWidth="1.2" fill="none" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
          <div className="trust-strip container">
            <p className="trust-strip-text"><strong>$0 to find out what you could save.</strong> We research pricing, build the pool, and send you the numbers. No commitment until you see the deal.</p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mkt-section how-it-works" id="how-it-works">
          <div className="container">
            <div className="section-header section-header--center">
              <span className="section-label">How It Works</span>
              <h2 className="section-title">Go from signup to savings in 3 simple steps</h2>
            </div>

            <div className="steps-flow">
              {/* Step 1 */}
              <div className="step-card reveal">
                <div className="step-number">01</div>
                <div className="step-icon-wrap">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="var(--color-primary)" opacity="0.15" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" fill="var(--color-primary)" opacity="0.1" stroke="none" />
                    <path d="M9 11l2 2 4-4" /><rect x="3" y="3" width="18" height="18" rx="3" fill="none" />
                  </svg>
                </div>
                <h3 className="step-heading">Tell us what you buy</h3>
                <p className="step-desc">Share what you spend the most on.</p>
                <span className="step-meta">30 seconds</span>
              </div>

              {/* Arrow 1 */}
              <div className="step-arrow" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </div>

              {/* Step 2 (featured) */}
              <div className="step-card step-card--featured reveal">
                <div className="step-number">02</div>
                <div className="step-icon-wrap step-icon-wrap--featured">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="2" y="2" width="20" height="20" rx="3" fill="var(--color-primary)" opacity="0.1" stroke="none" />
                    <line x1="12" y1="2" x2="12" y2="22" stroke="var(--color-primary)" opacity="0.15" /><path d="M16 8h-2a2 2 0 0 0 0 4h1a2 2 0 0 1 0 4h-3" /><line x1="12" y1="6" x2="12" y2="7" /><line x1="12" y1="17" x2="12" y2="18" />
                  </svg>
                </div>
                <h3 className="step-heading">See your savings</h3>
                <p className="step-desc">We find better pricing and show you exactly how much you can save.</p>
              </div>

              {/* Arrow 2 */}
              <div className="step-arrow" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </div>

              {/* Step 3 */}
              <div className="step-card reveal">
                <div className="step-number">03</div>
                <div className="step-icon-wrap">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="2" y="2" width="20" height="20" rx="3" fill="var(--color-primary)" opacity="0.1" stroke="none" />
                    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="3" /><path d="M22 21v-2a3 3 0 0 0-2.1-2.86" /><path d="M17 3.14a3 3 0 0 1 0 5.72" />
                  </svg>
                </div>
                <h3 className="step-heading">Join the order</h3>
                <p className="step-desc">Like the deal? Join the group order.<br />If it doesn&apos;t go through, you don&apos;t pay.</p>
              </div>
            </div>

            {/* Trust cue + CTA */}
            <div className="steps-footer reveal">
              <p className="steps-trust">No commitment. No upfront payment.</p>
              <a
                href="/getstarted"
                className="mkt-btn mkt-btn--primary mkt-btn--lg"
              >
                Get My Savings Estimate
              </a>
            </div>
          </div>
        </section>

        {/* INDUSTRIES */}
        <IndustriesSlider selectIndustry={selectIndustry} />

        {/* WHY IT WORKS (logic-based proof) */}
        <section className="mkt-section benefits" id="why-it-works">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Why It Works</span>
              <h2 className="section-title">The math behind group purchasing</h2>
            </div>
            <div className="benefits-grid">
              {[
                {
                  stat: "50x",
                  title: "Combined Buying Power",
                  desc: "One shop ordering alone has no leverage. Fifty shops ordering together hit the same volume thresholds as franchise chains and big-box retailers.",
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                    </svg>
                  ),
                },
                {
                  stat: "$0",
                  title: "Cost to Find Out",
                  desc: "We do the supplier research and price negotiation before you spend a dollar. You only commit when you have seen the actual savings numbers.",
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  ),
                },
                {
                  stat: "100%",
                  title: "Refund if Pool Does Not Fill",
                  desc: "Your funds are held in escrow. If a buying pool does not reach the supplier minimum, every dollar is returned. No exceptions, no fine print.",
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
                    </svg>
                  ),
                },
                {
                  stat: "7",
                  title: "Industries Organizing Now",
                  desc: "From coffee shops to law firms, we are building buying pools across seven industries in the Greater Toronto Area right now.",
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                  ),
                },
              ].map((b) => (
                <div key={b.title} className="benefit-card reveal">
                  <div className="benefit-icon">{b.icon}</div>
                  <div className="benefit-stat">{b.stat}</div>
                  <h3 className="benefit-heading">{b.title}</h3>
                  <p className="benefit-desc">{b.desc}</p>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="trust-badges" style={{ marginTop: "var(--space-12)" }}>
              {[
                {
                  label: "Funds Held in Escrow",
                  icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
                },
                {
                  label: "100% Refund Guarantee",
                  icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>,
                },
                {
                  label: "No Hidden Fees",
                  icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
                },
                {
                  label: "GTA Local",
                  icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
                },
              ].map((b) => (
                <div key={b.label} className="trust-badge reveal">
                  <div className="trust-badge-icon">{b.icon}</div>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2-STEP INTEREST FORM */}
        <section className="mkt-section form-section" id="interest-form">
          <div className="container">
            <div className="form-wrapper">
              <div className="form-header">
                <span className="section-label">Get Started</span>
                <h2 className="section-title">Find out what you could save</h2>
                <p className="form-sub">Takes 30 seconds. We will research supplier pricing for your industry and send you a personalized savings estimate. No commitment, no credit card.</p>
              </div>

              {!formSubmitted ? (
                <>
                  {/* Step indicator */}
                  <div className="form-steps-indicator">
                    <div className={`form-step-dot${formStep >= 1 ? " active" : ""}`}>1</div>
                    <div className="form-step-line" />
                    <div className={`form-step-dot${formStep >= 2 ? " active" : ""}`}>2</div>
                  </div>

                  {formStep === 1 ? (
                    <form className="signup-form" noValidate onSubmit={handleStepOne}>
                      <div className="form-group">
                        <label htmlFor="email">Work Email <span className="req">*</span></label>
                        <input
                          type="email" id="email" name="email" required ref={emailRef}
                          placeholder="you@business.com" autoComplete="email"
                          onInput={(e) => (e.target as HTMLElement).classList.remove("error")}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="industry">What industry is your business in?</label>
                        <select id="industry" name="industry" ref={industryRef} defaultValue={savedIndustry}>
                          <option value="">Select your industry</option>
                          {INDUSTRIES.map((ind) => (
                            <option key={ind.name} value={ind.name}>{ind.name}</option>
                          ))}
                        </select>
                      </div>
                      <button type="submit" className="mkt-btn mkt-btn--primary mkt-btn--lg form-submit" disabled={submitting}>
                        {submitting ? "Saving..." : "Get My Savings Estimate"}
                      </button>
                      <p className="form-note">Free. No credit card. No spam.</p>
                    </form>
                  ) : (
                    <form className="signup-form" noValidate onSubmit={handleStepTwo}>
                      <p className="form-step-label">Almost done. A few more details help us build a better estimate for you.</p>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="businessName">Business Name</label>
                          <input
                            type="text" id="businessName" name="businessName"
                            placeholder="Your Business Name" autoComplete="organization"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="yourName">Your Name</label>
                          <input
                            type="text" id="yourName" name="yourName"
                            placeholder="Full Name" autoComplete="name"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone">Phone <span className="optional">(optional)</span></label>
                        <input type="tel" id="phone" name="phone" placeholder="(416) 555-0123" autoComplete="tel" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="supplies">What supplies are you looking to buy for a cheaper price?</label>
                        <textarea id="supplies" name="supplies" rows={3} placeholder="e.g. coffee beans, ceramic coatings, legal software..." />
                      </div>
                      <div className="form-group">
                        <label htmlFor="heardAboutUs">How did you hear about us?</label>
                        <select id="heardAboutUs" name="heardAboutUs" defaultValue="">
                          <option value="">Select one</option>
                          <option value="instagram">Instagram</option>
                          <option value="facebook">Facebook</option>
                          <option value="google">Google Search</option>
                          <option value="friend">Friend or Colleague</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <button type="submit" className="mkt-btn mkt-btn--primary mkt-btn--lg form-submit" disabled={submitting}>
                        {submitting ? "Submitting..." : "Send My Savings Estimate"}
                      </button>
                      <button type="button" className="form-skip" onClick={() => setFormSubmitted(true)}>
                        Skip for now
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <div className="form-success">
                  <div className="success-icon">&#10003;</div>
                  <h3>You are in!</h3>
                  <p>We will research supplier pricing for your industry and send you a personalized savings estimate within 48 hours.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <a
              href="#hero"
              className="logo"
              aria-label="CanHav home"
              onClick={(e) => { e.preventDefault(); scrollToSection("hero"); }}
            >
              <Logo height={28} />
              <span className="logo-text">CanHav</span>
            </a>
            <p className="footer-tagline">Group purchasing power for small businesses in the GTA.</p>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              {navLinks.map((l) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(l.id); }}>
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="/getstarted">
                  Get Started
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Connect</h4>
            <ul>
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="mailto:hello@canhav.io">hello@canhav.io</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom container">
          <p>&copy; 2026 CanHav. Built in Toronto for Toronto.</p>
        </div>
      </footer>
    </div>
  );
}
