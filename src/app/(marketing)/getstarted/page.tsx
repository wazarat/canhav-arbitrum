"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";

const INDUSTRY_NAMES = [
  "Coffee Shops",
  "Barbershops",
  "Auto Detailing",
  "Small Law Firms",
  "Marketing Agencies",
  "Real Estate",
  "Yoga Studios",
];

export default function GetStartedPage() {
  const [formStep, setFormStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});
  const [savedEmail, setSavedEmail] = useState("");
  const [savedIndustry, setSavedIndustry] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const industryRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) setDarkMode(true);
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

    const preselect = params.get("industry");
    if (preselect && INDUSTRY_NAMES.includes(preselect)) {
      setSavedIndustry(preselect);
    }
  }, []);

  const handleStepOne = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    form.querySelectorAll(".error").forEach((el: Element) => el.classList.remove("error"));

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

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lead-capture",
          businessName,
          yourName,
          email: savedEmail,
          phone: (form.elements.namedItem("phone") as HTMLInputElement).value.trim(),
          industry: savedIndustry,
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

  return (
    <div
      className="marketing-root"
      data-theme={darkMode ? "dark" : "light"}
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Minimal header */}
      <header className="getstarted-header">
        <div className="container getstarted-header-inner">
          <a href="/" className="getstarted-logo">
            <img src="/ch-logo.svg" alt="CanHav" width={32} height={32} />
            <span className="getstarted-logo-text">CanHav</span>
          </a>
          <button
            className="getstarted-theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
        </div>
      </header>

      {/* Main form section */}
      <main className="getstarted-main">
        <div className="container">
          <div className="getstarted-card">
            <div className="form-header">
              <span className="section-label">Get Started</span>
              <h1 className="section-title">Find out what you could save</h1>
              <p className="form-sub">
                Takes 30 seconds. We will research supplier pricing for your industry and send you a personalized savings estimate. No commitment, no credit card.
              </p>
            </div>

            {!formSubmitted ? (
              <>
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
                        {INDUSTRY_NAMES.map((name) => (
                          <option key={name} value={name}>{name}</option>
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
                        <input type="text" id="businessName" name="businessName" placeholder="Your Business Name" autoComplete="organization" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="yourName">Your Name</label>
                        <input type="text" id="yourName" name="yourName" placeholder="Full Name" autoComplete="name" />
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

          {/* Trust reinforcement */}
          <div className="getstarted-trust">
            <p>No commitment. No upfront payment. 100% refund guarantee if the pool does not fill.</p>
          </div>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="getstarted-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} CanHav. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
