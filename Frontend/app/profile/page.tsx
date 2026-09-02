"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { PageSpinner } from "../components/Spinner";
import Spinner from "../components/Spinner";
import { useToast } from "../components/Toast";
import { profileApi, Profile } from "../lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await profileApi.get();
        setHasProfile(true);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setDateOfBirth(data.dateOfBirth || "");
        setPhone(data.phone || "");
        setBloodType(data.bloodType || "");
        setAllergies(data.allergies || "");
        setEmergencyContact(data.emergencyContact || "");
        setGender(data.gender || "");
        setAddress(data.address || "");
      } catch (err: unknown) {
        console.log("No profile found or error:", err);
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      firstName,
      lastName,
      dateOfBirth,
      phone,
      bloodType,
      allergies,
      emergencyContact,
      gender,
      address,
    };

    try {
      if (hasProfile) {
        await profileApi.update(payload);
        toast.success("Profile updated successfully!");
      } else {
        await profileApi.create(payload);
        setHasProfile(true);
        toast.success("Profile created successfully!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save profile.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="app-shell">
      <Navbar />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Personal Patient Profile</h1>
          <p className="page-subtitle">Manage your contact details, emergency information, and medical background.</p>
        </div>

        <div className="card" style={{ maxWidth: "800px" }}>
          <form onSubmit={handleSave}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.5rem" }}>
              Basic Information
            </h2>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">
                  First Name <span className="required">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  className="form-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lastName">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  className="form-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="dateOfBirth">
                  Date of Birth <span className="required">*</span>
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  className="form-input"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="gender">
                  Gender
                </label>
                <select
                  id="gender"
                  className="form-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bloodType">
                  Blood Type
                </label>
                <select
                  id="bloodType"
                  className="form-select"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                >
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <hr className="divider" />

            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.5rem" }}>
              Medical & Emergency Contacts
            </h2>

            <div className="form-group">
              <label className="form-label" htmlFor="emergencyContact">
                Emergency Contact (Name & Phone)
              </label>
              <input
                id="emergencyContact"
                type="text"
                className="form-input"
                placeholder="Jane Doe — (555) 999-8888 (Spouse)"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="allergies">
                Known Allergies & Sensitivities
              </label>
              <textarea
                id="allergies"
                className="form-textarea"
                placeholder="Penicillin, Peanuts, Latex..."
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="address">
                Residential Address
              </label>
              <input
                id="address"
                type="text"
                className="form-input"
                placeholder="123 Health Ave, Suite 400"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner size="sm" />
                    Saving Changes…
                  </>
                ) : (
                  "Save Profile"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}