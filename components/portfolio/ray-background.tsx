import styles from "./ray-background.module.css";

/**
 * Ray / stripes animated backdrop, carried over from the previous site
 * hero and retuned to the violet accent. Pure CSS — no dependencies.
 * Fills its nearest positioned parent (absolute inset 0).
 */
export default function RayBackground() {
  return <div aria-hidden className={styles.rayHeroBg} />;
}
