"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import logoMark from "@/public/logo-mark.png";

export type ConversationTurn = {
  from: string;
  text: string;
};

/**
 * Smartphone mockup showing a sample SafeSiso conversation.
 *
 * The conversation is invented, on-brand copy. It must NEVER be a real girl's
 * chat (Spec 6.1), and the caption says so on the page rather than only in a
 * code comment — because a realistic WhatsApp screenshot on a site that
 * promises conversations are never published would otherwise quietly
 * contradict the strongest promise this site makes.
 *
 * ACCESSIBILITY
 * -------------
 * It is a <figure> with a real caption, a screen-reader-only description, and
 * a semantic list. Each turn is prefixed with a hidden speaker label, because
 * bubble alignment and colour are the only things distinguishing the girl from
 * SafeSiso, and neither reaches a screen reader.
 *
 * Timestamps and read ticks are decorative — invented, not content — so they
 * are hidden from assistive technology rather than read out as facts.
 *
 * THE ANIMATION, AND WHY IT WORKS THIS WAY
 * ----------------------------------------
 * The turns are server-rendered visible. On mount the component asks whether
 * it is already on screen:
 *
 *   already visible  → leave it alone. Animating something the reader is
 *                      looking at just makes text jump.
 *   off screen       → hide the turns and reveal them one at a time when the
 *                      reader scrolls down to it.
 *
 * So the conversation is never hidden from someone who can already see it, and
 * never hidden at all if JavaScript fails to load — which on a cheap Android
 * phone on a bad connection is a real Tuesday, not an edge case.
 *
 * It plays ONCE. An indefinite loop would fail WCAG 2.2.2 (Pause, Stop, Hide),
 * which requires that anything auto-updating for more than five seconds can be
 * stopped. It is also just distracting next to body copy.
 *
 * `prefers-reduced-motion` is honoured twice over: this component skips the
 * animation entirely, and globals.css neutralises it as a backstop.
 */
export function PhoneConversation({
  turns,
  label,
  disclaimer,
  speakerLabels,
}: {
  turns: readonly ConversationTurn[];
  label: string;
  disclaimer: string;
  /** Visually hidden "You:" / "SafeSiso:" prefixes. */
  speakerLabels: { girl: string; safesiso: string };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"static" | "pending" | "playing">(
    "static",
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced || !("IntersectionObserver" in window)) return;

    // Already on screen: do nothing at all. No flash, no jump.
    const box = node.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;

    setPhase("pending");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setPhase("playing");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Invented, and marked decorative. Kept out of the message catalogue so a
  // translator is never asked to localise a fake clock.
  //
  // NOTE ON THE GREYS: the timestamps and the composer placeholder are darker
  // than WhatsApp's real ones (70% rather than ~45%). Real WhatsApp puts them
  // around 2.7:1, which fails WCAG 1.4.3. They are arguably exempt as
  // incidental text inside an illustration, but axe and Lighthouse measure
  // text nodes regardless, and this project asserts accessibility at 100 as a
  // CI error rather than a warning. 70% measures 5.5:1 and 4.6:1. It is also
  // simply easier to read on a cheap screen in daylight, which is the
  // condition most of this audience will see it in. Please do not "restore"
  // the authentic lighter grey.
  const times = ["9:12", "9:12", "9:13", "9:13", "9:14", "9:14", "9:14"];

  return (
    <figure className="mx-auto w-full max-w-[20rem]">
      <div
        ref={ref}
        data-chat-phase={phase}
        className="overflow-hidden rounded-[2.25rem] border-[6px] border-teal-900 bg-teal-900 shadow-xl"
      >
        {/* Chat header. Decorative chrome: the page already says whose site
            this is, so repeating it to a screen reader adds nothing. */}
        <div
          aria-hidden="true"
          className="flex items-center gap-2.5 bg-teal-600 px-3 py-2.5"
        >
          <span className="inline-flex shrink-0 rounded-full bg-cream-100 p-1">
            <Image
              src={logoMark}
              alt=""
              sizes="28px"
              className="h-5 w-5"
              aria-hidden="true"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold leading-tight text-white">
              SafeSiso
            </span>
            <span className="block text-[0.68rem] leading-tight text-cream-200">
              online
            </span>
          </span>
        </div>

        <div className="chat-wallpaper px-2.5 py-3">
          <p className="sr-only">{label}</p>
          <ul className="space-y-1.5">
            {turns.map((turn, index) => {
              const isGirl = turn.from === "girl";
              const previous = turns[index - 1];
              const startsGroup = !previous || previous.from !== turn.from;

              return (
                <li
                  key={index}
                  style={{ "--turn-index": index } as React.CSSProperties}
                  className={`chat-turn flex ${isGirl ? "justify-end" : "justify-start"}`}
                >
                  <span
                    className={[
                      "relative max-w-[85%] rounded-lg px-2.5 pb-4 pt-1.5 text-[0.84rem] leading-snug text-teal-900 shadow-sm",
                      isGirl ? "bg-[#DCF8C6]" : "bg-white",
                      // The tail only belongs on the first bubble of a run,
                      // which is how WhatsApp itself draws it.
                      startsGroup
                        ? isGirl
                          ? "chat-bubble-out rounded-tr-none"
                          : "chat-bubble-in rounded-tl-none"
                        : "",
                    ].join(" ")}
                  >
                    <span className="sr-only">
                      {isGirl
                        ? speakerLabels.girl
                        : speakerLabels.safesiso}{" "}
                    </span>
                    {turn.text}
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 right-2 flex items-center gap-0.5 text-[0.6rem] leading-none text-teal-900/70"
                    >
                      {times[index] ?? "9:14"}
                      {isGirl ? (
                        <svg
                          viewBox="0 0 17 11"
                          fill="none"
                          stroke="#53BDEB"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-2.5 w-3.5"
                        >
                          <path d="M1 6.1 3.9 9 9.8 1.9" />
                          <path d="M6.6 6.3 8.9 8.7 15.9 1.6" />
                        </svg>
                      ) : null}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Composer. Pure chrome — it does nothing and says so. */}
        <div
          aria-hidden="true"
          className="flex items-center gap-2 bg-cream-200 px-2.5 py-2"
        >
          <span className="flex-1 rounded-full bg-white px-3 py-1.5 text-[0.72rem] text-teal-700/70">
            Message
          </span>
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <rect x="9" y="2.6" width="6" height="11" rx="3" />
              <path d="M5.4 11.4a6.6 6.6 0 0 0 13.2 0M12 18v3.4" />
            </svg>
          </span>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-sm text-teal-700">
        {disclaimer}
      </figcaption>
    </figure>
  );
}
