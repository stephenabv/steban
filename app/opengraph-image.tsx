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
          background: "#050706",
          padding: "80px 96px",
          color: "#e8eeea",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", marginBottom: 48 }}>
          <LogoMark size={120} />
        </div>

        <div style={{ display: "flex", fontSize: 78, fontWeight: 700, lineHeight: 1.1, letterSpacing: 4, textTransform: "uppercase" }}>
          Stephen{" "}
          <span style={{ color: "#3bea62", marginLeft: 20 }}>Abueva</span>
        </div>
        <div style={{ display: "flex", fontSize: 36, color: "#a9b3ae", marginTop: 20 }}>
          Computer Engineer
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#8c9691", marginTop: 44 }}>
          {siteConfig.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    { ...size }
  );
}
