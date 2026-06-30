export const analyticsConfig = {
  firebase: {
    measurementId: "G-NWG7VMMQ87",
    enabled: process.env.NODE_ENV === "production",
  },
} as const;

export type AnalyticsConfig = typeof analyticsConfig;
