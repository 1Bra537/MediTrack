"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "aws-amplify/auth";
import { useToast } from "../components/Toast";
import Spinner from "../components/Spinner";

export default function SignUpPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });

      // Save credentials temporarily for seamless auto-login after OTP verification
      try {
        sessionStorage.setItem("pending_signup_email", email);
        sessionStorage.setItem("pending_signup_pass", password);
      } catch {
        // Ignore session storage errors
      }

      toast.success("Account created! Check your email for confirmation code.");
      router.push(`/confirm-signup?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Unable to create account. Please try again.";
      setErrorMsg(msg);
      toast.error("Sign-up failed");
    } finally {
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
              "Create Free Account"
            )}
          </button>
        </form>

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