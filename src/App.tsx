import { useState } from "react";
import type { Alert, Camera } from "./types";
import { CAMERAS, mockAlerts } from "./data/mock";
import { useTheme } from "./hooks/useTheme";
import { Navbar } from "./components/Navbar";
import { CameraList } from "./components/CameraList";
import { CameraViewport } from "./components/CameraViewport";
import { Timeline, ZOOM_MAX, ZOOM_MIN } from "./components/Timeline";
import { AddCameraDialog } from "./components/AddCameraDialog";

/** Dashboard shell: navbar, camera list, viewport, and per-camera detection dropdowns. */
export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [cameras, setCameras] = useState<Camera[]>(CAMERAS);
  const [alerts] = useState<Alert[]>(() => mockAlerts(CAMERAS));
  const [selectedCameraId, setSelectedCameraId] = useState(CAMERAS[0].id);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [openCameraId, setOpenCameraId] = useState<string | null>(CAMERAS[0].id);
  const [zoom, setZoom] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const selectedCamera = cameras.find((camera) => camera.id === selectedCameraId);
  const selectedAlert = alerts.find((alert) => alert.id === selectedAlertId);
  const cameraAlerts = alerts
    .filter((alert) => alert.cameraId === selectedCameraId)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const latestAlert = selectedAlert?.cameraId === selectedCameraId ? selectedAlert : cameraAlerts[0];

  /** Sidebar click: switch the feed and reveal that camera's own timeline. */
  const handleSelectCamera = (cameraId: string) => {
    setSelectedCameraId(cameraId);
    setOpenCameraId(cameraId);
  };

  /** Clamps zoom to the supported range; the axis magnifies while the window stays the same hour. */
  const handleZoomChange = (next: number) => setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)));

  /** Marker click: focus the alert, follow its camera, keep its dropdown open. */
  const handleSelectAlert = (alert: Alert) => {
    setSelectedAlertId(alert.id);
    setSelectedCameraId(alert.cameraId);
    setOpenCameraId(alert.cameraId);
  };

  const handleToggleCamera = (cameraId: string) => {
    setOpenCameraId((current) => (current === cameraId ? null : cameraId));
  };

  const handleAddCamera = (camera: Camera) => {
    setCameras((current) => [...current, camera]);
    setSelectedCameraId(camera.id);
    setOpenCameraId(camera.id);
  };

  // Mobile: page scrolls, camera list becomes a strip, panels stack.
  // lg+: fixed-height frame; rows are explicit and shrinkable so the viewport
  // can never push into the timeline. Too-short frames scroll instead of crushing the feed.
  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <Navbar theme={theme} onToggleTheme={toggleTheme} onAddCamera={() => setDialogOpen(true)} />

      <main className="grid flex-1 grid-cols-1 gap-2 p-2 sm:gap-3 sm:p-3 lg:min-h-0 lg:grid-cols-[240px_1fr] lg:grid-rows-[minmax(180px,1fr)_minmax(200px,45%)] lg:overflow-y-auto xl:grid-cols-[240px_1fr_260px]">
        <CameraList cameras={cameras} selectedId={selectedCameraId} onSelect={handleSelectCamera} />
        <CameraViewport camera={selectedCamera} latestAlert={latestAlert} />

        <div className="flex min-h-[220px] flex-col lg:min-h-0 xl:col-span-2 xl:col-start-2">
          <Timeline
            alerts={alerts}
            selectedId={selectedAlertId}
            openCameraId={openCameraId}
            onToggleCamera={handleToggleCamera}
            onSelect={handleSelectAlert}
            zoom={zoom}
            onZoomChange={handleZoomChange}
          />
        </div>
      </main>

      <AddCameraDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onAdd={handleAddCamera} />
    </div>
  );
}
