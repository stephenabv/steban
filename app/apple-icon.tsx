import { ImageResponse } from "next/og";
import { LogoMark } from "@/components/layout/LogoMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so the tile is drawn square to avoid a halo.
export default function AppleIcon() {
  return new ImageResponse(<LogoMark size={size.width} square />, { ...size });
}
