import type { Alert, AlertLevel, Camera } from "../types";
import { CAMERAS, placeholderImage } from "./mock";

/** Event codes the detector emits today, with their display text and severity. */
const EVENTS: Record<string, { label: string; level: AlertLevel }> = {
  speeding: { label: "Speeding", level: "warning" },
  helmet_off: { label: "Helmet off", level: "warning" },
  wrong_lane: { label: "Wrong lane", level: "warning" },
  collision: { label: "Collision", level: "critical" },
  pedestrian: { label: "Pedestrian on road", level: "critical" },
  stopped: { label: "Vehicle stopped", level: "info" },
};

/** One detection as the backend sends it. */
export interface Detection {
  event: string;
  /** ISO-8601. */
  time: string;
  /** Object class, e.g. "car", "motorcycle". */
  label: string;
  /** 0..1. */
  confidence: number;
  /** [x1, y1, x2, y2]. */
  bbox: [number, number, number, number];
}

/** Payload pushed per frame: one camera, its detections. */
export interface DetectionRequest {
  /** Camera id the detector sees. */
  Camera: string;
  detection: Detection[];
}

/** Bbox coordinates are normalized to a 1000x1000 frame until the stream reports its size. */
const BBOX_UNIT = 1000;

/** Object classes whose riders are expected to wear a helmet. */
const HELMET_CLASSES: Record<string, true> = { motorcycle: true, motorbike: true };

/** Detections below this are noise; keep only what a human should look at. */
const MIN_CONFIDENCE = 0.5;

/** Normalizes the wire event code; unknown codes stay readable instead of disappearing. */
function toEvent(event: string): { label: string; level: AlertLevel } {
  const key = event.trim().toLowerCase();
  return EVENTS[key] ?? { label: key.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase()), level: "info" };
}

/**
 * Converts one pushed frame into alerts.
 * Ids are stable per camera + timestamp so a re-delivered frame does not duplicate rows.
 */
export function detectionsToAlerts(payload: DetectionRequest): Alert[] {
  const cameraId = payload.Camera;
  const location = CAMERAS.find((camera) => camera.id.toLowerCase() === cameraId.toLowerCase())?.location ?? cameraId;
  return payload.detection
    .filter((d) => d.confidence >= MIN_CONFIDENCE)
    .map((d) => {
      const event = toEvent(d.event);
      const kind = d.label.toLowerCase().replace(/_/g, " ");
      // A helmet violation labelled on a motorcycle still names the class in the alert text.
      const label =
        d.event.toLowerCase() === "helmet_off" && HELMET_CLASSES[kind]
          ? `${event.label} (${kind})`
          : event.label;
      const [x1, y1] = d.bbox;
      return {
        id: `${cameraId}-${d.time}`,
        timestamp: d.time,
        image: overlayImage(
          // ponytail: snapshot is composed in the browser until the API returns real stills
          placeholderImage(`${kind.toUpperCase()} ${Math.round(d.confidence * 100)}%`),
          d.bbox,
        ),
        location,
        level: event.level,
        label,
        cameraId,
        confidence: d.confidence,
        bbox: [x1 / BBOX_UNIT, y1 / BBOX_UNIT, d.bbox[2] / BBOX_UNIT, d.bbox[3] / BBOX_UNIT],
      } satisfies Alert;
    });
}

/** Draws the detection box over the placeholder snapshot so the row carries its evidence. */
function overlayImage(base: string, box: [number, number, number, number]): string {
  const [x1, y1, x2, y2] = box;
  const svg = decodeURIComponent(base.slice(base.indexOf(",") + 1)).replace(
    "</svg>",
    `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" fill="none" stroke="#f5b83d" stroke-width="3"/></svg>`,
  );
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Folds new alerts into a list, newest wins on id, cap keeps the timeline to an hour's worth. */
export function mergeAlerts(existing: Alert[], incoming: Alert[], cap = 300): Alert[] {
  const byId = new Map(existing.map((alert) => [alert.id, alert]));
  for (const alert of incoming) byId.set(alert.id, alert);
  return [...byId.values()]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, cap);
}

/** Device record format from API /v1/dashboard/devices. */
export interface DeviceRecord {
  id: string;
  name: string;
  location?: string;
  active?: boolean;
  status?: "online" | "offline";
}

/** Parses camera list whether returned as Camera[] or { devices: [...] }. */
export function parseCameras(data: unknown): Camera[] | null {
  if (Array.isArray(data)) {
    return data as Camera[];
  }
  if (data && typeof data === "object" && "devices" in data && Array.isArray((data as { devices: unknown }).devices)) {
    return ((data as { devices: Array<Record<string, unknown>> }).devices).map((d) => {
      const id = String(d.id ?? d.name ?? "cam");
      const name = String(d.name ?? id);
      const location = String(d.location ?? name);
      const isOnline = d.active === true || d.status === "online";
      return {
        id,
        name,
        location,
        streamUrl: placeholderImage(name.toUpperCase()),
        status: isOnline ? "online" : "offline",
      };
    });
  }
  return null;
}
/** Ensures a camera referenced by detections exists in the list, so its row can render. */
export function ensureCamera(cameras: Camera[], payload: DetectionRequest): Camera[] {
  if (cameras.some((camera) => camera.id === payload.Camera)) return cameras;
  return [
    ...cameras,
    {
      id: payload.Camera,
      name: payload.Camera,
      location: payload.Camera,
      streamUrl: placeholderImage(payload.Camera.toUpperCase()),
      status: "online",
    },
  ];
}
