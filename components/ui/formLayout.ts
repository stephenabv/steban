import styles from "./Field.module.less";

/** Grid helpers for forms — plain module so Server Components can use it too. */
export const formLayout = {
  grid: styles.formGrid,
  span2: styles.span2,
} as const;
