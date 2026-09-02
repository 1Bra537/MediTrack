"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { PageSpinner } from "../components/Spinner";
import Spinner from "../components/Spinner";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { vitalsApi, Vital } from "../lib/api";

const VITAL_TYPES = [
  { id: "bloodPressure", label: "Blood Pressure", unit: "mmHg" },
  { id: "heartRate", label: "Heart Rate", unit: "bpm" },
  { id: "weight", label: "Body Weight", unit: "kg" },
  { id: "bloodGlucose", label: "Blood Glucose", unit: "mg/dL" },
  { id: "temperature", label: "Body Temperature", unit: "°C" },
  { id: "oxygenSaturation", label: "Oxygen Saturation", unit: "%" },
];

export default function VitalsPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [type, setType] = useState("bloodPressure");
  const [value, setValue] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchVitals(selectedTypeFilter);
  }, [selectedTypeFilter]);

  async function fetchVitals(filter?: string) {
    try {
      const data = await vitalsApi.list(filter || undefined);
      setVitals(data.vitals);
    } catch (err) {
      toast.error("Failed to load vital signs");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogVital(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const vitalConfig = VITAL_TYPES.find((v) => v.id === type);

    try {
      const res = await vitalsApi.log({
        type,
        value: type === "bloodPressure" ? `${systolic}/${diastolic}` : value,
        unit: vitalConfig?.unit || "",
        systolic: type === "bloodPressure" ? systolic : undefined,
        diastolic: type === "bloodPressure" ? diastolic : undefined,
        notes,
      });

      setVitals([res.vital, ...vitals]);
      toast.success("Vital sign logged successfully!");
      setIsModalOpen(false);
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log vital sign.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(timestamp: string) {
    if (!confirm("Delete this vital sign reading?")) return;
    try {
      await vitalsApi.delete(timestamp);
      setVitals(vitals.filter((v) => v.timestamp !== timestamp));
      toast.success("Reading deleted");
    } catch (err) {
      toast.error("Failed to delete reading");
    }
  }

  function resetForm() {
    setType("bloodPressure");
    setValue("");
    setSystolic("");
    setDiastolic("");
    setNotes("");
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="app-shell">
      <Navbar />

      <main className="main-content">
        <div className="page-header flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="page-title">Vital Signs Timeline</h1>
            <p className="page-subtitle">Track physiological indicators and daily readings over time.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Log New Reading
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            className={`btn btn-sm ${!selectedTypeFilter ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setSelectedTypeFilter("")}
          >
            All Vitals
          </button>
          {VITAL_TYPES.map((vt) => (
            <button
              key={vt.id}
              className={`btn btn-sm ${selectedTypeFilter === vt.id ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelectedTypeFilter(vt.id)}
            >
              {vt.label}
            </button>
          ))}
        </div>

        {vitals.length === 0 ? (
          <EmptyState
            title="No vital sign logs found"
            description="Start recording daily blood pressure, heart rate, or sugar levels."
            action={
              <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                + Log Vital
              </button>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Vital Metric</th>
                  <th>Reading Value</th>
                  <th>Unit</th>
                  <th>Notes</th>
                  <th>Recorded At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vitals.map((v) => {
                  const vitalInfo = VITAL_TYPES.find((vt) => vt.id === v.type);
                  return (
                    <tr key={v.timestamp}>
                      <td>
                        <span className="badge badge-success" style={{ textTransform: "capitalize" }}>
                          {vitalInfo?.label || v.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: "1.0625rem" }}>
                        {v.type === "bloodPressure" ? `${v.systolic}/${v.diastolic}` : v.value}
                      </td>
                      <td style={{ color: "var(--color-text-muted)" }}>{v.unit}</td>
                      <td style={{ color: "var(--color-text-muted)" }}>{v.notes || "—"}</td>
                      <td style={{ fontSize: "0.8125rem", color: "var(--color-text-faint)" }}>
                        {new Date(v.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(v.timestamp)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Form */}
        {isModalOpen && (
          <Modal title="Log Vital Sign" onClose={() => setIsModalOpen(false)}>
            <form onSubmit={handleLogVital}>
              <div className="form-group">
                <label className="form-label" htmlFor="vital-type">
                  Vital Metric Type <span className="required">*</span>
                </label>
                <select
                  id="vital-type"
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {VITAL_TYPES.map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      {vt.label} ({vt.unit})
                    </option>
                  ))}
                </select>
              </div>

              {type === "bloodPressure" ? (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="systolic">
                      Systolic (Upper) <span className="required">*</span>
                    </label>
                    <input
                      id="systolic"
                      type="number"
                      className="form-input"
                      placeholder="120"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="diastolic">
                      Diastolic (Lower) <span className="required">*</span>
                    </label>
                    <input
                      id="diastolic"
                      type="number"
                      className="form-input"
                      placeholder="80"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" htmlFor="vital-val">
                    Reading Value ({VITAL_TYPES.find((vt) => vt.id === type)?.unit}){" "}
                    <span className="required">*</span>
                  </label>
                  <input
                    id="vital-val"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 72, 98.6"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="vital-notes">
                  Notes / Observations
                </label>
                <textarea
                  id="vital-notes"
                  className="form-textarea"
                  placeholder="Taken after 30 mins rest..."
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
                  {saving ? <Spinner size="sm" /> : "Save Reading"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}
