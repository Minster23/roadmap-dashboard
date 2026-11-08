import { expect, test } from "bun:test";
import { detectionsToAlerts, ensureCamera, mergeAlerts, type DetectionRequest } from "./api";
import { CAMERAS } from "./mock";

/** Mirrors examples/exampleReq.json. */
const payload: DetectionRequest = {
  Camera: "CAM-JKT-01",
  detection: [
    { event: "speeding", time: "2026-11-08T10:15:30.000Z", label: "car", confidence: 0.94, bbox: [120, 340, 480, 610] },
    { event: "helmet_off", time: "2026-11-08T10:15:31.500Z", label: "motorcycle", confidence: 0.87, bbox: [300, 500, 420, 700] },
  ],
};

test("detectionsToAlerts maps the wire payload to alerts", () => {
  const alerts = detectionsToAlerts(payload);
  expect(alerts.map((a) => a.id)).toEqual([
    "CAM-JKT-01-2026-11-08T10:15:30.000Z",
    "CAM-JKT-01-2026-11-08T10:15:31.500Z",
  ]);
  const [speeding, helmet] = alerts;
  expect(speeding.label).toBe("Speeding");
  expect(speeding.level).toBe("warning");
  expect(speeding.cameraId).toBe("CAM-JKT-01");
  expect(speeding.confidence).toBe(0.94);
  expect(speeding.bbox).toEqual([0.12, 0.34, 0.48, 0.61]);
  expect(decodeURIComponent(speeding.image)).toContain("<rect x=\"120\" y=\"340\" width=\"360\" height=\"270\"");
  expect(helmet.label).toBe("Helmet off (motorcycle)");
});

test("low-confidence detections are dropped", () => {
  const alerts = detectionsToAlerts({
    Camera: "CAM-JKT-01",
    detection: [{ event: "speeding", time: "2026-11-08T10:15:30.000Z", label: "car", confidence: 0.2, bbox: [0, 0, 1, 1] }],
  });
  expect(alerts).toHaveLength(0);
});

test("unknown event codes stay visible as info", () => {
  const [alert] = detectionsToAlerts({
    Camera: "CAM-JKT-01",
    detection: [{ event: "u_turn", time: "2026-11-08T10:15:30.000Z", label: "car", confidence: 0.9, bbox: [0, 0, 10, 10] }],
  });
  expect(alert.label).toBe("U turn");
  expect(alert.level).toBe("info");
});

test("mergeAlerts dedupes by id and sorts newest first", () => {
  const alerts = detectionsToAlerts(payload);
  const merged = mergeAlerts([], [...alerts, ...alerts]);
  expect(merged).toHaveLength(2);
  expect(merged[0].timestamp).toBe("2026-11-08T10:15:31.500Z");
  expect(mergeAlerts(merged, [], 1)).toHaveLength(1);
});

test("ensureCamera registers an unknown camera once", () => {
  const cameras = ensureCamera(CAMERAS, payload);
  expect(cameras).toHaveLength(CAMERAS.length + 1);
  expect(cameras.at(-1)?.id).toBe("CAM-JKT-01");
  expect(ensureCamera(cameras, payload)).toBe(cameras);
  expect(ensureCamera(CAMERAS, { Camera: CAMERAS[0].id, detection: [] })).toBe(CAMERAS);
});
