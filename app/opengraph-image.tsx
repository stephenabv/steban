import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { defaultOgImage } from "@/config/seo";

export const alt = defaultOgImage.alt;
export const size = { width: defaultOgImage.width, height: defaultOgImage.height };
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
          background: "#0b0d10",
          padding: "80px 96px",
          color: "#e6eaef",
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
            background: "linear-gradient(135deg, #2f6feb, #2560d4)",
            borderRadius: 28,
            marginBottom: 48,
          }}
        >
          <div style={{ fontSize: 52, fontWeight: 700, color: "#fff" }}>SA</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
            <div style={{ width: 34, height: 5, background: "#a9c7ff", borderRadius: 3 }} />
            <div
              style={{
                width: 12,
                height: 12,
                background: "#a9c7ff",
                borderRadius: 6,
                marginLeft: 7,
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 78, fontWeight: 700, lineHeight: 1.1 }}>
          Stephen{" "}
          <span style={{ color: "#79a8ff", marginLeft: 20 }}>Abueva</span>
        </div>
        <div style={{ display: "flex", fontSize: 36, color: "#a7b0ba", marginTop: 20 }}>
          Computer Engineer
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#8b949e", marginTop: 44 }}>
          {siteConfig.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    { ...size }
  );
}
