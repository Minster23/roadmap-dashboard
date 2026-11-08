import type { Alert, AlertLevel, Camera } from "../types";

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

/** Counts alerts per level; used by the summary strip. */
export function countByLevel(alerts: Alert[]): Record<AlertLevel, number> {
  const counts: Record<AlertLevel, number> = { critical: 0, warning: 0, info: 0 };
  for (const alert of alerts) counts[alert.level] += 1;
  return counts;
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

/** Deterministic pseudo-random generator so mock data is stable across reloads. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Mock camera list used until a real API is wired. */
export const CAMERAS: Camera[] = [
  { id: "cam-01", name: "KM 4 — Sudirman", location: "Jl. Sudirman KM 4, Jakarta", streamUrl: placeholderImage("CAM-01"), status: "online" },
  { id: "cam-02", name: "KM 12 — Tol Dalam", location: "Tol Dalam Kota KM 12, Jakarta", streamUrl: placeholderImage("CAM-02"), status: "online" },
  { id: "cam-03", name: "Simpang Semanggi", location: "Simpang Semanggi, Jakarta", streamUrl: placeholderImage("CAM-03"), status: "online" },
  { id: "cam-04", name: "KM 27 — Cikunir", location: "Jl. Tol JORR KM 27, Bekasi", streamUrl: placeholderImage("CAM-04"), status: "offline" },
  { id: "cam-05", name: "Gerbang Cikarang", location: "Gerbang Tol Cikarang Utama", streamUrl: placeholderImage("CAM-05"), status: "online" },
];

const LABELS: Array<{ label: string; level: AlertLevel }> = [
  { label: "Speeding", level: "warning" },
  { label: "Wrong lane", level: "warning" },
  { label: "Collision", level: "critical" },
  { label: "Pedestrian on road", level: "critical" },
  { label: "Vehicle stopped", level: "info" },
  { label: "Plate unreadable", level: "info" },
  { label: "Tailgating", level: "warning" },
];

/** Builds a deterministic hour of mock alerts ending at `now`. */
export function mockAlerts(cameras: Camera[], now = Date.now()): Alert[] {
  const random = seeded(42);
  const windowMs = 60 * 60_000;
  return Array.from({ length: 26 }, (_, i) => {
    const camera = cameras[Math.floor(random() * cameras.length)];
    const pick = LABELS[Math.floor(random() * LABELS.length)];
    const timestamp = new Date(now - windowMs + (windowMs * (i + random())) / 26).toISOString();
    return {
      id: `alert-${String(i + 1).padStart(3, "0")}`,
      timestamp,
      image: placeholderImage(pick.label.toUpperCase()),
      location: camera.location,
      level: pick.level,
      label: pick.label,
      cameraId: camera.id,
    };
  });
}
