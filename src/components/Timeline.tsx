import { useMemo } from "react";
import { AlertTriangle, ChevronDown, CircleAlert, Info, ZoomIn, ZoomOut } from "lucide-react";
import type { Alert, AlertLevel } from "../types";
import { ALERT_COLORS, ALERT_TEXT_COLORS, countByLevel, formatClock, timeBounds, toPercent } from "../data/mock";

const ICONS: Record<AlertLevel, typeof Info> = {
  critical: CircleAlert,
  warning: AlertTriangle,
  info: Info,
};

const LEVELS: AlertLevel[] = ["critical", "warning", "info"];
const ROW_HEIGHT = 22;
const TRACK_HEIGHT = 10;

/** Zoom steps; 1 fits the window to the panel, higher values widen the axis (scroll to pan). */
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 8;

interface TimelineProps {
  alerts: Alert[];
  selectedId: string | null;
  /** Camera whose detections are expanded. Accordion: one at a time. */
  openCameraId: string | null;
  onToggleCamera: (cameraId: string) => void;
  onSelect: (alert: Alert) => void;
  /** Axis magnification, shared by every open panel. */
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

/** Five clock labels across a window. */
function axisTicks(start: number, end: number): string[] {
  return Array.from({ length: 5 }, (_, i) => formatClock(new Date(start + ((end - start) * i) / 4).toISOString()));
}

/**
 * Detections grouped per camera as a dropdown.
 * A closed row previews that camera's hour as a marker strip; opening it reveals
 * the camera's own axis, markers, and a detection list in its own scroll box —
 * one small frame shared by the axis, the track, and the rows, so the rest of
 * the timeline never moves.
 */
export function Timeline({
  alerts,
  selectedId,
  openCameraId,
  onToggleCamera,
  onSelect,
  zoom,
  onZoomChange,
}: TimelineProps) {
  const { start, end } = useMemo(() => timeBounds(alerts), [alerts]);
  const ticks = useMemo(() => axisTicks(start, end), [start, end]);
  const nowPercent = toPercent(new Date().toISOString(), start, end);
  // Width of the drawn axis: 100% at zoom 1, then a multiple that scrolls horizontally.
  const trackWidth = `${zoom * 100}%`;

  const groups = useMemo(() => {
    const byCamera = new Map<string, Alert[]>();
    for (const alert of alerts) byCamera.set(alert.cameraId, [...(byCamera.get(alert.cameraId) ?? []), alert]);
    return [...byCamera.entries()]
      .map(([cameraId, list]) => ({
        cameraId,
        list: [...list].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)),
        counts: countByLevel(list),
      }))
      .sort((a, b) => b.list.length - a.list.length);
  }, [alerts]);

  const total = countByLevel(alerts);

  /** Absolute marker buttons for one camera; `compact` is the collapsed preview strip. */
  const markers = (list: Alert[], compact: boolean) =>
    list.map((alert) => {
      const Icon = ICONS[alert.level];
      const active = alert.id === selectedId;
      return (
        <button
          key={alert.id}
          type="button"
          onClick={() => onSelect(alert)}
          title={`${alert.label} · ${alert.location} · ${formatClock(alert.timestamp)}`}
          aria-label={`${alert.label} at ${formatClock(alert.timestamp)}`}
          aria-pressed={active}
          className={`absolute flex items-center justify-center rounded-sm ${ALERT_COLORS[alert.level]} ${
            active ? "ring-2 ring-fg" : compact ? "opacity-60 hover:opacity-100" : "opacity-80 hover:opacity-100"
          }`}
          style={
            compact
              ? { left: `calc(${toPercent(alert.timestamp, start, end)}% - 1px)`, top: 0, bottom: 0, width: 3 }
              : {
                  left: `calc(${toPercent(alert.timestamp, start, end)}% - 3px)`,
                  top: (ROW_HEIGHT - TRACK_HEIGHT) / 2 - 5,
                  width: 7,
                  height: TRACK_HEIGHT + 10,
                }
          }
        >
          {!compact && <Icon size={8} className="text-panel" aria-hidden />}
        </button>
      );
    });

  const zoomButton = (Icon: typeof ZoomIn, next: number, label: string) => (
    <button
      type="button"
      className="btn px-1.5 py-1"
      onClick={() => onZoomChange(next)}
      disabled={next === zoom || next < ZOOM_MIN || next > ZOOM_MAX}
      aria-label={label}
      title={label}
    >
      <Icon size={13} />
    </button>
  );

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="Detection timeline">
      <header className="panel-header">
        <span>Detections · last hour</span>
        <span className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 normal-case tracking-normal sm:gap-x-3">
          {LEVELS.map((level) => (
            <span key={level} className={`flex items-center gap-1 ${ALERT_TEXT_COLORS[level]}`}>
              {total[level]} <span className="hidden sm:inline">{level}</span>
            </span>
          ))}
          <span className="flex shrink-0 items-center gap-1" role="group" aria-label="Timeline zoom">
            {zoomButton(ZoomOut, Math.max(ZOOM_MIN, zoom / 2), "Zoom out")}
            <span className="w-8 text-center font-mono text-[10px] text-fg">{zoom}×</span>
            {zoomButton(ZoomIn, Math.min(ZOOM_MAX, zoom * 2), "Zoom in")}
          </span>
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {groups.length === 0 && <p className="py-6 text-center text-xs text-muted">No detections in window</p>}

        {groups.map(({ cameraId, list, counts }) => {
          const open = cameraId === openCameraId;
          const panelId = `timeline-${cameraId}`;
          return (
            <div key={cameraId} className="border-b border-border last:border-b-0">
              <h3>
                <button
                  type="button"
                  onClick={() => onToggleCamera(cameraId)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className={`flex w-full items-center gap-2 px-2 py-2 text-left hover:bg-surface sm:px-3 ${open ? "bg-surface" : ""}`}
                >
                  <ChevronDown
                    size={13}
                    className={`shrink-0 text-muted transition-transform ${open ? "" : "-rotate-90"}`}
                    aria-hidden
                  />
                  <span className="w-[64px] shrink-0 truncate font-mono text-[10px] text-muted sm:w-[104px] sm:text-[11px]">
                    {cameraId.toUpperCase()}
                  </span>
                  <span className="relative h-3 min-w-0 flex-1 overflow-hidden rounded-sm bg-border/40">
                    {markers(list, true)}
                  </span>
                  <span className="hidden shrink-0 items-center gap-2 text-[10px] sm:flex">
                    {LEVELS.filter((level) => counts[level] > 0).map((level) => (
                      <span key={level} className={`font-mono ${ALERT_TEXT_COLORS[level]}`}>
                        {counts[level]}
                      </span>
                    ))}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-muted">{list.length}</span>
                </button>
              </h3>

              {/* Own scroll box: horizontal pan for the zoomed axis, vertical for the detection list.
                  Overscroll is contained so neither wheel nor touch chains to the timeline behind it. */}
              <div
                id={panelId}
                className={
                  open
                    ? "max-h-56 overflow-auto overscroll-contain border-t border-border/60 px-2 pb-2 sm:px-3"
                    : "hidden"
                }
              >
                <div style={{ width: trackWidth }} className="min-w-full">
                  <div className="relative ml-[78px] mt-2 h-4 border-b border-border sm:ml-[118px]">
                    {ticks.map((tick, index) => (
                      <span
                        key={tick}
                        className={`absolute top-0 font-mono text-[10px] text-muted ${
                          index === 0 ? "left-0" : index === ticks.length - 1 ? "right-0" : "-translate-x-1/2"
                        }`}
                        style={
                          index === 0 || index === ticks.length - 1
                            ? undefined
                            : { left: `${(index / (ticks.length - 1)) * 100}%` }
                        }
                      >
                        {tick}
                      </span>
                    ))}
                  </div>

                  <div className="relative ml-[78px] sm:ml-[118px]">
                    <div
                      className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-accent/50"
                      style={{ left: `${nowPercent}%` }}
                      aria-hidden
                    />
                    <div className="relative border-b border-border/60" style={{ height: ROW_HEIGHT }}>
                      {markers(list, false)}
                    </div>
                  </div>

                  <ul className="mt-1.5">
                    {list.map((alert) => (
                      <li key={alert.id} className="leading-tight">
                        <button
                          type="button"
                          onClick={() => onSelect(alert)}
                          aria-pressed={alert.id === selectedId}
                          className={`flex w-full items-center justify-between gap-2 rounded px-1.5 py-0.5 text-[11px] hover:bg-surface ${
                            alert.id === selectedId ? "bg-surface" : ""
                          }`}
                        >
                          <span className="min-w-0 truncate">
                            <span className={`mr-1.5 ${ALERT_TEXT_COLORS[alert.level]}`} aria-hidden>
                              ●
                            </span>
                            {alert.label}
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-muted">{formatClock(alert.timestamp)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
