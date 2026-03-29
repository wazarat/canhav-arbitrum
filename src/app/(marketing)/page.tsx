"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";

const INDUSTRIES = [
  { name: "Coffee Shops", emoji: "\u2615", desc: "Coffee beans, cups, lids, syrups, milk \u2014 everything your caf\u00e9 needs at wholesale pricing.", savings: "25%", offer: "Get 25% off wholesale coffee beans \u2014 risk-free pooling" },
  { name: "Barbershops", emoji: "\u2702\ufe0f", desc: "Clippers, capes, disinfectants, styling products \u2014 premium supplies below retail.", savings: "30%", offer: "Premium barbershop supplies at 30% below retail" },
  { name: "Auto Detailing", emoji: "\ud83d\ude97", desc: "Ceramic coatings, microfibers, polishing compounds at distributor pricing.", savings: "35%", offer: "Ceramic coatings & supplies at distributor pricing" },
  { name: "Small Law Firms", emoji: "\u2696\ufe0f", desc: "Legal software, office supplies, client management tools \u2014 cut overhead costs.", savings: "20%", offer: "Cut your software & supply costs by 20%" },
  { name: "Marketing Agencies", emoji: "\ud83d\udce3", desc: "Ad spend credits, design tools, analytics subscriptions \u2014 pool and save.", savings: "25%", offer: "Pool ad spend credits and save 15-25%" },
  { name: "Real Estate", emoji: "\ud83c\udfe0", desc: "Staging materials, signage, photography packages at group rates.", savings: "25%", offer: "Staging, signs & photography at group rates" },
  { name: "Yoga Studios", emoji: "\ud83e\uddd8", desc: "Mats, blocks, cleaning supplies, wellness products \u2014 wholesale for studios.", savings: "30%", offer: "Wholesale yoga supplies \u2014 save 30% pooling together" },
] as const;

