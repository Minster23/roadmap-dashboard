# Roadguard

Surveillance dashboard frontend. React + TypeScript + Tailwind, built with Vite.

## Run

```sh
bun install
bun run dev      # http://localhost:5173
bun test         # unit tests (bun test)
bun run build    # tsc + vite production build
```

Requires Bun (or Node 20+ with `npm run …`; the test script needs Bun).

## Docker

```sh
docker compose up --build   # http://localhost:8080
```

Multi-stage build (`node:22-alpine` → `nginx:1.27-alpine`). Nginx serves the SPA with a history
fallback; `/api/` deliberately answers **404** so the Axios fetch in `CameraList` degrades to mock data
instead of receiving `index.html`.

## Layout

```
src/
  App.tsx                     dashboard shell + selection state
  types.ts                    Camera, Alert
  data/mock.ts                mock cameras/alerts, time + format helpers
  hooks/useTheme.ts           dark/light, persisted in localStorage
  components/
    Navbar.tsx                brand, Add camera, theme switch
    CameraList.tsx            connected cameras (GET /api/cameras, mock fallback)
    CameraViewport.tsx        feed, detection overlay, fullscreen (Esc)
    Timeline.tsx              per-camera dropdowns: collapsed marker strip → own axis + detections
    AddCameraDialog.tsx       modal form
```

## Responsive

| Viewport | Layout |
|---|---|
| `<640px` | single column, page scrolls; camera list becomes a horizontal snap strip; navbar action is icon-only; viewport is 16:9 |
| `640–1023px` | same stack, wider padding, full alert labels |
| `1024–1279px` (`lg`) | 240px camera sidebar + viewport; detection dropdowns below |
| `≥1280px` (`xl`) | three columns, fixed-height frame, each panel scrolls independently |

## Timeline

One collapsible row per camera (accordion, one open at a time). A closed row shows that camera's
whole hour as a thin marker strip plus per-severity counts; opening it reveals the camera's own
time axis, clickable markers, and a detection list.

- Clicking a row toggles it.
- Clicking a marker or a detection focuses the alert, switches the viewport to that camera, and keeps its row open.
- Clicking a camera in the sidebar switches the feed and opens that camera's row.

Each open dropdown is its own scroll box (`max-h-56`, both axes, `overscroll-contain`), so panning
or scrolling inside one camera never moves the timeline or the page behind it.

## Zoom

`Zoom out` / `Zoom in` in the timeline header double/halve the axis (1×–8×). The window stays the
same hour; the track widens and pans horizontally inside the open dropdown. Axis labels and markers
share one track width, so markers stay aligned at every level.

## Data contract

`GET /api/cameras` → `Camera[]`. `Alert` records carry `timestamp`, `image`, `location`, `level`
plus `id`, `label`, `cameraId`; they are mock-only for now (`mockAlerts`).

<!-- ponytail: no router, no state library, no API client layer — one page, one fetch. Add an API module when a second endpoint appears. -->
# roadmap-dashboard
