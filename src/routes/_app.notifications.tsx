import { createFileRoute } from "@tanstack/react-router";
import { Bell, Inbox } from "lucide-react";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Jambo PMS" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const notifications: unknown[] = [];

  if (notifications.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center pt-24 text-center">
        <div className="relative mb-8 animate-float-slow">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* Bell body */}
            <path
              d="M100 32c-22 0-40 18-40 40v28l-12 20c-4 6 0 14 7 14h90c7 0 11-8 7-14l-12-20V72c0-22-18-40-40-40z"
              fill="oklch(0.62 0.18 264 / 0.12)"
              stroke="oklch(0.49 0.18 264 / 0.25)"
              strokeWidth="2.5"
            />
            {/* Bell top knob */}
            <circle
              cx="100"
              cy="32"
              r="6"
              fill="oklch(0.62 0.18 264 / 0.12)"
              stroke="oklch(0.49 0.18 264 / 0.25)"
              strokeWidth="2.5"
            />
            {/* Bell bottom rim */}
            <ellipse
              cx="100"
              cy="142"
              rx="32"
              ry="6"
              fill="oklch(0.62 0.18 264 / 0.08)"
              stroke="oklch(0.49 0.18 264 / 0.2)"
              strokeWidth="2.5"
            />
            {/* Eyes */}
            <ellipse cx="85" cy="88" rx="5" ry="6" fill="oklch(0.49 0.18 264)" />
            <ellipse cx="115" cy="88" rx="5" ry="6" fill="oklch(0.49 0.18 264)" />
            {/* Eye shine */}
            <ellipse cx="87" cy="86" rx="2" ry="2.5" fill="white" opacity="0.7" />
            <ellipse cx="117" cy="86" rx="2" ry="2.5" fill="white" opacity="0.7" />
            {/* Wavy closed sleepy eyes */}
            <path
              d="M80 92 Q85 88 90 92"
              stroke="oklch(0.49 0.18 264)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                values="0;0;1;1;0;0"
                dur="4s"
                repeatCount="indefinite"
              />
            </path>
            <path
              d="M110 92 Q115 88 120 92"
              stroke="oklch(0.49 0.18 264)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                values="0;0;1;1;0;0"
                dur="4s"
                repeatCount="indefinite"
              />
            </path>
            {/* Blush */}
            <ellipse cx="78" cy="98" rx="6" ry="3" fill="oklch(0.74 0.16 70 / 0.15)" />
            <ellipse cx="122" cy="98" rx="6" ry="3" fill="oklch(0.74 0.16 70 / 0.15)" />
            {/* Mouth - slight smile */}
            <path
              d="M93 108 Q100 114 107 108"
              stroke="oklch(0.49 0.18 264 / 0.6)"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            {/* Sound waves */}
            <g opacity="0.2">
              <path
                d="M140 68 Q148 78 140 88"
                stroke="oklch(0.49 0.18 264)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              >
                <animate
                  attributeName="opacity"
                  values="0.3;0.1;0.3"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
              <path
                d="M152 60 Q162 78 152 96"
                stroke="oklch(0.49 0.18 264)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              >
                <animate
                  attributeName="opacity"
                  values="0.2;0;0.2"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
            {/* Zzz */}
            <text
              x="130"
              y="50"
              fill="oklch(0.49 0.18 264 / 0.4)"
              fontSize="14"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              <tspan x="130" dy="0">z</tspan>
              <tspan x="138" dy="-4">z</tspan>
              <tspan x="148" dy="-4">z</tspan>
            </text>
          </svg>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-foreground">No notifications yet</h2>
        <p className="mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground">
          You&apos;re all caught up! When something important happens — like a new booking,
          check-in alert, or maintenance request — you&apos;ll see it here.
        </p>

        <div className="flex items-center gap-6 rounded-xl border border-border bg-card px-6 py-4">
          <span className="rounded-lg bg-primary/10 p-2.5">
            <Inbox className="h-5 w-5 text-primary" />
          </span>
          <div className="text-left text-sm">
            <p className="font-medium text-foreground">Inbox quiet</p>
            <p className="text-xs text-muted-foreground">Notifications will appear in real-time</p>
          </div>
        </div>
      </div>
    );
  }

  return <div className="mx-auto max-w-3xl space-y-4 pt-6">{/* TODO: notification list */}</div>;
}
