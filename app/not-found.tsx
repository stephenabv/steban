import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "2rem",
        textAlign: "center",
        background: "#0a0a0f",
        color: "#f0f0f5",
        fontFamily: "var(--font-sans, sans-serif)",
      }}
    >
      <p style={{ fontSize: "5rem", fontWeight: 800, color: "#6366f1", lineHeight: 1 }}>404</p>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Page Not Found</h1>
      <p style={{ color: "#9090a8" }}>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link
        href="/"
        style={{
          marginTop: "0.5rem",
          padding: "0.75rem 2rem",
          background: "#6366f1",
          color: "#fff",
          borderRadius: "9999px",
          fontWeight: 600,
          fontSize: "0.875rem",
          textDecoration: "none",
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}
