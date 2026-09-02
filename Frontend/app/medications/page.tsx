"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { PageSpinner } from "../components/Spinner";
import Spinner from "../components/Spinner";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { medicationsApi, Medication } from "../lib/api";

export default function MedicationsPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [prescribedBy, setPrescribedBy] = useState("");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchMedications();
  }, []);

  async function fetchMedications() {
    try {
      const data = await medicationsApi.list();
      setMedications(data.medications);
    } catch (err: unknown) {
      toast.error("Failed to load medications");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateMedication(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await medicationsApi.create({
        name,
        dosage,
        frequency,
        prescribedBy,
        startDate,
        notes,
        isActive: true,
      });

      setMedications([res.medication, ...medications]);
      toast.success("Medication added successfully!");
      setIsModalOpen(false);
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add medication.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(med: Medication) {
    try {
      await medicationsApi.update(med.medicationId, { isActive: !med.isActive });
      setMedications(
        medications.map((m) =>
          m.medicationId === med.medicationId ? { ...m, isActive: !m.isActive } : m
        )
      );
      toast.info(`Updated status for ${med.name}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this medication?")) return;
    try {
      await medicationsApi.delete(id);
      setMedications(medications.filter((m) => m.medicationId !== id));
      toast.success("Medication deleted");
    } catch (err) {
      toast.error("Failed to delete medication");
    }
  }

  function resetForm() {
    setName("");
    setDosage("");
    setFrequency("");
    setPrescribedBy("");
    setStartDate("");
    setNotes("");
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="app-shell">
      <Navbar />

      <main className="main-content">
        <div className="page-header flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="page-title">Medication Management</h1>
            <p className="page-subtitle">Track active prescriptions, dosages, and dosing schedules.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Add Medication
          </button>
        </div>

        {medications.length === 0 ? (
          <EmptyState
            title="No medications added yet"
            description="Keep your prescriptions organized by adding your first medication."
            action={
              <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                + Add Medication
              </button>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Prescribed By</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((med) => (
                  <tr key={med.medicationId}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{med.name}</div>
                      {med.notes && (
                        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                          {med.notes}
                        </div>
                      )}
                    </td>
                    <td>{med.dosage}</td>
                    <td>{med.frequency}</td>
                    <td>{med.prescribedBy || "—"}</td>
                    <td>
                      <span className={`badge ${med.isActive ? "badge-success" : "badge-neutral"}`}>
                        {med.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleToggleStatus(med)}
                        >
                          {med.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(med.medicationId)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Form */}
        {isModalOpen && (
          <Modal title="Add New Medication" onClose={() => setIsModalOpen(false)}>
            <form onSubmit={handleCreateMedication}>
              <div className="form-group">
                <label className="form-label" htmlFor="med-name">
                  Medication Name <span className="required">*</span>
                </label>
                <input
                  id="med-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Amoxicillin, Lisinopril"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="med-dosage">
                    Dosage <span className="required">*</span>
                  </label>
                  <input
                    id="med-dosage"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 500mg, 10ml"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="med-freq">
                    Frequency <span className="required">*</span>
                  </label>
                  <input
                    id="med-freq"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Twice daily, Every 8 hours"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="med-doc">
                    Prescribing Doctor
                  </label>
                  <input
                    id="med-doc"
                    type="text"
                    className="form-input"
                    placeholder="Dr. Smith"
                    value={prescribedBy}
                    onChange={(e) => setPrescribedBy(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="med-start">
                    Start Date
                  </label>
                  <input
                    id="med-start"
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="med-notes">
                  Instructions / Notes
                </label>
                <textarea
                  id="med-notes"
                  className="form-textarea"
                  placeholder="Take with meals. Avoid grapefruit juice."
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
                  {saving ? <Spinner size="sm" /> : "Save Medication"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}
