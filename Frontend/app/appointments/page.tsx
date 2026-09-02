"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { PageSpinner } from "../components/Spinner";
import Spinner from "../components/Spinner";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { appointmentsApi, Appointment } from "../lib/api";

export default function AppointmentsPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      const data = await appointmentsApi.list();
      setAppointments(data.appointments);
    } catch (err) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAppointment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await appointmentsApi.create({
        title,
        doctorName,
        date,
        time,
        location,
        specialty,
        notes,
        status: "scheduled",
      });

      setAppointments([...appointments, res.appointment]);
      toast.success("Appointment scheduled successfully!");
      setIsModalOpen(false);
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to schedule appointment.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus(appt: Appointment, newStatus: "scheduled" | "completed" | "cancelled") {
    try {
      await appointmentsApi.update(appt.appointmentId, { status: newStatus });
      setAppointments(
        appointments.map((a) =>
          a.appointmentId === appt.appointmentId ? { ...a, status: newStatus } : a
        )
      );
      toast.info(`Appointment marked as ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update appointment status");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    try {
      await appointmentsApi.delete(id);
      setAppointments(appointments.filter((a) => a.appointmentId !== id));
      toast.success("Appointment deleted");
    } catch (err) {
      toast.error("Failed to delete appointment");
    }
  }

  function resetForm() {
    setTitle("");
    setDoctorName("");
    setDate("");
    setTime("");
    setLocation("");
    setSpecialty("");
    setNotes("");
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="app-shell">
      <Navbar />

      <main className="main-content">
        <div className="page-header flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="page-title">Doctor Appointments</h1>
            <p className="page-subtitle">Schedule, manage, and log notes for specialist visits.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Schedule Appointment
          </button>
        </div>

        {appointments.length === 0 ? (
          <EmptyState
            title="No appointments scheduled"
            description="Keep track of upcoming hospital and specialist visits."
            action={
              <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                + Schedule Appointment
              </button>
            }
          />
        ) : (
          <div className="grid-2 gap-4">
            {appointments.map((appt) => (
              <div key={appt.appointmentId} className="card">
                <div className="flex justify-between items-center mb-3">
                  <span
                    className={`badge ${
                      appt.status === "completed"
                        ? "badge-success"
                        : appt.status === "cancelled"
                        ? "badge-danger"
                        : "badge-accent"
                    }`}
                  >
                    {appt.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                    📅 {appt.date} @ {appt.time}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                  {appt.title}
                </h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>
                  Dr. {appt.doctorName} {appt.specialty ? `(${appt.specialty})` : ""}
                </p>

                {appt.location && (
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-faint)", marginTop: "0.5rem" }}>
                    📍 {appt.location}
                  </p>
                )}

                {appt.notes && (
                  <div
                    style={{
                      background: "var(--color-surface-2)",
                      padding: "0.75rem",
                      borderRadius: "var(--radius-md)",
                      marginTop: "0.75rem",
                      fontSize: "0.875rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    "{appt.notes}"
                  </div>
                )}

                <div className="flex justify-between items-center mt-6 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <div className="flex gap-2">
                    {appt.status === "scheduled" && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleUpdateStatus(appt, "completed")}
                      >
                        ✓ Mark Complete
                      </button>
                    )}
                    {appt.status !== "cancelled" && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleUpdateStatus(appt, "cancelled")}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(appt.appointmentId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form */}
        {isModalOpen && (
          <Modal title="Schedule Appointment" onClose={() => setIsModalOpen(false)}>
            <form onSubmit={handleCreateAppointment}>
              <div className="form-group">
                <label className="form-label" htmlFor="appt-title">
                  Reason / Title <span className="required">*</span>
                </label>
                <input
                  id="appt-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Annual Cardiology Checkup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="appt-doctor">
                    Doctor's Name <span className="required">*</span>
                  </label>
                  <input
                    id="appt-doctor"
                    type="text"
                    className="form-input"
                    placeholder="Dr. Jane Doe"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="appt-specialty">
                    Medical Specialty
                  </label>
                  <input
                    id="appt-specialty"
                    type="text"
                    className="form-input"
                    placeholder="Cardiology, Dermatology..."
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="appt-date">
                    Date <span className="required">*</span>
                  </label>
                  <input
                    id="appt-date"
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="appt-time">
                    Time <span className="required">*</span>
                  </label>
                  <input
                    id="appt-time"
                    type="time"
                    className="form-input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="appt-location">
                  Clinic / Hospital Location
                </label>
                <input
                  id="appt-location"
                  type="text"
                  className="form-input"
                  placeholder="City General Hospital, Room 302"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="appt-notes">
                  Preparation / Notes
                </label>
                <textarea
                  id="appt-notes"
                  className="form-textarea"
                  placeholder="Fast 8 hours prior to blood test..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Spinner size="sm" /> : "Confirm Appointment"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}
