import { Chakra_Petch } from "next/font/google";

/**
 * The HUD display face: headings, labels, buttons and readouts only. One
 * weight and the Latin subset keep it to a single small file, self-hosted and
 * preloaded by next/font. Body copy stays on the system stack (no download).
 * The metric-adjusted fallback keeps the swap from shifting layout (CLS).
 */
export const hudFont = Chakra_Petch({
  weight: "600",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hud",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});
