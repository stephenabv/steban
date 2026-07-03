import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          borderRadius: 40,
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: 2 }}>SA</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <div style={{ width: 52, height: 8, background: "#c7d2fe", borderRadius: 4 }} />
          <div
            style={{
              width: 18,
              height: 18,
              background: "#c7d2fe",
              borderRadius: 9,
              marginLeft: 10,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
