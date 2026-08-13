/**
 * Simple line icons.
 *
 * Deliberately non-clinical — no stethoscopes, syringes or cross symbols.
 * Medical iconography reads as intimidating to the audience this site is for
 * (Spec Section 7). All icons are decorative and hidden from screen readers;
 * the adjacent heading always carries the meaning.
 */
import type { ReactElement, SVGProps } from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
} as const;

export type IconName =
  | "chat"
  | "shield"
  | "handshake"
  | "check"
  | "clock"
  | "eye"
  | "lock"
  | "heart";

function Chat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.6-.7L3 21l1.9-4.9A8.3 8.3 0 0 1 3.6 11.5 8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z" />
    </svg>
  );
}

function Shield(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 22s8-4 8-10V5.5L12 2 4 5.5V12c0 6 8 10 8 10z" />
    </svg>
  );
}

function Handshake(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21a8.5 8.5 0 0 0 8.5-8.5c0-4.7-3.8-8.5-8.5-8.5S3.5 7.8 3.5 12.5" />
      <path d="M3.5 12.5 7 16l2.5-2.5L12 16l2.5-2.5" />
    </svg>
  );
}

function Check(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="m4 12.5 5 5L20 6.5" />
    </svg>
  );
}

function Clock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </svg>
  );
}

function Eye(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function Lock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function Heart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20s-7.5-4.4-7.5-9.5A4.5 4.5 0 0 1 12 7.8a4.5 4.5 0 0 1 7.5 2.7C19.5 15.6 12 20 12 20z" />
    </svg>
  );
}

const ICONS: Record<
  IconName,
  (props: SVGProps<SVGSVGElement>) => ReactElement
> = {
  chat: Chat,
  shield: Shield,
  handshake: Handshake,
  check: Check,
  clock: Clock,
  eye: Eye,
  lock: Lock,
  heart: Heart,
};

export function Icon({
  name,
  className = "h-7 w-7",
}: {
  name: IconName;
  className?: string;
}) {
  const Component = ICONS[name];
  return <Component className={className} />;
}
