"use client";

/**
 * Adapted from the supplied CardSwap-TS-TW. The original GSAP drop/promote/
 * return sequence is retained, with scoped cleanup and a readable small-screen
 * and reduced-motion layout instead of scaling cards beyond the viewport.
 */
import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import styles from "@/components/react-bits/card-swap.module.css";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function CardFrame(
  { customClass, className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      data-about-card
      className={cn(styles.cardContent, customClass, className)}
    />
  );
});

interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  skewAmount?: number;
  easing?: "linear" | "elastic";
  enabled?: boolean;
  staticLayout?: boolean;
  className?: string;
  children: ReactNode;
}

function placeCard(
  node: HTMLDivElement,
  index: number,
  count: number,
  distance: number,
  vertical: number,
  skew: number,
) {
  gsap.set(node, {
    x: index * distance,
    y: -index * vertical,
    z: -index * distance * 1.5,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    zIndex: count - index,
    transformOrigin: "center center",
    force3D: true,
  });
}

export default function CardSwap({
  width = "100%",
  height = 350,
  cardDistance = 30,
  verticalDistance = 30,
  delay = 6000,
  pauseOnHover = true,
  skewAmount = 3,
  easing = "elastic",
  enabled = true,
  staticLayout = false,
  className,
  children,
}: CardSwapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cards = Children.toArray(children).filter(isValidElement<CardProps>);
  const count = cards.length;

  useEffect(() => {
    const nodes = cardRefs.current.filter(
      (node): node is HTMLDivElement => node !== null,
    );
    if (staticLayout) {
      gsap.set(nodes, { clearProps: "transform,zIndex" });
      return;
    }
    nodes.forEach((node, index) =>
      placeCard(node, index, count, cardDistance, verticalDistance, skewAmount),
    );
    return () => {
      gsap.killTweensOf(nodes);
    };
  }, [count, cardDistance, verticalDistance, skewAmount, staticLayout]);

  useEffect(() => {
    const container = containerRef.current;
    const nodes = cardRefs.current.filter(
      (node): node is HTMLDivElement => node !== null,
    );
    if (
      !container ||
      !enabled ||
      staticLayout ||
      count < 2 ||
      nodes.length !== count
    )
      return;

    let order = nodes.map((_, index) => index);
    let timeline: gsap.core.Timeline | null = null;
    let timer: number | undefined;
    let hovering = false;
    let focused = false;
    const spring = easing === "elastic";
    const duration = spring ? 1.45 : 0.8;
    const ease = spring ? "elastic.out(0.6,0.9)" : "power1.inOut";

    const swap = () => {
      if (timeline?.isActive()) return;
      const [front, ...rest] = order;
      const frontNode = nodes[front];
      if (!frontNode) return;
      timeline = gsap.timeline();
      timeline.to(frontNode, { y: "+=460", duration, ease });
      timeline.addLabel("promote", `-=${duration * (spring ? 0.9 : 0.45)}`);
      rest.forEach((index, slot) => {
        timeline?.set(nodes[index], { zIndex: count - slot }, "promote");
        timeline?.to(
          nodes[index],
          {
            x: slot * cardDistance,
            y: -slot * verticalDistance,
            z: -slot * cardDistance * 1.5,
            duration,
            ease,
          },
          `promote+=${slot * 0.12}`,
        );
      });
      const back = count - 1;
      timeline.addLabel("return", `promote+=${duration * 0.1}`);
      timeline.set(frontNode, { zIndex: 1 }, "return");
      timeline.to(
        frontNode,
        {
          x: back * cardDistance,
          y: -back * verticalDistance,
          z: -back * cardDistance * 1.5,
          duration,
          ease,
        },
        "return",
      );
      timeline.call(() => {
        order = [...rest, front];
      });
    };

    const pause = () => {
      timeline?.pause();
      window.clearInterval(timer);
    };
    const resume = () => {
      if (hovering || focused) return;
      timeline?.resume();
      window.clearInterval(timer);
      timer = window.setInterval(swap, Math.max(delay, 3500));
    };
    const enter = () => {
      hovering = true;
      pause();
    };
    const leave = () => {
      hovering = false;
      resume();
    };
    const focus = () => {
      focused = true;
      pause();
    };
    const blur = (event: FocusEvent) => {
      if (
        event.relatedTarget instanceof Node &&
        container.contains(event.relatedTarget)
      )
        return;
      focused = false;
      resume();
    };

    nodes.forEach((node, index) =>
      placeCard(node, index, count, cardDistance, verticalDistance, skewAmount),
    );
    resume();
    if (pauseOnHover) {
      container.addEventListener("mouseenter", enter);
      container.addEventListener("mouseleave", leave);
    }
    container.addEventListener("focusin", focus);
    container.addEventListener("focusout", blur);
    return () => {
      window.clearInterval(timer);
      timeline?.kill();
      gsap.killTweensOf(nodes);
      container.removeEventListener("mouseenter", enter);
      container.removeEventListener("mouseleave", leave);
      container.removeEventListener("focusin", focus);
      container.removeEventListener("focusout", blur);
    };
  }, [
    enabled,
    staticLayout,
    count,
    delay,
    pauseOnHover,
    cardDistance,
    verticalDistance,
    skewAmount,
    easing,
  ]);

  return (
    <div
      ref={containerRef}
      data-static={staticLayout}
      className={cn(styles.stage, className)}
      style={{ height: staticLayout ? undefined : height }}
    >
      {cards.map((card, index) => (
        <div
          key={card.key ?? index}
          ref={(node) => {
            cardRefs.current[index] = node;
          }}
          className={styles.card}
          style={{ width, height: staticLayout ? undefined : height }}
        >
          {card}
        </div>
      ))}
    </div>
  );
}
