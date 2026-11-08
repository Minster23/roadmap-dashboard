import { expect, test } from "bun:test";
import { CAMERAS, countByLevel, formatClock, mockAlerts, timeBounds, toPercent } from "./mock";

const HOUR = 60 * 60_000;
const NOW = Date.parse("2026-11-08T12:00:00.000Z");

test("mockAlerts returns deterministic, in-window alerts with all fields", () => {
  const a = mockAlerts(CAMERAS, NOW);
  const b = mockAlerts(CAMERAS, NOW);
  expect(a).toEqual(b);
  expect(a.length).toBeGreaterThan(0);

  const cameraIds = new Set(CAMERAS.map((c) => c.id));
  for (const alert of a) {
    expect(alert.image).toStartWith("data:image/svg+xml");
    expect(alert.location.length).toBeGreaterThan(0);
    expect(cameraIds.has(alert.cameraId)).toBe(true);
    const t = Date.parse(alert.timestamp);
    expect(t).toBeGreaterThanOrEqual(NOW - HOUR);
    expect(t).toBeLessThanOrEqual(NOW);
  }
});

test("timeBounds falls back to a one hour window on empty input", () => {
  const { start, end } = timeBounds([]);
  expect(end - start).toBe(HOUR);
});

test("toPercent maps window edges and clamps outliers", () => {
  const start = 1_000;
  const end = 2_000;
  expect(toPercent(new Date(start).toISOString(), start, end)).toBe(0);
  expect(toPercent(new Date(end).toISOString(), start, end)).toBe(100);
  expect(toPercent(new Date(1_500).toISOString(), start, end)).toBe(50);
  expect(toPercent(new Date(0).toISOString(), start, end)).toBe(0);
  expect(toPercent(new Date(9_999).toISOString(), start, end)).toBe(100);
  expect(toPercent(new Date(start).toISOString(), 5, 5)).toBe(0);
});

test("countByLevel sums to the alert count", () => {
  const alerts = mockAlerts(CAMERAS, NOW);
  const counts = countByLevel(alerts);
  expect(counts.critical + counts.warning + counts.info).toBe(alerts.length);
});

test("formatClock produces an HH:MM clock", () => {
  expect(formatClock("2026-11-08T12:34:00.000Z")).toMatch(/^\d{2}:\d{2}$/);
});
