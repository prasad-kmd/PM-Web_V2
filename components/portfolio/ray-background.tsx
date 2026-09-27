import styles from "./ray-background.module.css";

/**
 * Accent-aware animated ray backdrop for the portfolio header. Pure CSS — no dependencies.
 * Fills its nearest positioned parent (absolute inset 0).
 */
export default function RayBackground() {
  return <div aria-hidden className={styles.portfolioRayBackdrop} />;
}
