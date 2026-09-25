import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import styles from "./Skeleton.module.less";

export interface SkeletonProps {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  circle?: boolean;
  className?: string;
}

/** Decorative loading placeholder; pair with a single role="status" label per region. */
export function Skeleton({ width = "100%", height = 14, circle = false, className }: SkeletonProps) {
  return (
    <span
      className={cn(styles.skeleton, circle && styles.circle, className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
