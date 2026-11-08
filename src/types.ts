/** Severity of a detection event. Drives color + badge in every view. */
export type AlertLevel = "critical" | "warning" | "info";

/** One detection produced by a camera at a point in time. */
export interface Alert {
  id: string;
  /** ISO-8601 timestamp of the detection. */
  timestamp: string;
  /** Snapshot image URL (or data URL for mock data). */
  image: string;
  /** Human-readable place, e.g. "Jl. Sudirman KM 4". */
  location: string;
  level: AlertLevel;
  /** Short label, e.g. "Speeding". */
  label: string;
  /** Camera that observed the alert. */
  cameraId: string;
  /** Detector score 0..1; absent on mock data. */
  confidence?: number;
  /** Detection box normalized to 0..1 of the frame; absent on mock data. */
  bbox?: [number, number, number, number];
}

/** A connected surveillance camera. */
export interface Camera {
  id: string;
  name: string;
  location: string;
  /** Stream snapshot URL shown in the viewport. */
  streamUrl: string;
  status: "online" | "offline";
}
