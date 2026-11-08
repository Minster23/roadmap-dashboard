import { useEffect, useId, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Camera } from "../types";
import { placeholderImage } from "../data/mock";

interface AddCameraDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (camera: Camera) => void;
}

/** Modal form that creates a camera from a name and location. */
export function AddCameraDialog({ open, onClose, onAdd }: AddCameraDialogProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setLocation("");
    setError(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();
    if (trimmedName.length === 0 || trimmedLocation.length === 0) {
      setError("Name and location are required.");
      return;
    }
    const id = `cam-${crypto.randomUUID().slice(0, 4)}`;
    onAdd({
      id,
      name: trimmedName,
      location: trimmedLocation,
      streamUrl: placeholderImage(id.toUpperCase()),
      status: "online",
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="panel w-full max-w-sm">
        <header className="panel-header">
          <span id={titleId}>Add camera</span>
          <button type="button" className="btn px-1.5 py-1" onClick={onClose} aria-label="Close dialog">
            <X size={13} />
          </button>
        </header>
        <div className="space-y-3 p-3">
          <label className="block text-xs text-muted">
            Name
            <input
              className="field mt-1"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="KM 31 — Cibubur"
              autoFocus
            />
          </label>
          <label className="block text-xs text-muted">
            Location
            <input
              className="field mt-1"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Jl. Tol Jagorawi KM 31"
            />
          </label>
          {error && (
            <p className="text-xs text-alert" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add camera
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
