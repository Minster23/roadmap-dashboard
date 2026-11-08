import { useEffect, useState } from "react";
import axios from "axios";
import { Star, Video, VideoOff } from "lucide-react";
import type { Camera } from "../types";
import { parseCameras } from "../data/api";

interface CameraListProps {
  cameras: Camera[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const CAMERAS_ENDPOINT = import.meta.env.VITE_CAMERAS_ENDPOINT ?? "/api/cameras";
const DASHBOARD_TOKEN = import.meta.env.VITE_DASHBOARD_TOKEN ?? "";

/**
 * Connected cameras.
 * A vertical sidebar from `lg` up; a horizontally scrolling strip below it.
 * Fetches the inventory from the configured API endpoint via Axios (with optional Bearer token)
 * and keeps the provided (mock) list when the backend is unreachable or returns something else.
 */
export function CameraList({ cameras, selectedId, onSelect }: CameraListProps) {
  const [remoteCameras, setRemoteCameras] = useState<Camera[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const url = `${API_BASE}${CAMERAS_ENDPOINT}`;
    const headers: Record<string, string> = {};
    if (DASHBOARD_TOKEN) {
      headers["Authorization"] = `Bearer ${DASHBOARD_TOKEN}`;
    }
    axios
      .get(url, { headers, signal: controller.signal })
      .then((response) => setRemoteCameras(parseCameras(response.data)))
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
      <ul className="flex snap-x gap-px overflow-x-auto lg:block lg:flex-1 lg:overflow-y-auto lg:overflow-x-hidden p-1.5 sm:p-2">
        {items.map((camera) => {
          const active = camera.id === selectedId;
          return (
            <li key={camera.id} className="shrink-0 snap-start lg:shrink">
              <button
                type="button"
                onClick={() => onSelect(camera.id)}
                aria-current={active ? "true" : undefined}
                className={`flex w-56 items-start gap-3 border-l-2 px-3.5 py-3 text-left text-sm hover:bg-surface lg:w-full rounded-md ${
                  active ? "border-accent bg-surface font-medium" : "border-transparent"
                }`}
              >
                {camera.status === "online" ? (
                  <Video size={16} className="mt-0.5 shrink-0 text-muted" aria-label="online" />
                ) : (
                  <VideoOff size={16} className="mt-0.5 shrink-0 text-muted/60" aria-label="offline" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{camera.name}</span>
                  <span className="block truncate text-xs text-muted mt-0.5">{camera.location}</span>
                </span>
                {active && <Star size={13} className="mt-1 shrink-0 text-accent" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
