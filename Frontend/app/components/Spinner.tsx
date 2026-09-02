"use client";

export default function Spinner({
  size = "default",
  className = "",
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const cls =
    size === "lg" ? "spinner spinner-lg" : size === "sm" ? "spinner" : "spinner";
  return (
    <div
      className={`${cls} ${className}`}
      role="status"
      aria-label="Loading"
      style={size === "sm" ? { width: 16, height: 16 } : undefined}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="spinner-page">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <Spinner size="lg" />
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>Loading…</p>
      </div>
    </div>
  );
}
