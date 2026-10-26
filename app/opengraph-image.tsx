import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { defaultOgImage } from "@/config/seo";
import { LogoMark } from "@/components/layout/LogoMark";

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
        <div style={{ display: "flex", marginBottom: 48 }}>
          <LogoMark size={120} />
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
