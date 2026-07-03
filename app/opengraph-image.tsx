import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — Computer Engineer`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#0a0a0f",
          padding: "80px 96px",
          color: "#f0f0f5",
          fontFamily: "sans-serif",
        }}
      >
        {/* SA badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            borderRadius: 28,
            marginBottom: 48,
          }}
        >
          <div style={{ fontSize: 52, fontWeight: 700, color: "#fff" }}>SA</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
            <div style={{ width: 34, height: 5, background: "#c7d2fe", borderRadius: 3 }} />
            <div
              style={{
                width: 12,
                height: 12,
                background: "#c7d2fe",
                borderRadius: 6,
                marginLeft: 7,
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 78, fontWeight: 700, lineHeight: 1.1 }}>
          Stephen{" "}
          <span style={{ color: "#6366f1", marginLeft: 20 }}>Abueva</span>
        </div>
        <div style={{ display: "flex", fontSize: 36, color: "#9090a8", marginTop: 20 }}>
          Computer Engineer
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#606075", marginTop: 44 }}>
          {siteConfig.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    { ...size }
  );
}
