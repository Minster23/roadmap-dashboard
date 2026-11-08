import type { Alert, AlertLevel } from "../types";

/** Palette per level, kept in one place so all views agree. Muted: severity is a tint, not a beacon. */
export const ALERT_COLORS: Record<AlertLevel, string> = {
  critical: "bg-alert/60",
  warning: "bg-warn/55",
  info: "bg-ok/45",
};

/** Text color per level for badges and legends. */
export const ALERT_TEXT_COLORS: Record<AlertLevel, string> = {
  critical: "text-alert",
  warning: "text-warn",
  info: "text-muted",
};

/** Returns the older/newer bounds of a list of ISO timestamps. */
export function timeBounds(alerts: Alert[]): { start: number; end: number } {
  if (alerts.length === 0) {
    const now = Date.now();
    return { start: now - 60 * 60_000, end: now };
  }
  const times = alerts.map((a) => Date.parse(a.timestamp));
  return { start: Math.min(...times), end: Math.max(...times) };
}

/** Maps a timestamp into a 0..100 percentage across the window. */
export function toPercent(timestamp: string, start: number, end: number): number {
  if (end <= start) return 0;
  const ratio = (Date.parse(timestamp) - start) / (end - start);
  return Math.min(100, Math.max(0, ratio * 100));
}

/** Locale pinned so clocks render identically on every machine. */
const LOCALE = "en-GB";

/** Formats an ISO timestamp as a local HH:MM clock value. */
export function formatClock(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Formats an ISO timestamp as a local date + clock pair. */
export function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString(LOCALE, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Placeholder snapshot picture: gray grid with a centered label, no external asset. */
export function placeholderImage(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
    <rect width="640" height="360" fill="#1b1d21"/>
    <g stroke="#33373d" stroke-width="1">
      ${Array.from({ length: 7 }, (_, i) => `<line x1="${i * 106}" y1="0" x2="${i * 106}" y2="360"/>`).join("")}
      ${Array.from({ length: 4 }, (_, i) => `<line x1="0" y1="${i * 120}" x2="640" y2="${i * 120}"/>`).join("")}
    </g>
    <text x="320" y="190" fill="#8b929c" font-family="monospace" font-size="18" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
