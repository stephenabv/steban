import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0866ff, #0861d9)",
          borderRadius: 7,
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        SA
      </div>
    ),
    { ...size }
  );
}
