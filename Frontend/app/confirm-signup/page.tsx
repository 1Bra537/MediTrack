"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { confirmSignUp, resendSignUpCode, autoSignIn, signIn, signOut } from "aws-amplify/auth";
import { useToast } from "../components/Toast";
import Spinner from "../components/Spinner";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(emailParam);

    try {
      const storedEmail = sessionStorage.getItem("pending_signup_email");
      const storedPass = sessionStorage.getItem("pending_signup_pass");
      if (storedEmail && !emailParam) setEmail(storedEmail);
      if (storedPass) setPassword(storedPass);
    } catch {
      // Ignore session storage errors
    }
  }, [searchParams]);

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // 1. Confirm sign-up with Cognito
      const confirmRes = await confirmSignUp({
        username: email,
        confirmationCode: code.trim(),
      });

      toast.success("Email verified! Transferring to dashboard...");

      // CRITICAL: Clear any existing session before signing in the new user.
      // Without this, a previous user's session cookies persist and the dashboard
      // loads the wrong user's data.
      try {
        await signOut();
      } catch {
        // No active session — safe to ignore
      }

      // 2. Try autoSignIn
      if (confirmRes.nextStep?.signUpStep === "COMPLETE_AUTO_SIGN_IN") {
        try {
          await autoSignIn();
          window.location.href = "/dashboard";
          return;
        } catch (autoErr) {
          console.log("autoSignIn error:", autoErr);
        }
      }

      // 3. Explicit signIn
      let passToUse = password;
      if (!passToUse) {
        try {
          passToUse = sessionStorage.getItem("pending_signup_pass") || "";
        } catch {
          passToUse = "";
        }
      }

      if (passToUse) {
        await new Promise((r) => setTimeout(r, 200));
        try {
          const signInRes = await signIn({
            username: email,
            password: passToUse,
          });

          if (signInRes.isSignedIn) {
            try {
              sessionStorage.removeItem("pending_signup_email");
              sessionStorage.removeItem("pending_signup_pass");
            } catch {}
            window.location.href = "/dashboard";
            return;
          }
        } catch (signInErr) {
          console.error("Auto sign-in error:", signInErr);
        }
      }

      // Fallback redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Verification failed. Check your code and try again.";
      setErrorMsg(msg);
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (!email) {
      setErrorMsg("Please enter your email address to resend the code.");
      return;
    }
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
    <div className="auth-card">
      <div className="auth-logo">
        <div className="auth-logo-icon">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>MediTrack</span>
      </div>

      <h1 className="auth-title">Verify Email</h1>
      <p className="auth-subtitle">Enter the verification code sent to your email</p>

      {errorMsg && (
        <div className="toast toast-error mb-6" style={{ width: "100%", minWidth: 0 }}>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleConfirm}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {!password && (
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password (for automatic sign-in)
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="code">
            Verification Code
          </label>
          <input
            id="code"
            type="text"
            className="form-input"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            disabled={loading}
            style={{ letterSpacing: "0.2em", fontSize: "1.25rem", textAlign: "center" }}
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
              Verifying & Entering Dashboard…
            </>
          ) : (
            "Verify & Go To Dashboard →"
          )}
        </button>
      </form>

      <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleResendCode}
          disabled={resending}
        >
          {resending ? "Resending code…" : "Didn't receive code? Resend"}
        </button>
      </div>

      <div className="auth-footer">
        Back to{" "}
        <Link href="/login" style={{ fontWeight: 600 }}>
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmSignUpPage() {
  return (
    <div className="auth-page">
      <div className="auth-bg-glow auth-bg-glow-1" />
      <div className="auth-bg-glow auth-bg-glow-2" />
      <Suspense fallback={<Spinner size="lg" />}>
        <ConfirmContent />
      </Suspense>
    </div>
  );
}