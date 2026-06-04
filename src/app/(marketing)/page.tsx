"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";

const X_UPDATES_URL = "https://x.com/wazarat";

const ROLES = [
  { id: "researcher", label: "Researcher" },
  { id: "trader", label: "Trader / Investor" },
  { id: "ai-builder", label: "AI Builder" },
  { id: "all", label: "All of the above" },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

const VALUE_PROPS = [
  {
    title: "See the full picture",
    body: "On-chain metrics fused with off-chain signals — governance, funding, team moves, narrative — in one research workspace.",
  },
  {
    title: "Act on conviction",
    body: "Turn thesis into trades and allocations with context price and TVL dashboards don’t surface.",
  },
  {
    title: "Feed your agents",
    body: "Structured exports and signals so your AI agents train and execute on the same intelligence you use.",
  },
];

const FEATURES = [
  {
    eyebrow: "On-chain",
    title: "Ecosystem data that actually moves markets",
    body: "Flows, liquidity, holder behavior, and protocol health across chains — curated for researchers who need signal, not noise.",
    bullets: [
      "Cross-chain activity and capital rotation",
      "Protocol-level risk and growth indicators",
      "Historical context for regime changes",
    ],
    visual: "onchain" as const,
  },
  {
    eyebrow: "Off-chain",
    title: "Intelligence beyond the chain",
    body: "Funding rounds, governance, hiring, partnerships, narrative — the off-chain layer dashboards miss until price already moved.",
    bullets: [
      "Team and governance event tracking",
      "Narrative and sentiment overlays",
      "Early signals before they hit price",
    ],
    visual: "offchain" as const,
    reverse: true,
  },
  {
    eyebrow: "Agent-ready",
    title: "Built for humans — and the agents they train",
    body: "Whether you trade manually or orchestrate autonomous agents, CanHav delivers consistent, structured intelligence both can act on.",
    bullets: [
      "API-friendly exports for agent pipelines",
      "Eval-ready datasets for model training",
      "Actionable summaries, not raw dumps",
    ],
    visual: "agents" as const,
  },
];

const USE_CASES = [
  {
    title: "Researchers",
    body: "Map ecosystems, stress-test narratives, and ship thesis-grade work with on-chain and off-chain evidence in one place.",
    tags: ["Thesis building", "Due diligence", "Ecosystem maps"],
  },
  {
    title: "Traders & investors",
    body: "Spot regime shifts, monitor flows, and size positions with context typical dashboards don’t surface.",
    tags: ["Flow analysis", "Risk monitoring", "Portfolio context"],
  },
  {
    title: "AI builders",
    body: "Train and deploy agents that reason over unified web3 intelligence — not fragmented APIs and scraped tweets.",
    tags: ["Agent training", "Structured exports", "Evals"],
  },
];

const ROADMAP = [
  { step: "01", status: "Now", title: "Waitlist & research", desc: "Early access for researchers. The founding cohort shapes the data model." },
  { step: "02", status: "Up next", title: "Unified intelligence", desc: "On-chain and off-chain layers in a single queryable workspace." },
  { step: "03", status: "Up next", title: "Alerts & workflows", desc: "Custom monitors for the signals that matter to your thesis." },
  { step: "04", status: "Later", title: "Agent integrations", desc: "First-class exports and APIs for autonomous research and execution." },
];

const FAQ = [
  {
    q: "Who is CanHav for?",
    a: "Researchers, traders, investors, and builders working at the intersection of crypto data and decision-making — anyone who needs more than a dashboard.",
  },
  {
    q: "How is this different from analytics tools?",
    a: "We fuse on-chain metrics with off-chain intelligence — governance, funding, teams, narrative — so you can understand why markets move, not just that they moved.",
  },
  {
    q: "Can I use this to train AI agents?",
    a: "Yes. The platform is designed so your research flows into agent training, backtesting, and automated workflows with structured exports.",
  },
  {
    q: "What does joining the waitlist get me?",
    a: "Early access invites, product updates, and priority onboarding as we open the workspace to the founding cohort. Follow @wazarat on X for live updates between drops.",
  },
];

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

function DataNetworkVisual() {
  return (
    <div className="data-network-wrap">
      <div className="data-network-glow" aria-hidden="true" />
      <div className="data-network-card mkt-glass">
        <div className="data-network-inner">
          <p className="mono-label">live intelligence</p>
          <svg viewBox="0 0 100 100" width="100%" style={{ marginTop: 12 }}>
            <defs>
              <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#3D7BFF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3D7BFF" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3D7BFF" stopOpacity="0" />
                <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="0.2" />
            <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="0.2" />
            <circle cx="50" cy="50" r="18" fill="url(#coreGrad)">
              <animate attributeName="r" values="18;22;18" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="18" cy="22" r="8" fill="rgba(92,146,255,0.35)" opacity="0.8" />
            <circle cx="82" cy="18" r="9" fill="rgba(92,146,255,0.35)" opacity="0.8" />
            <circle cx="14" cy="76" r="9" fill="rgba(92,146,255,0.35)" opacity="0.8" />
            <circle cx="84" cy="78" r="8" fill="rgba(92,146,255,0.35)" opacity="0.8" />
            {[[50, 50, 18, 22], [50, 50, 82, 18], [50, 50, 14, 76], [50, 50, 84, 78]].map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#lineGrad)" strokeWidth="0.4" opacity="0.6">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
              </line>
            ))}
          </svg>
          <div className="metric-row" style={{ marginTop: 16, marginBottom: 0 }}>
            <span className="metric-tag">on-chain</span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>flows · TVL · holders</span>
          </div>
          <div className="metric-row" style={{ marginBottom: 0 }}>
            <span className="metric-tag">off-chain</span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>gov · funding · narrative</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureVisual({ type }: { type: "onchain" | "offchain" | "agents" }) {
  if (type === "onchain") {
    return (
      <div className="feature-visual-panel">
        {[
          { tag: "Flows", title: "ETH staking inflows — 7d", val: "+12.4%" },
          { tag: "Risk", title: "Bridge utilization spike", val: "L2 aggregate" },
          { tag: "Holders", title: "Smart money accumulation", val: "3 protocols" },
        ].map((row) => (
          <div key={row.title} className="metric-row">
            <div style={{ minWidth: 0 }}>
              <span className="metric-tag">{row.tag}</span>
              <div style={{ fontSize: "0.875rem", marginTop: 4 }}>{row.title}</div>
            </div>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.75rem", color: "var(--color-primary-light)" }}>{row.val}</span>
          </div>
        ))}
      </div>
    );
  }
  if (type === "offchain") {
    return (
      <div className="feature-visual-panel">
        {[
          { tag: "Governance", title: "Major protocol upgrade vote opens", date: "Today" },
          { tag: "Funding", title: "Series A — infra tooling", date: "2d ago" },
          { tag: "Team", title: "Head of research hire — L2 team", date: "5d ago" },
        ].map((row) => (
          <div key={row.title} className="metric-row">
            <div style={{ minWidth: 0 }}>
              <span className="metric-tag">{row.tag}</span>
              <div style={{ fontSize: "0.875rem", marginTop: 4 }}>{row.title}</div>
            </div>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.65rem", color: "var(--color-text-muted)" }}>{row.date}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="feature-visual-panel">
      <div className="metric-row">
        <div>
          <p className="mono-label" style={{ marginBottom: 4 }}>agent.summary</p>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>thesis-research-bot</div>
        </div>
        <span className="metric-tag" style={{ background: "rgba(34,211,238,0.15)", color: "var(--color-signal)" }}>● online</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
        {[["signals", "847"], ["p95", "380ms"], ["exports", "12k"]].map(([k, v]) => (
          <div key={k} style={{ padding: 8, borderRadius: 8, background: "rgba(30,41,59,0.5)", fontSize: "0.7rem" }}>
            <div className="mono-label" style={{ fontSize: "0.55rem" }}>{k}</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarketingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleId | "">("");
  const [focus, setFocus] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

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

  const handleWaitlistSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      emailRef.current?.classList.add("error");
      return;
    }
    emailRef.current?.classList.remove("error");

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lead-capture",
          email: trimmed,
          role: role || undefined,
          focus: focus.trim() || undefined,
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
  }, [email, role, focus, utmParams]);

  const navLinks = [
    { id: "platform", label: "Platform" },
    { id: "use-cases", label: "Use Cases" },
    { id: "roadmap", label: "Roadmap" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <div ref={rootRef} className="marketing-root">
      <a href="#main-content" className="skip-link">Skip to main content</a>

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
                  <a
                    href={`#${l.id}`}
                    className="header-nav-pill"
                    onClick={(e) => { e.preventDefault(); scrollToSection(l.id); }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            <div className="header-actions-group main-nav">
              <a
                href={X_UPDATES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mkt-btn mkt-btn--ghost mkt-btn--sm"
              >
                Updates
              </a>
              <a
                href="#waitlist"
                className="nav-cta mkt-btn mkt-btn--sm"
                onClick={(e) => { e.preventDefault(); scrollToSection("waitlist"); }}
              >
                Waitlist
              </a>
            </div>
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
              <a href={X_UPDATES_URL} target="_blank" rel="noopener noreferrer" className="mkt-btn mkt-btn--outline">
                Updates
              </a>
            </li>
            <li>
              <a
                href="#waitlist"
                className="mkt-btn mkt-btn--primary"
                onClick={(e) => { e.preventDefault(); scrollToSection("waitlist"); }}
              >
                Waitlist
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <main id="main-content">
        <section className="hero" id="hero">
          <div className="container hero-inner">
            <div className="hero-content">
              <div className="hero-badge mkt-glass">
                <span>For web3 researchers &amp; practitioners</span>
                <span className="hero-badge-dot" aria-hidden="true" />
                <span style={{ color: "var(--color-text-muted)" }}>Waitlist open</span>
              </div>
              <h1 className="hero-title">
                <span className="text-gradient-brand">Web3 research</span> that moves markets — on-chain and off-chain, in one workspace.
              </h1>
              <p className="hero-sub">
                Built for researchers, traders, and AI builders. Combine ecosystem data with off-chain signals so you can
                trade, invest, or train agents on a unified thesis — not fragmented tabs.
              </p>
              <div className="hero-ctas">
                <a
                  href="#waitlist"
                  className="mkt-btn mkt-btn--primary mkt-btn--lg"
                  onClick={(e) => { e.preventDefault(); scrollToSection("waitlist"); }}
                >
                  Join the waitlist
                </a>
                <a
                  href={X_UPDATES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mkt-btn mkt-btn--outline mkt-btn--lg"
                >
                  Updates
                </a>
              </div>
              <div className="hero-stats">
                <div>
                  <span className="hero-stat-value">On-chain</span>
                  <span>flows &amp; protocol health</span>
                </div>
                <span className="hero-stat-divider" aria-hidden="true" />
                <div>
                  <span className="hero-stat-value">Off-chain</span>
                  <span>gov, funding, narrative</span>
                </div>
                <span className="hero-stat-divider" aria-hidden="true" />
                <div>
                  <span className="hero-stat-value">Agent-ready</span>
                  <span>structured exports</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <DataNetworkVisual />
            </div>
          </div>
          <div className="social-proof-strip container">
            <p>
              <strong>Built for the people shipping at the intersection of crypto data and decisions.</strong>{" "}
              Join the founding waitlist for early access.
            </p>
          </div>
        </section>

        <section className="mkt-section" id="platform">
          <div className="container">
            <div className="section-header section-header--center reveal">
              <span className="section-label">Why CanHav</span>
              <h2 className="section-title">One workspace for research, conviction, and agents</h2>
              <p className="section-sub" style={{ margin: "0 auto" }}>
                For practitioners who need more than price charts — and want their research to compound.
              </p>
            </div>
            <div className="value-grid" style={{ marginTop: "var(--space-12)" }}>
              {VALUE_PROPS.map((v) => (
                <div key={v.title} className="value-card reveal">
                  <div className="value-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-3)" }}>
                    {v.title}
                  </h3>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{v.body}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "clamp(var(--space-16), 8vw, var(--space-24))" }}>
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className={`feature-block reveal${f.reverse ? " feature-block--reverse" : ""}`}
                >
                  <div className="feature-copy">
                    <span className="mono-label">{f.eyebrow}</span>
                    <h3 className="section-title" style={{ marginTop: "var(--space-4)", fontSize: "var(--text-xl)" }}>
                      {f.title}
                    </h3>
                    <p className="section-sub">{f.body}</p>
                    <ul className="feature-list">
                      {f.bullets.map((b) => (
                        <li key={b}>
                          <span className="feature-check" aria-hidden="true">✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <FeatureVisual type={f.visual} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-section" id="use-cases">
          <div className="container">
            <div className="section-header section-header--center reveal">
              <span className="section-label">Use Cases</span>
              <h2 className="section-title">From thesis to trade to trained agent</h2>
              <p className="section-sub" style={{ margin: "0 auto" }}>
                Whether you publish research, manage capital, or build autonomous systems — the same intelligence layer powers the work.
              </p>
            </div>
            <div className="use-cases-grid" style={{ marginTop: "var(--space-12)" }}>
              {USE_CASES.map((uc) => (
                <div key={uc.title} className="use-case-card reveal">
                  <h3>{uc.title}</h3>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{uc.body}</p>
                  <div className="use-case-tags">
                    {uc.tags.map((tag) => (
                      <span key={tag} className="use-case-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-section" id="roadmap">
          <div className="container">
            <div className="section-header section-header--center reveal">
              <span className="section-label">Roadmap</span>
              <h2 className="section-title">Where we&apos;re headed</h2>
              <p className="section-sub" style={{ margin: "0 auto" }}>
                Shipping in milestones. Waitlist members shape what ships first.
              </p>
            </div>
            <div className="roadmap-steps" style={{ marginTop: "var(--space-12)" }}>
              {ROADMAP.map((step, i) => (
                <div key={step.title} className="roadmap-step reveal">
                  <div className={i === 0 ? "roadmap-status" : "roadmap-status roadmap-status--next"}>
                    Step {step.step} · {step.status}
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: "var(--space-2)" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-section form-section" id="waitlist">
          <div className="container">
            <div className="form-wrapper reveal">
              <div className="form-header section-header--center">
                <span className="section-label">Waitlist</span>
                <h2 className="section-title">Get early access to the intelligence workspace</h2>
                <p className="form-sub">
                  Join the founding cohort. We&apos;ll email you when onboarding opens — and share product updates along the way.
                </p>
              </div>

              {!formSubmitted ? (
                <form className="signup-form" noValidate onSubmit={handleWaitlistSubmit} style={{ maxWidth: 560, margin: "0 auto" }}>
                  <div className="waitlist-form-row">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      ref={emailRef}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        e.target.classList.remove("error");
                      }}
                      placeholder="you@fund.xyz"
                      autoComplete="email"
                    />
                    <button type="submit" className="mkt-btn mkt-btn--primary mkt-btn--lg form-submit" disabled={submitting}>
                      {submitting ? "Joining…" : "Join the waitlist"}
                    </button>
                  </div>

                  <div className="role-chips">
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      I am a
                    </span>
                    {ROLES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={`role-chip${role === r.id ? " active" : ""}`}
                        onClick={() => setRole(role === r.id ? "" : r.id)}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginTop: "var(--space-4)" }}>
                    <label htmlFor="focus">What ecosystems or topics are you focused on? <span className="optional">(optional)</span></label>
                    <textarea
                      id="focus"
                      name="focus"
                      rows={2}
                      value={focus}
                      onChange={(e) => setFocus(e.target.value)}
                      placeholder="e.g. L2 infra, DeFi flows, agent payments on Arbitrum"
                    />
                  </div>

                  <p className="form-note">No spam. Unsubscribe anytime. Follow <a href={X_UPDATES_URL} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary-light)" }}>@wazarat</a> for live updates.</p>
                </form>
              ) : (
                <div className="form-success">
                  <div className="success-icon">&#10003;</div>
                  <h3>You&apos;re on the list</h3>
                  <p>We&apos;ll reach out with early access invites. Follow <a href={X_UPDATES_URL} target="_blank" rel="noopener noreferrer">@wazarat on X</a> for product updates in the meantime.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mkt-section" id="faq">
          <div className="container">
            <div className="section-header section-header--center reveal">
              <span className="section-label">FAQ</span>
              <h2 className="section-title">Questions, answered</h2>
            </div>
            <div className="faq-list" style={{ marginTop: "var(--space-12)" }}>
              {FAQ.map((item) => (
                <div key={item.q} className="faq-item reveal">
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

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
            <p className="footer-tagline">On-chain &amp; off-chain intelligence for web3 research.</p>
          </div>
          <div className="footer-links">
            <h4>Product</h4>
            <ul>
              {navLinks.map((l) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(l.id); }}>
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#waitlist" onClick={(e) => { e.preventDefault(); scrollToSection("waitlist"); }}>
                  Waitlist
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Connect</h4>
            <ul>
              <li>
                <a href={X_UPDATES_URL} target="_blank" rel="noopener noreferrer">
                  Updates on X
                </a>
              </li>
              <li><a href="mailto:hello@canhav.io">hello@canhav.io</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom container">
          <p>&copy; {new Date().getFullYear()} CanHav. Intelligence for web3 researchers &amp; practitioners.</p>
        </div>
      </footer>
    </div>
  );
}
