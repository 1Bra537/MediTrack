"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)", color: "var(--color-text)", overflowX: "hidden" }}>
      {/* Background glow accents */}
      <div className="hero-glow" style={{ top: "-100px", left: "50%", transform: "translateX(-50%)", width: "800px", height: "500px", background: "var(--color-primary)" }} />
      <div className="hero-glow" style={{ top: "30%", right: "-200px", width: "600px", height: "600px", background: "var(--color-accent)" }} />

      {/* Navigation Header */}
      <header className="landing-nav">
        <div className="flex items-center gap-3">
          <div className="sidebar-logo-icon">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>MediTrack</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="btn btn-ghost">
            Log In
          </Link>
          <Link href="/signup" className="btn btn-primary" id="header-create-account-btn">
            Create Account
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div className="hero-badge">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Next-Generation Patient Care & Tracking</span>
          </div>

          <h1 className="hero-title">
            Take Control of Your <br />
            <span className="text-gradient">Health Journey</span>
          </h1>

          <p className="hero-subtitle">
            MediTrack offers patients a seamless, secure, and intelligent platform to track prescriptions, schedule doctor appointments, monitor vital signs, and manage personal medical histories in one unified dashboard.
          </p>

          <div className="hero-actions">
            <Link href="/signup" className="btn btn-primary btn-lg animate-pulse-glow" id="hero-create-account-btn">
              Create Account — Free
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg">
              Sign In to Your Account
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid-3 card-glass" style={{ marginTop: "4rem", padding: "2rem", textAlign: "left" }}>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary)" }}>100%</div>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Encrypted AWS Infrastructure</div>
            </div>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-accent)" }}>Real-Time</div>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Vitals & Prescription Alerts</div>
            </div>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-success)" }}>24 / 7</div>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Secure Medical Record Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Designed for <span className="text-gradient">Patient Empowerment</span>
          </h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.75rem", fontSize: "1rem" }}>
            Everything you need to maintain your medical regime with peace of mind.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon stat-icon-primary">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="feature-title">Medication Management</h3>
            <p className="feature-description">
              Organize daily dosages, frequency schedules, prescribing physician contacts, and active status for all your prescription drugs.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon stat-icon-accent">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="feature-title">Appointment Scheduler</h3>
            <p className="feature-description">
              Never miss a doctor's visit or specialist checkup. Log location details, specialty fields, and post-visit doctor notes.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon stat-icon-success">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="feature-title">Vital Signs Tracking</h3>
            <p className="feature-description">
              Log daily readings for blood pressure (systolic & diastolic), heart rate, blood glucose levels, weight, and body temperature.
            </p>
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section style={{ padding: "4rem 2rem", maxWidth: "1000px", margin: "0 auto 4rem", textAlign: "center" }}>
        <div className="card-glass" style={{ padding: "4rem 2rem", borderRadius: "var(--radius-xl)" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>
            Ready to Manage Your Health Better?
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1.125rem", maxWidth: "500px", margin: "0 auto 2rem" }}>
            Create your free account today and start tracking your prescriptions, appointments, and vitals in minutes.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/signup" className="btn btn-primary btn-lg" id="cta-create-account-btn">
              Create Account
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg">
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--color-border)", padding: "3rem 2rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
        <p>© {new Date().getFullYear()} MediTrack Platform. Powered by AWS Serverless Architecture & Next.js.</p>
      </footer>
    </div>
  );
}
