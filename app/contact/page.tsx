import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Github,
  Linkedin,
  Mail,
  MessageSquareText,
} from "lucide-react";
import { siteConfig } from "@/lib/config";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch about engineering work, collaborations, corrections and questions.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12 md:px-12 md:pt-20">
      <div className="border-b border-border pb-12">
        <p className="font-mono text-[11px] uppercase tracking-[.2em] text-primary">
          Contact / Open channel
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.8rem,6vw,5rem)] font-semibold leading-none tracking-[-.055em] text-ink">
          Let’s talk about <span className="text-primary">the work.</span>
        </h1>
        <p className="mt-6 max-w-[66ch] text-base leading-8 text-ink-soft">
          Have a project in mind, a technical question or a correction to the
          archive? Send a note. Useful context and specific details make it
          easier to respond well.
        </p>
      </div>
      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(260px,.7fr)_minmax(0,1.3fr)] lg:gap-16">
        <aside className="space-y-9 lg:sticky lg:top-24">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">
              01 / Direct lines
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
              Choose your channel.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-7 text-ink-soft">
              The form sends directly to a private Telegram bot. If you would
              rather use your own email app or social profile, use a link below.
            </p>
          </div>
          <div className="divide-y divide-border rounded-xl border border-border bg-card px-5">
            {[
              {
                label: "Email",
                href: `mailto:${siteConfig.email}`,
                value: siteConfig.email,
                icon: Mail,
              },
              {
                label: "GitHub",
                href: siteConfig.socialLinks.github,
                value: "Engineering work & source",
                icon: Github,
              },
              {
                label: "LinkedIn",
                href: siteConfig.socialLinks.linkedin,
                value: "Professional enquiries",
                icon: Linkedin,
              },
            ].map(({ label, href, value, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel={
                  href.startsWith("mailto:") ? undefined : "noopener noreferrer"
                }
                className="group flex items-center gap-3 py-4"
              >
                <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">
                    {label}
                  </span>
                  <span className="block truncate text-xs text-ink-soft">
                    {value}
                  </span>
                </span>
                <ArrowUpRight
                  className="size-4 text-ink-soft transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </a>
            ))}
          </div>
          <div className="border-l-2 border-primary pl-4 text-xs leading-6 text-ink-soft">
            For a question about a specific article or build, its{" "}
            <Link
              href="/projects"
              className="font-semibold text-primary underline underline-offset-2"
            >
              project page
            </Link>{" "}
            may be the best place to leave a public comment. Use this form for
            private enquiries.
          </div>
        </aside>
        <section aria-labelledby="contact-form-heading">
          <div className="mb-5 flex items-center gap-3">
            <MessageSquareText className="size-5 text-primary" aria-hidden />
            <h2
              id="contact-form-heading"
              className="font-display text-2xl font-semibold text-ink"
            >
              Send a private message
            </h2>
          </div>
          <ContactForm />
        </section>
      </div>
    </main>
  );
}