function LogoSVG({ size = 40 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="15" cy="20" r="12" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.7" />
      <circle cx="25" cy="20" r="12" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.7" />
      <path d="M20 10.5a12 12 0 0 1 0 19" stroke="var(--color-accent)" strokeWidth="2.5" fill="none" />
    </svg>
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

export default function MarketingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const industryRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) setDarkMode(true);
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
    if (industryRef.current) {
      industryRef.current.value = name;
      industryRef.current.style.borderColor = "var(--color-accent)";
      setTimeout(() => {
        if (industryRef.current) industryRef.current.style.borderColor = "";
      }, 2000);
    }
    scrollToSection("interest-form");
  }, [scrollToSection]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    form.querySelectorAll(".error").forEach((el) => el.classList.remove("error"));

    const businessName = (form.elements.namedItem("businessName") as HTMLInputElement).value.trim();
    const yourName = (form.elements.namedItem("yourName") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    let valid = true;

    if (!businessName) { (form.elements.namedItem("businessName") as HTMLElement).classList.add("error"); valid = false; }
    if (!yourName) { (form.elements.namedItem("yourName") as HTMLElement).classList.add("error"); valid = false; }
    if (!email || !email.includes("@")) { (form.elements.namedItem("email") as HTMLElement).classList.add("error"); valid = false; }
    if (!valid) return;

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
          industry: (form.elements.namedItem("industry") as HTMLSelectElement).value,
          supplies: (form.elements.namedItem("supplies") as HTMLTextAreaElement).value.trim(),
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
  }, []);

  const navLinks = [
    { id: "how-it-works", label: "How It Works" },
    { id: "industries", label: "Industries" },
    { id: "why-canhav", label: "Why CanHav" },
  ];

  return (
    <div
      ref={rootRef}
      className="marketing-root"
      data-theme={darkMode ? "dark" : undefined}
    >
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ─── HEADER ─── */}
      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <div className="header-inner container">
          <a
            href="#hero"
            className="logo"
            aria-label="CanHav home"
            onClick={(e) => { e.preventDefault(); scrollToSection("hero"); }}
          >
            <LogoSVG />
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
                  href="#interest-form"
                  className="nav-cta mkt-btn mkt-btn--sm"
                  onClick={(e) => { e.preventDefault(); scrollToSection("interest-form"); }}
                >
                  Get Started
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
                href="#interest-form"
                className="mkt-btn mkt-btn--primary"
                onClick={(e) => { e.preventDefault(); scrollToSection("interest-form"); }}
              >
                Get Started
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <main id="main-content">
        {/* ─── HERO ─── */}
        <section className="hero" id="hero">
          <div className="container hero-inner">
            <div className="hero-content">
              <h1 className="hero-title">Small businesses save big when they buy together</h1>
              <p className="hero-sub">
                CanHav pools purchasing power across Toronto&apos;s small businesses. Join a buying group and save 15&ndash;40% on your essential supplies.
              </p>
              <div className="hero-ctas">
                <a href="#interest-form" className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={(e) => { e.preventDefault(); scrollToSection("interest-form"); }}>
                  Get Started &mdash; It&apos;s Free
                </a>
                <a href="#how-it-works" className="mkt-btn mkt-btn--outline mkt-btn--lg" onClick={(e) => { e.preventDefault(); scrollToSection("how-it-works"); }}>
                  See How It Works
                </a>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-graphic">
                <svg width="360" height="320" viewBox="0 0 360 320" fill="none">
                  <circle cx="180" cy="160" r="120" fill="var(--color-primary)" opacity="0.06" />
                  <circle cx="130" cy="140" r="50" stroke="var(--color-primary)" strokeWidth="2" fill="none" opacity="0.3">
                    <animate attributeName="r" values="50;55;50" dur="4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="220" cy="130" r="40" stroke="var(--color-primary)" strokeWidth="2" fill="none" opacity="0.3">
                    <animate attributeName="r" values="40;45;40" dur="5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="190" cy="200" r="45" stroke="var(--color-primary)" strokeWidth="2" fill="none" opacity="0.3">
                    <animate attributeName="r" values="45;50;45" dur="4.5s" repeatCount="indefinite" />
                  </circle>
                  <path d="M80 80 L150 140" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <path d="M280 70 L220 130" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <path d="M300 240 L210 195" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <path d="M60 250 L150 190" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <circle cx="180" cy="160" r="20" fill="var(--color-accent)" opacity="0.15" />
                  <circle cx="180" cy="160" r="8" fill="var(--color-accent)" opacity="0.5" />
                  <circle cx="80" cy="80" r="5" fill="var(--color-primary)" opacity="0.5" />
                  <circle cx="280" cy="70" r="5" fill="var(--color-primary)" opacity="0.5" />
                  <circle cx="300" cy="240" r="5" fill="var(--color-primary)" opacity="0.5" />
                  <circle cx="60" cy="250" r="5" fill="var(--color-primary)" opacity="0.5" />
                  <rect x="240" y="230" rx="20" ry="20" width="100" height="40" fill="var(--color-accent)" opacity="0.15" />
                  <text x="290" y="255" textAnchor="middle" fontFamily="'Cabinet Grotesk', sans-serif" fontWeight="700" fontSize="16" fill="var(--color-accent)">15-40%</text>
                </svg>
              </div>
            </div>
          </div>
          <div className="trust-strip container">
            <p className="trust-strip-text">Trusted by <strong>50+ GTA businesses</strong> saving on essential supplies</p>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="mkt-section how-it-works" id="how-it-works">
          <div className="container">
            <div className="section-header">
              <span className="section-label">How It Works</span>
              <h2 className="section-title">Three simple steps to start saving</h2>
            </div>
            <div className="steps-grid">
              {[
                { num: "01", icon: "\ud83c\udfea", title: "Choose Your Industry", desc: "Browse the category that matches your business. We group similar businesses together for maximum buying power." },
                { num: "02", icon: "\ud83e\udd1d", title: "Join a Buying Pool", desc: "Commit to a group order. Your funds are held in secure escrow until the pool reaches its target." },
                { num: "03", icon: "\ud83d\udcb0", title: "Save Together", desc: "When the group order hits the minimum, everyone gets wholesale pricing. If not, you get a full refund." },
              ].map((s) => (
                <div key={s.num} className="step-card reveal">
                  <div className="step-number">{s.num}</div>
                  <div className="step-icon">{s.icon}</div>
                  <h3 className="step-heading">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── INDUSTRIES ─── */}
        <section className="mkt-section industries" id="industries">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Industries We Serve</span>
              <h2 className="section-title">Savings tailored to your business</h2>
              <p className="section-sub">We specialize in seven high-demand industries across the Greater Toronto Area.</p>
            </div>
            <div className="industries-grid">
              {INDUSTRIES.map((ind) => (
                <div key={ind.name} className="industry-card reveal" data-industry={ind.name}>
                  <div className="industry-emoji">{ind.emoji}</div>
                  <h3 className="industry-name">{ind.name}</h3>
                  <p className="industry-desc">{ind.desc}</p>
                  <div className="industry-savings">Save up to <strong>{ind.savings}</strong></div>
                  <p className="industry-offer">{ind.offer}</p>
                  <button
                    className="mkt-btn mkt-btn--outline mkt-btn--sm industry-cta"
                    onClick={() => selectIndustry(ind.name)}
                  >
                    Join This Pool &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WHY CANHAV ─── */}
        <section className="mkt-section benefits" id="why-canhav">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Why CanHav</span>
              <h2 className="section-title">Why group purchasing works</h2>
            </div>
            <div className="benefits-grid">
              {[
                {
                  title: "Unlock Wholesale Pricing",
                  desc: "Access supplier minimums you couldn\u2019t reach alone. Pool together with businesses like yours to unlock pricing reserved for large buyers.",
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                    </svg>
                  ),
                },
                {
                  title: "Zero Risk",
                  desc: "If the pool doesn\u2019t fill, you get every penny back. Your funds are held in secure escrow \u2014 never at risk.",
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
                    </svg>
                  ),
                },
                {
                  title: "Hassle-Free",
                  desc: "We handle the logistics \u2014 supplier coordination, order management, and delivery. You just pick your supplies and save.",
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                  ),
                },
                {
                  title: "Built for Toronto",
                  desc: "We\u2019re a local platform serving small businesses across the Greater Toronto Area. Built in Toronto, for Toronto.",
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                  ),
                },
              ].map((b) => (
                <div key={b.title} className="benefit-card reveal">
                  <div className="benefit-icon">{b.icon}</div>
                  <h3 className="benefit-heading">{b.title}</h3>
                  <p className="benefit-desc">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TRUST ─── */}
        <section className="mkt-section trust" id="trust">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Trust</span>
              <h2 className="section-title">Why small businesses trust CanHav</h2>
            </div>
            <div className="testimonials-grid">
              {[
                { quote: "\u201cWe saved over $400 on our first group order for coffee beans. CanHav made the whole process seamless.\u201d", cite: "Maria C., Caf\u00e9 Owner, Kensington Market" },
                { quote: "\u201cI was skeptical at first, but the refund guarantee convinced me to try. Now I save 30% on all my barbershop supplies.\u201d", cite: "James T., Barbershop Owner, Scarborough" },
                { quote: "\u201cGroup purchasing is the smartest thing I\u2019ve done for my business this year. The savings are real.\u201d", cite: "Priya S., Yoga Studio, Mississauga" },
              ].map((t) => (
                <blockquote key={t.cite} className="testimonial reveal">
                  <p>{t.quote}</p>
                  <footer>&mdash; <cite>{t.cite}</cite></footer>
                </blockquote>
              ))}
            </div>
            <div className="trust-badges">
              {[
                {
                  label: "Funds Protected",
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

        {/* ─── INTEREST FORM ─── */}
        <section className="mkt-section form-section" id="interest-form">
          <div className="container">
            <div className="form-wrapper">
              <div className="form-header">
                <span className="section-label">Get Started</span>
                <h2 className="section-title">Reserve your spot &mdash; it&apos;s free</h2>
                <p className="form-sub">Tell us about your business and we&apos;ll match you with savings opportunities in your industry. No commitment required.</p>
              </div>

              {!formSubmitted ? (
                <form ref={formRef} className="signup-form" noValidate onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="businessName">Business Name <span className="req">*</span></label>
                      <input
                        type="text" id="businessName" name="businessName" required
                        placeholder="Your Business Name" autoComplete="organization"
                        onInput={(e) => (e.target as HTMLElement).classList.remove("error")}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="yourName">Your Name <span className="req">*</span></label>
                      <input
                        type="text" id="yourName" name="yourName" required
                        placeholder="Full Name" autoComplete="name"
                        onInput={(e) => (e.target as HTMLElement).classList.remove("error")}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email <span className="req">*</span></label>
                      <input
                        type="email" id="email" name="email" required
                        placeholder="you@business.com" autoComplete="email"
                        onInput={(e) => (e.target as HTMLElement).classList.remove("error")}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone <span className="optional">(optional)</span></label>
                      <input type="tel" id="phone" name="phone" placeholder="(416) 555-0123" autoComplete="tel" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="industry">Industry</label>
                    <select id="industry" name="industry" ref={industryRef} defaultValue="">
                      <option value="">Select your industry</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind.name} value={ind.name}>{ind.emoji} {ind.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="supplies">What supplies do you spend the most on?</label>
                    <textarea id="supplies" name="supplies" rows={3} placeholder="e.g. coffee beans, ceramic coatings, legal software..." />
                  </div>
                  <button type="submit" className="mkt-btn mkt-btn--primary mkt-btn--lg form-submit" disabled={submitting}>
                    {submitting ? "Submitting\u2026" : "Reserve My Spot \u2014 It\u2019s Free"}
                  </button>
                  <p className="form-note">No commitment required. We&apos;ll reach out with savings opportunities for your industry.</p>
                </form>
              ) : (
                <div className="form-success">
                  <div className="success-icon">&check;</div>
                  <h3>You&apos;re in!</h3>
                  <p>Thanks for signing up. We&apos;ll reach out soon with savings opportunities tailored to your industry.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <a
              href="#hero"
              className="logo"
              aria-label="CanHav home"
              onClick={(e) => { e.preventDefault(); scrollToSection("hero"); }}
            >
              <LogoSVG size={32} />
              <span className="logo-text">CanHav</span>
            </a>
            <p className="footer-tagline">Group purchasing power for small businesses.</p>
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
                <a href="#interest-form" onClick={(e) => { e.preventDefault(); scrollToSection("interest-form"); }}>
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
