"use client";

/**
 * Portrait adaptation of the supplied depth-card/tw. Retains interpolated 3D
 * rotation, image translation and spotlight; uses Next Image, intrinsic
 * sizing, and an event-driven RAF rather than an always-running render loop.
 */
import Image from "next/image";
import { useEffect, useRef, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

interface DepthCardProps {
  image: string;
  imageAlt: string;
  title: string;
  description?: string;
  maxRotation?: number;
  maxTranslation?: number;
  className?: string;
  active?: boolean;
}

export default function DepthCard({
  image,
  imageAlt,
  title,
  description,
  maxRotation = 8,
  maxTranslation = 10,
  className,
  active = true,
}: DepthCardProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const current = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!active) {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      current.current = { x: 0, y: 0 };
      target.current = { x: 0, y: 0 };
      if (innerRef.current) innerRef.current.style.transform = "none";
      if (imageRef.current) imageRef.current.style.transform = "scale(1.08)";
      if (spotlightRef.current) spotlightRef.current.style.opacity = "0";
    }
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [active]);

  function animate() {
    const point = current.current;
    const goal = target.current;
    point.x += (goal.x - point.x) * 0.13;
    point.y += (goal.y - point.y) * 0.13;
    if (innerRef.current)
      innerRef.current.style.transform = `rotateX(${-point.y * maxRotation}deg) rotateY(${point.x * maxRotation}deg)`;
    if (imageRef.current)
      imageRef.current.style.transform = `translate3d(${-point.x * maxTranslation}px, ${-point.y * maxTranslation}px, 0) scale(1.08)`;
    if (Math.abs(goal.x - point.x) + Math.abs(goal.y - point.y) > 0.001)
      frame.current = requestAnimationFrame(animate);
    else frame.current = null;
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!active || event.pointerType === "touch") return;
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    target.current = {
      x: (x / box.width) * 2 - 1,
      y: (y / box.height) * 2 - 1,
    };
    const spotlight = spotlightRef.current;
    if (spotlight) {
      spotlight.style.background = `radial-gradient(450px circle at ${x}px ${y}px, rgb(255 255 255 / 0.22), transparent 70%)`;
      spotlight.style.opacity = "1";
    }
    if (frame.current === null) frame.current = requestAnimationFrame(animate);
  }

  function leave() {
    target.current = { x: 0, y: 0 };
    if (spotlightRef.current) spotlightRef.current.style.opacity = "0";
    if (active && frame.current === null)
      frame.current = requestAnimationFrame(animate);
  }

  return (
    <div
      className={cn("relative w-full [perspective:1100px]", className)}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <div
        ref={innerRef}
        className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-card shadow-sm [backface-visibility:hidden] [transform-style:preserve-3d]"
      >
        <div ref={imageRef} className="absolute inset-0 scale-[1.08]">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 38vw, 90vw"
            className="object-cover"
          />
        </div>
        <div
          ref={spotlightRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200"
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-zinc-950/90 via-zinc-950/60 to-transparent px-6 pb-6 pt-20">
          <p className="font-display text-2xl font-medium tracking-tight text-white">
            {title}
          </p>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-zinc-200">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
