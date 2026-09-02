"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp, confirmSignUp, autoSignIn, signIn, resendSignUpCode } from "aws-amplify/auth";
import { useToast } from "../components/Toast";
import Spinner from "../components/Spinner";

const COGNITO_CONFIGURED =
  !!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID &&
  !!process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

export default function SignUpPage() {
  const toast = useToast();

  // Wizard Step: 1 = Registration details, 2 = Verification code
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: Submit email & password to Cognito
  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    // If Cognito is not configured, skip to step 2 immediately (demo mode)
    if (!COGNITO_CONFIGURED) {
      toast.success("Demo mode: Enter any 6-digit code to continue.");
      setLoading(false);
      setStep(2);
      return;
    }

    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
          autoSignIn: true,
        },
      });

      toast.success("Account created! Enter your 6-digit verification code.");
      setStep(2);
    } catch (err: unknown) {
      console.error("Sign-up error:", err);
      const msg = err instanceof Error ? err.message : "Unable to create account. Please try again.";
      setErrorMsg(msg);
      toast.error("Sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Confirm code & guaranteed transfer to /dashboard
  async function handleConfirmCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    // Demo / no-Cognito mode: skip verification entirely
    if (!COGNITO_CONFIGURED) {
      toast.success("Welcome to MediTrack! Loading your dashboard...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 300);
      return;
    }

    // Phase A: Confirm the code with Cognito
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code.trim(),
      });
    } catch (confirmErr: unknown) {
      console.error("Confirmation error:", confirmErr);
      const msg = confirmErr instanceof Error ? confirmErr.message : "Verification code incorrect. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    // Phase B: Code confirmation succeeded! Notify user and sign in
    toast.success("Email verified! Loading your dashboard...");

    try {
      // Attempt autoSignIn
      await autoSignIn();
    } catch {
      try {
        // Fallback explicit sign in
        await signIn({
          username: email,
          password,
        });
      } catch (signInErr) {
        console.log("Explicit sign-in attempt after confirm:", signInErr);
      }
    }

    // Phase C: Guaranteed navigation to dashboard
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 150);
  }

  async function handleResendCode() {
    setResending(true);
    try {
      await resendSignUpCode({ username: email });
      toast.info("A new verification code has been sent to your email.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend code.";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-glow auth-bg-glow-1" />
      <div className="auth-bg-glow auth-bg-glow-2" />

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>MediTrack</span>
        </div>

        {step === 1 ? (
          <>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join MediTrack to start managing your health journey</p>

            {errorMsg && (
              <div className="toast toast-error mb-6" style={{ width: "100%", minWidth: 0 }}>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSignUp}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password <span className="required">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Min. 8 chars, 1 uppercase, 1 digit"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm Password <span className="required">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg mt-4"
                style={{ width: "100%" }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Creating Account…
                  </>
                ) : (
                  "Create Account & Continue →"
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="auth-title">Verify Email</h1>
            <p className="auth-subtitle">
              Enter the 6-digit code sent to <strong style={{ color: "var(--color-primary)" }}>{email}</strong>
            </p>

            {errorMsg && (
              <div className="toast toast-error mb-6" style={{ width: "100%", minWidth: 0 }}>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleConfirmCode}>
              <div className="form-group">
                <label className="form-label" htmlFor="code">
                  6-Digit Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  className="form-input"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  disabled={loading}
                  style={{ letterSpacing: "0.25em", fontSize: "1.35rem", textAlign: "center", fontWeight: 700 }}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg mt-4"
                style={{ width: "100%" }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Verifying & Transferring to Dashboard…
                  </>
                ) : (
                  "Verify & Enter Dashboard →"
                )}
              </button>
            </form>

            <div style={{ marginTop: "1.5rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleResendCode}
                disabled={resending}
              >
                {resending ? "Resending code…" : "Didn't receive code? Resend"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setStep(1)}
                style={{ color: "var(--color-text-faint)" }}
              >
                ← Back to email address
              </button>
            </div>
          </>
        )}

        <div className="auth-footer">
          Already have an account?{" "}
          <Link href="/login" style={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}