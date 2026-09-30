"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { usePathname } from "next/navigation";
import styles from "./wisteria-scrollbar.module.css";

/** An inset indicator for the document scroller; never replaces scroll snapping. */
export function WisteriaScrollbar() {
  const pathname = usePathname();
  const railRef = useRef<HTMLDivElement>(null);
  const beadRef = useRef<HTMLSpanElement>(null);
  const draggingRef = useRef(false);
  const pointerStartRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let frame = 0;
    const sync = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const root = document.documentElement;
        const range = Math.max(0, root.scrollHeight - root.clientHeight);
        const loading =
          root.dataset.loading === "on" ||
          Boolean(document.querySelector("[data-loading-screen]"));
        const value = range
          ? Math.min(1, Math.max(0, window.scrollY / range))
          : 0;
        setVisible(range > 8 && !loading);
        setPercent(Math.round(value * 100));
        if (beadRef.current && railRef.current) {
          const travel = Math.max(0, railRef.current.clientHeight - 32);
          beadRef.current.style.top = `${16 + value * travel}px`;
        }
      });
    };
    const observer = new ResizeObserver(sync);
    observer.observe(document.documentElement);
    observer.observe(document.body);
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [pathname]);

  function seek(clientY: number, behavior: ScrollBehavior = "instant") {
    const rail = railRef.current;
    if (!rail) return;
    const { top, height } = rail.getBoundingClientRect();
    const fraction = Math.min(
      1,
      Math.max(0, (clientY - top - 16) / Math.max(1, height - 32)),
    );
    const root = document.documentElement;
    const range = Math.max(0, root.scrollHeight - root.clientHeight);
    // Only explicit pointer/keyboard interactions seek. Wheel, touch, links and
    // the homepage's mandatory CSS snap keep their original scroll behavior.
    window.scrollTo({ top: fraction * range, behavior });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    // Do not jump on press: a stationary click animates to its destination,
    // while an actual drag scrubs directly once the pointer has moved.
    pointerStartRef.current = event.clientY;
    draggingRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStartRef.current;
    if (start === null) return;
    if (!draggingRef.current && Math.abs(event.clientY - start) > 5) {
      draggingRef.current = true;
      event.currentTarget.dataset.dragging = "true";
    }
    if (draggingRef.current) seek(event.clientY);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pointerStartRef.current !== null && !draggingRef.current) {
      seek(
        event.clientY,
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      );
    }
    stopDrag();
  }

  function stopDrag() {
    pointerStartRef.current = null;
    draggingRef.current = false;
    if (railRef.current) delete railRef.current.dataset.dragging;
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const root = document.documentElement;
    const range = Math.max(0, root.scrollHeight - root.clientHeight);
    let target: number | null = null;
    if (event.key === "ArrowDown") target = window.scrollY + 48;
    if (event.key === "ArrowUp") target = window.scrollY - 48;
    if (event.key === "PageDown")
      target = window.scrollY + root.clientHeight * 0.8;
    if (event.key === "PageUp")
      target = window.scrollY - root.clientHeight * 0.8;
    if (event.key === "Home") target = 0;
    if (event.key === "End") target = range;
    if (target === null) return;
    event.preventDefault();
    window.scrollTo({
      top: Math.max(0, Math.min(range, target)),
      behavior: "instant",
    });
  }

  return (
    <div
      ref={railRef}
      role="scrollbar"
      aria-label="Page position"
      aria-controls="page-scroller"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}% down the page`}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      data-visible={visible}
      className={styles.rail}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={stopDrag}
      onLostPointerCapture={stopDrag}
      onKeyDown={onKeyDown}
    >
      <span className={styles.thread} aria-hidden="true" />
      <span ref={beadRef} className={styles.bead} aria-hidden="true" />
    </div>
  );
}
