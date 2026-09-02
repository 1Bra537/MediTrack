"use client";

import { useState } from "react";
import { updatePassword } from "aws-amplify/auth";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";
import { useToast } from "../components/Toast";

export default function SettingsPage() {
  const toast = useToast();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  // Notification Toggles
  const [medReminders, setMedReminders] = useState(true);
  const [apptAlerts, setApptAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setUpdating(true);

    try {
      await updatePassword({
        oldPassword,
        newPassword,
      });

      toast.success("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Account Settings</h1>
          <p className="page-subtitle">Manage security, notifications, and application preferences.</p>
        </div>

        <div className="grid-2 gap-6" style={{ maxWidth: "1000px" }}>
          {/* Security Card */}
          <div className="card">
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.5rem" }}>
              Security & Credentials
            </h2>

            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label" htmlFor="oldPassword">
                  Current Password
                </label>
                <input
                  id="oldPassword"
                  type="password"
                  className="form-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-input"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end mt-6">
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? <Spinner size="sm" /> : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* Preferences & Notifications */}
          <div className="card">
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.5rem" }}>
              Notification Preferences
            </h2>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center card-glass" style={{ padding: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Medication Reminders</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    Receive daily dose notifications
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={medReminders}
                  onChange={(e) => {
                    setMedReminders(e.target.checked);
                    toast.info(`Medication reminders ${e.target.checked ? "enabled" : "disabled"}`);
                  }}
                  style={{ width: 20, height: 20, cursor: "pointer" }}
                />
              </div>

              <div className="flex justify-between items-center card-glass" style={{ padding: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Appointment Alerts</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    Get email alerts 24h before scheduled visits
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={apptAlerts}
                  onChange={(e) => {
                    setApptAlerts(e.target.checked);
                    toast.info(`Appointment alerts ${e.target.checked ? "enabled" : "disabled"}`);
                  }}
                  style={{ width: 20, height: 20, cursor: "pointer" }}
                />
              </div>

              <div className="flex justify-between items-center card-glass" style={{ padding: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Weekly Health Summary</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    Email summary of vitals & progress
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailDigest}
                  onChange={(e) => {
                    setEmailDigest(e.target.checked);
                    toast.info(`Weekly summary ${e.target.checked ? "enabled" : "disabled"}`);
                  }}
                  style={{ width: 20, height: 20, cursor: "pointer" }}
                />
              </div>
            </div>

            <hr className="divider" />

            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>
              AWS Infrastructure & Stack
            </h2>
            <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              <p>Region: <code>us-east-1</code></p>
              <p>Auth: Cognito User Pool (SRP / Email)</p>
              <p>Storage: Amazon DynamoDB (Single-Digit Ms Latency)</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
