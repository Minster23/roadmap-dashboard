import { useMemo } from "react";
import { AlertTriangle, ChevronDown, CircleAlert, Info, ZoomIn, ZoomOut } from "lucide-react";
import type { Alert, AlertLevel } from "../types";
import { ALERT_COLORS, ALERT_TEXT_COLORS, formatClock, timeBounds, toPercent } from "../data/utils";

const ICONS: Record<AlertLevel, typeof Info> = {
  critical: CircleAlert,
  warning: AlertTriangle,
  info: Info,
};

const ROW_HEIGHT = 24;
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
 * the event list on the left and the event timeline on the right side-by-side with generous spacing.
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
      }))
      .sort((a, b) => b.list.length - a.list.length);
  }, [alerts]);

  /** Absolute marker buttons for one camera; `compact` is the collapsed preview strip. */
  const markers = (list: Alert[], compact: boolean) =>
    list.map((alert) => {
      const conf = alert.confidence !== undefined ? ` (${Math.round(alert.confidence * 100)}%)` : "";
      const titleText = `${alert.label}${conf} · ${alert.location} · ${formatClock(alert.timestamp)}`;
      const ariaText = `${alert.label}${conf} at ${formatClock(alert.timestamp)}`;
      const Icon = ICONS[alert.level];
      const active = alert.id === selectedId;
      return (
        <button
          key={alert.id}
          type="button"
          onClick={() => onSelect(alert)}
          title={titleText}
          aria-label={ariaText}
          aria-pressed={active}
          className={`absolute flex items-center justify-center rounded ${ALERT_COLORS[alert.level]} ${
            active ? "ring-2 ring-fg" : compact ? "opacity-70 hover:opacity-100" : "opacity-90 hover:opacity-100"
          }`}
          style={
            compact
              ? { left: `calc(${toPercent(alert.timestamp, start, end)}% - 1.5px)`, top: 0, bottom: 0, width: 3 }
              : {
                  left: `calc(${toPercent(alert.timestamp, start, end)}% - 4px)`,
                  top: (ROW_HEIGHT - TRACK_HEIGHT) / 2 - 6,
                  width: 8,
                  height: TRACK_HEIGHT + 12,
                }
          }
        >
          {!compact && <Icon size={9} className="text-panel" aria-hidden />}
        </button>
      );
    });

  const zoomButton = (Icon: typeof ZoomIn, next: number, label: string) => (
    <button
      type="button"
      className="btn px-2 py-1"
      onClick={() => onZoomChange(next)}
      disabled={next === zoom || next < ZOOM_MIN || next > ZOOM_MAX}
      aria-label={label}
      title={label}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="Detection timeline">
      <header className="panel-header">
        <span>Detections · Last hour</span>
        <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 normal-case tracking-normal sm:gap-x-4">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="font-semibold text-fg">{alerts.length}</span> <span className="hidden sm:inline">detected</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5" role="group" aria-label="Timeline zoom">
            {zoomButton(ZoomOut, Math.max(ZOOM_MIN, zoom / 2), "Zoom out")}
            <span className="w-9 text-center font-medium text-fg">{zoom}×</span>
            {zoomButton(ZoomIn, Math.min(ZOOM_MAX, zoom * 2), "Zoom in")}
          </span>
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {groups.length === 0 && <p className="py-8 text-center text-sm text-muted">No detections in window</p>}

        {groups.map(({ cameraId, list }) => {
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
                  className={`flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-surface sm:px-4 ${open ? "bg-surface" : ""}`}
                >
                  <ChevronDown
                    size={14}
                    className={`shrink-0 text-muted transition-transform ${open ? "" : "-rotate-90"}`}
                    aria-hidden
                  />
                  <span className="w-[72px] shrink-0 truncate font-semibold text-xs text-muted sm:w-[120px] sm:text-sm">
                    {cameraId.toUpperCase()}
                  </span>
                  <span className="relative h-3.5 min-w-0 flex-1 overflow-hidden rounded bg-border/40">
                    {markers(list, true)}
                  </span>
                  <span className="shrink-0 font-medium text-xs text-muted">{list.length}</span>
                </button>
              </h3>

              {/* Open accordion: Side-by-side layout with generous spacing */}
              <div
                id={panelId}
                className={open ? "border-t border-border/60 grid grid-cols-1 lg:grid-cols-[320px_1fr]" : "hidden"}
              >
                {/* Left: Event list (scrolls vertically) */}
                <div className="max-h-60 overflow-y-auto overscroll-contain border-b border-border/60 p-3 lg:border-b-0 lg:border-r sm:p-4">
                  <ul className="space-y-1.5">
                    {list.map((alert) => (
                      <li key={alert.id} className="leading-relaxed">
                        <button
                          type="button"
                          onClick={() => onSelect(alert)}
                          aria-pressed={alert.id === selectedId}
                          className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-xs hover:bg-surface ${
                            alert.id === selectedId ? "bg-surface font-medium" : ""
                          }`}
                        >
                          <span className="min-w-0 truncate flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${ALERT_TEXT_COLORS[alert.level].replace('text-', 'bg-')}`} aria-hidden />
                            <span className="truncate">{alert.label}</span>
                            {alert.confidence !== undefined && (
                              <span className="text-muted text-[11px]">
                                {Math.round(alert.confidence * 100)}%
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-muted text-[11px]">{formatClock(alert.timestamp)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right: Event timeline (ticks + track, scrolls horizontally with zoom) */}
                <div className="overflow-x-auto overflow-y-hidden overscroll-x-contain p-3.5 sm:p-4 flex items-center">
                  <div style={{ width: trackWidth }} className="min-w-full">
                    <div className="relative h-5 border-b border-border pb-1">
                      {ticks.map((tick, index) => (
                        <span
                          key={tick}
                          className={`absolute top-0 text-[11px] text-muted ${
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

                    <div className="relative mt-3">
                      <div
                        className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-accent/60"
                        style={{ left: `${nowPercent}%` }}
                        aria-hidden
                      />
                      <div className="relative border-b border-border/60" style={{ height: ROW_HEIGHT }}>
                        {markers(list, false)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
