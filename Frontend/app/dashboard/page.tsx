"use client";

import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { PageSpinner } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import {
  profileApi,
  medicationsApi,
  appointmentsApi,
  vitalsApi,
  Profile,
  Medication,
  Appointment,
  Vital,
} from "../lib/api";

const COGNITO_CONFIGURED =
  !!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID &&
  !!process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

/** Try fetchAuthSession up to `retries` times with a `delayMs` gap. */
async function getSessionWithRetry(retries = 3, delayMs = 800) {
  for (let i = 0; i < retries; i++) {
    try {
      const session = await fetchAuthSession();
      if (session.tokens?.idToken) return session;
    } catch {
      // Amplify not yet initialised — swallow and retry
    }
    if (i < retries - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        // When Cognito is configured: verify the session exists.
        // We retry a few times because window.location.href reloads can cause
        // Amplify to rehydrate its session asynchronously from cookie storage.
        if (COGNITO_CONFIGURED) {
          const session = await getSessionWithRetry(3, 600);
          if (!session) {
            router.push("/login");
            return;
          }
        }
        // When Cognito is NOT configured: skip auth check entirely — the app
        // runs in full localStorage-fallback mode without any login required.

        // Fetch data in parallel — each call has its own localStorage fallback
        const [profRes, medRes, apptRes, vitRes] = await Promise.allSettled([
          profileApi.get(),
          medicationsApi.list(),
          appointmentsApi.list(),
          vitalsApi.list(),
        ]);

        if (profRes.status === "fulfilled") setProfile(profRes.value);
        if (medRes.status === "fulfilled") setMedications(medRes.value.medications);
        if (apptRes.status === "fulfilled") setAppointments(apptRes.value.appointments);
        if (vitRes.status === "fulfilled") setVitals(vitRes.value.vitals);

      } catch (err) {
        console.error("Dashboard load error:", err);
        if (COGNITO_CONFIGURED) router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  if (loading) return <PageSpinner />;

  const activeMeds = medications.filter((m) => m.isActive);
  const upcomingAppts = appointments.filter((a) => a.status === "scheduled");
  const recentVitals = vitals.slice(0, 3);

  const userName = profile?.firstName ? `${profile.firstName} ${profile.lastName}` : "Patient";

  return (
    <div className="app-shell">
      <Navbar />

      <main className="main-content">
        {/* Welcome Header */}
        <div className="page-header flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="page-title">
              Welcome back, <span className="text-gradient">{userName}</span> 👋
            </h1>
            <p className="page-subtitle">Here is your daily medical overview and upcoming schedules.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/vitals" className="btn btn-secondary">
              + Log Vital
            </Link>
            <Link href="/medications" className="btn btn-primary">
              + Add Medication
            </Link>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid-4 mb-8">
          <div className="stat-card">
            <div className="stat-icon stat-icon-primary">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{activeMeds.length}</div>
              <div className="stat-label">Active Prescriptions</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-accent">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{upcomingAppts.length}</div>
              <div className="stat-label">Upcoming Appointments</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-success">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{vitals.length}</div>
              <div className="stat-label">Vitals Logged</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-warning">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ fontSize: "1.25rem" }}>
                {profile?.bloodType || "Not Set"}
              </div>
              <div className="stat-label">Blood Type Profile</div>
            </div>
          </div>
        </div>

        {/* Dashboard Main Grid */}
        <div className="grid-2 gap-6">
          {/* Upcoming Appointments Widget */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Upcoming Appointments</h2>
              <Link href="/appointments" className="btn btn-ghost btn-sm">
                View All →
              </Link>
            </div>

            {upcomingAppts.length === 0 ? (
              <EmptyState
                title="No upcoming appointments"
                description="Schedule your next doctor visit or checkup."
                action={
                  <Link href="/appointments" className="btn btn-secondary btn-sm">
                    Schedule Now
                  </Link>
                }
              />
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingAppts.slice(0, 3).map((appt) => (
                  <div key={appt.appointmentId} className="card-glass" style={{ padding: "1rem" }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div style={{ fontWeight: 600 }}>{appt.title}</div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                          Dr. {appt.doctorName} {appt.specialty ? `• ${appt.specialty}` : ""}
                        </div>
                      </div>
                      <span className="badge badge-accent">
                        {appt.date} @ {appt.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Medications Widget */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Active Prescriptions</h2>
              <Link href="/medications" className="btn btn-ghost btn-sm">
                Manage →
              </Link>
            </div>

            {activeMeds.length === 0 ? (
              <EmptyState
                title="No active prescriptions"
                description="Add your daily medications to keep track of dosages."
                action={
                  <Link href="/medications" className="btn btn-secondary btn-sm">
                    Add Medication
                  </Link>
                }
              />
            ) : (
              <div className="flex flex-col gap-3">
                {activeMeds.slice(0, 3).map((med) => (
                  <div key={med.medicationId} className="card-glass" style={{ padding: "1rem" }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div style={{ fontWeight: 600 }}>{med.name}</div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                          Dosage: {med.dosage}
                        </div>
                      </div>
                      <span className="badge badge-primary">{med.frequency}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Vitals Widget */}
        <div className="card mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Recent Vital Readings</h2>
            <Link href="/vitals" className="btn btn-ghost btn-sm">
              Log Reading →
            </Link>
          </div>

          {recentVitals.length === 0 ? (
            <EmptyState
              title="No vital signs recorded"
              description="Start recording blood pressure, heart rate, or blood glucose daily."
              action={
                <Link href="/vitals" className="btn btn-secondary btn-sm">
                  Log First Vital
                </Link>
              }
            />
          ) : (
            <div className="grid-3 gap-4">
              {recentVitals.map((v) => (
                <div key={v.timestamp} className="card-glass" style={{ padding: "1.25rem" }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="badge badge-success" style={{ textTransform: "capitalize" }}>
                      {v.type}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-faint)" }}>
                      {new Date(v.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0" }}>
                    {v.type === "bloodPressure" ? `${v.systolic}/${v.diastolic}` : v.value}{" "}
                    <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
                      {v.unit}
                    </span>
                  </div>
                  {v.notes && (
                    <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                      "{v.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}