import { useEffect, useState } from "react";
import axios from "axios";
import { Star, Video, VideoOff } from "lucide-react";
import type { Camera } from "../types";

interface CameraListProps {
  cameras: Camera[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * Connected cameras.
 * A vertical sidebar from `lg` up; a horizontally scrolling strip below it.
 * Fetches the inventory from `/api/cameras` via Axios and keeps the provided
 * (mock) list when the backend is unreachable or returns something else.
 */
export function CameraList({ cameras, selectedId, onSelect }: CameraListProps) {
  const [remoteCameras, setRemoteCameras] = useState<Camera[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    axios
      .get<Camera[]>("/api/cameras", { signal: controller.signal })
      .then((response) => setRemoteCameras(Array.isArray(response.data) ? response.data : null))
      .catch(() => setRemoteCameras(null));
    return () => controller.abort();
  }, []);

  const items = remoteCameras ?? cameras;

  return (
    <section className="panel flex min-h-0 flex-col lg:overflow-hidden" aria-label="Connected cameras">
      <header className="panel-header">
        <span>Cameras</span>
        <span>{items.filter((c) => c.status === "online").length}/{items.length} online</span>
      </header>
      <ul className="flex snap-x gap-px overflow-x-auto lg:block lg:flex-1 lg:overflow-y-auto lg:overflow-x-hidden">
        {items.map((camera) => {
          const active = camera.id === selectedId;
          return (
            <li key={camera.id} className="shrink-0 snap-start lg:shrink">
              <button
                type="button"
                onClick={() => onSelect(camera.id)}
                aria-current={active ? "true" : undefined}
                className={`flex w-52 items-start gap-2 border-l-2 px-3 py-2 text-left text-sm hover:bg-surface lg:w-full ${
                  active ? "border-accent bg-surface" : "border-transparent"
                }`}
              >
                {camera.status === "online" ? (
                  <Video size={14} className="mt-0.5 shrink-0 text-muted" aria-label="online" />
                ) : (
                  <VideoOff size={14} className="mt-0.5 shrink-0 text-muted/60" aria-label="offline" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{camera.name}</span>
                  <span className="block truncate text-xs text-muted">{camera.location}</span>
                </span>
                {active && <Star size={12} className="mt-1 shrink-0 text-accent" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
