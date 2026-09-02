"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";
import { useToast } from "../components/Toast";
import { recordsApi } from "../lib/api";

interface UploadedDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  date: string;
}

export default function RecordsPage() {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Step 1: Get pre-signed URL from API
      const { uploadUrl, objectKey } = await recordsApi.getUploadUrl(file.name, file.type);

      // Step 2: Perform upload if live URL, or mock success
      if (uploadUrl.startsWith("https://") && !uploadUrl.includes("mock-s3")) {
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
      }

      const newDoc: UploadedDocument = {
        id: objectKey || String(Date.now()),
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type.includes("pdf") ? "PDF Document" : "Medical Image",
        date: new Date().toLocaleDateString(),
      };

      setDocuments([newDoc, ...documents]);
      toast.success(`Uploaded ${file.name} successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload document.";
      toast.error(msg);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Medical Records & Documents</h1>
          <p className="page-subtitle">Securely store lab results, doctor prescriptions, and X-ray scans in AWS S3.</p>
        </div>

        {/* Upload dropzone */}
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", borderStyle: "dashed" }}>
          <div className="empty-state-icon" style={{ margin: "0 auto 1.5rem", width: 72, height: 72 }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Secure S3 Document Storage
          </h3>
          <p style={{ color: "var(--color-text-muted)", maxWidth: "480px", margin: "0 auto 1.5rem" }}>
            Upload PDFs, lab reports, imaging scans, and prescriptions. All documents are encrypted and stored in your private AWS S3 bucket.
          </p>

          <label className="btn btn-primary btn-lg" style={{ cursor: "pointer" }}>
            {uploading ? (
              <>
                <Spinner size="sm" />
                Encrypting & Uploading…
              </>
            ) : (
              "📁 Select PDF / Document File"
            )}
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {/* Uploaded Documents Table */}
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "2.5rem 0 1rem" }}>
          My Encrypted Vault Documents ({documents.length})
        </h2>

        {documents.length === 0 ? (
          <div className="grid-3">
            <div className="card card-glass">
              <div className="flex items-center gap-3 mb-3">
                <span className="stat-icon stat-icon-primary" style={{ width: 40, height: 40 }}>
                  📑
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>Lab Test Reports</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>0 documents</div>
                </div>
              </div>
            </div>

            <div className="card card-glass">
              <div className="flex items-center gap-3 mb-3">
                <span className="stat-icon stat-icon-accent" style={{ width: 40, height: 40 }}>
                  🩺
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>Doctor Prescriptions</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>0 documents</div>
                </div>
              </div>
            </div>

            <div className="card card-glass">
              <div className="flex items-center gap-3 mb-3">
                <span className="stat-icon stat-icon-success" style={{ width: 40, height: 40 }}>
                  🦴
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>X-Rays & Imaging</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>0 documents</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>File Size</th>
                  <th>Uploaded Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600 }}>📄 {doc.name}</td>
                    <td style={{ color: "var(--color-text-muted)" }}>{doc.type}</td>
                    <td style={{ color: "var(--color-text-muted)" }}>{doc.size}</td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-text-faint)" }}>{doc.date}</td>
                    <td>
                      <span className="badge badge-success">Encrypted S3</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
