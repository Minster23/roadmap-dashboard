import { useEffect, useState } from "react";
import { CameraOff, Maximize2, Minimize2, Radio } from "lucide-react";
import type { Alert, Camera } from "../types";
import { ALERT_TEXT_COLORS, formatDateTime } from "../data/mock";

interface CameraViewportProps {
  camera: Camera | undefined;
  latestAlert: Alert | undefined;
}

/**
 * Live camera viewport with an overlay bar showing the latest detection.
 * Shows an offline notice instead of the feed when the camera is not online.
 */
export function CameraViewport({ camera, latestAlert }: CameraViewportProps) {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ponytail: fullscreen is a fixed overlay, not the Fullscreen API — no permission prompt, escape handled above
  return (
    <section
      className={`panel flex min-h-0 flex-col overflow-hidden ${fullscreen ? "fixed inset-0 z-40 rounded-none" : ""}`}
      aria-label="Camera viewport"
    >
      <header className="panel-header">
        <span className="flex min-w-0 items-center gap-1.5 normal-case tracking-normal">
          <Radio size={13} className={camera?.status === "online" ? "shrink-0 text-fg" : "shrink-0 text-muted"} />
          <span className="truncate text-fg">{camera?.name ?? "No camera selected"}</span>
        </span>
        <span className="flex min-w-0 items-center gap-3">
          {latestAlert && (
            <span className={`truncate normal-case tracking-normal ${ALERT_TEXT_COLORS[latestAlert.level]}`}>
              <span className="hidden sm:inline">{latestAlert.label} · </span>
              {formatDateTime(latestAlert.timestamp)}
            </span>
          )}
          <button
            type="button"
            className="btn shrink-0 px-1.5 py-1"
            onClick={() => setFullscreen((value) => !value)}
            aria-pressed={fullscreen}
            aria-label={fullscreen ? "Exit fullscreen viewport" : "Fullscreen viewport"}
          >
            {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </span>
      </header>

      <div className="relative aspect-video max-h-[60vh] w-full flex-1 overflow-hidden bg-black/90 lg:aspect-auto lg:max-h-none lg:min-h-0">
        {camera?.status === "online" ? (
          <img
            src={camera.streamUrl}
            alt={`Live feed from ${camera.name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
            <CameraOff size={28} />
            <span className="text-sm">{camera ? "Camera offline" : "Select a camera"}</span>
          </div>
        )}
        <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 font-mono text-[11px] text-white">
          <span className={`h-1.5 w-1.5 rounded-full ${camera?.status === "online" ? "bg-fg" : "bg-muted/60"}`} />
          {camera?.status === "online" ? "REC" : "OFFLINE"} · {camera?.id.toUpperCase() ?? "—"}
        </span>
      </div>
    </section>
  );
}
