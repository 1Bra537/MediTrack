"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "aws-amplify/auth";
import { useToast } from "../components/Toast";
import Spinner from "../components/Spinner";

const COGNITO_CONFIGURED =
  !!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID &&
  !!process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    // Demo / no-Cognito mode: skip authentication entirely
    if (!COGNITO_CONFIGURED) {
      toast.success("Welcome back!");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 200);
      return;
    }

    try {
      const result = await signIn({
        username: email,
        password,
      });

      if (result.isSignedIn) {
        toast.success("Welcome back!");
        // Use window.location.href (full reload) so the cookie-based
        // Cognito session is available when the dashboard page loads.
        window.location.href = "/dashboard";
      } else if (result.nextStep?.signInStep === "CONFIRM_SIGN_UP") {
        toast.warning("Please confirm your email before logging in.");
        router.push(`/confirm-signup?email=${encodeURIComponent(email)}`);
      } else {
        setErrorMsg("Additional authentication step required.");
        setLoading(false);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please check your credentials.";
      setErrorMsg(msg);
      toast.error("Sign-in failed");
      setLoading(false);
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

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to access your personal health dashboard</p>

        {errorMsg && (
          <div className="toast toast-error mb-6" style={{ width: "100%", minWidth: 0 }}>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
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
            <div className="flex justify-between items-center mb-1">
              <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>
                Password <span className="required">*</span>
              </label>
            </div>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                Signing In…
              </>
            ) : (
              "Sign In to MediTrack"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link href="/signup" style={{ fontWeight: 600 }}>
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
}