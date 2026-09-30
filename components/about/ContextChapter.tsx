"use client";

import { GraduationCap, MapPin } from "lucide-react";
import AboutChapter, {
  AboutChapterLabel,
} from "@/components/about/AboutChapter";
import DepthCard from "@/components/react-bits/depth-card";
import {
  useAboutCompactViewport,
  useAboutInView,
  useAboutMotionAllowed,
} from "@/components/about/use-about-environment";
import { ABOUT_MEDIA } from "@/lib/about-data";
import { PROFILE } from "@/lib/profile-data";
import styles from "@/app/about/about.module.css";

/** Chapter 03 — the person behind the projects. No backdrop by request. */
export default function ContextChapter() {
  const compact = useAboutCompactViewport();
  const { allowed } = useAboutMotionAllowed();
  const { ref, visible } = useAboutInView<HTMLElement>();

  return (
    <AboutChapter id="about-context">
      <div className={styles.contextColumn}>
        <div>
          <AboutChapterLabel number="03">
            Professional context
          </AboutChapterLabel>
          <h2 id="about-context-title" className={styles.display}>
            The person
            <br />
            behind the projects.
          </h2>
          <div className={styles.prose}>
            <p>
              I am a mechanical and mechatronics engineer based in Kandy, Sri
              Lanka, currently reading for a BSc (Hons) in Mechatronics
              Engineering at The Open University of Sri Lanka. My technical
              foundation also includes the National Certificate in Engineering
              Draftsmanship from Technical College, Pathadumbara.
            </p>
            <p>
              As a trainee draughtsperson at the Department of Engineering
              Services, I worked on CAD drawings and schematics for public
              building projects, collaborated with engineers, and assisted with
              site inspections and field verification. That experience connected
              the drawing process to the conditions a design has to meet on
              site.
            </p>
            <p>
              My experience in banking and retail also involved working directly
              with customers and responding to their questions. Alongside my
              studies, my interests include automation, bio-inspired robotics,
              autonomous navigation, renewable energy systems and machine
              vision. This site is where I collect projects and technical notes
              as that work develops.
            </p>
          </div>
          <div className={styles.contextNotes}>
            <p className="flex items-center gap-2">
              <MapPin
                className="size-4 text-primary"
                strokeWidth={1.5}
                aria-hidden
              />
              {PROFILE.location}
            </p>
            <p className="flex items-center gap-2">
              <GraduationCap
                className="size-4 text-primary"
                strokeWidth={1.5}
                aria-hidden
              />
              Mechatronics undergraduate
            </p>
          </div>
        </div>

        <figure ref={ref} className={styles.portraitFigure}>
          <DepthCard
            image={ABOUT_MEDIA.portrait}
            imageAlt={ABOUT_MEDIA.portraitAlt}
            title={`${PROFILE.firstName} ${PROFILE.lastName}`}
            description={PROFILE.location}
            active={allowed && visible && !compact}
          />
          <figcaption className="mt-3 flex items-center justify-between gap-4 border-t border-border pt-3 text-xs text-ink-soft">
            <span>Mechanical + Mechatronics</span>
            <span className="font-mono">{PROFILE.timezone}</span>
          </figcaption>
        </figure>
      </div>
    </AboutChapter>
  );
}
