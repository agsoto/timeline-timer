import { useEffect, useRef, useState } from "react";
import { formatDuration, parseDuration } from "../lib/parser";
import type { TimelineItem } from "../types";
import { CloseIcon } from "./Icons";

interface ItemEditorProps {
  item: TimelineItem;
  onSave: (label: string, durationSeconds: number) => void;
  onClose: () => void;
}

export function ItemEditor({ item, onSave, onClose }: ItemEditorProps) {
  const [label, setLabel] = useState(item.label);
  const [duration, setDuration] = useState(formatDuration(item.durationSeconds));
  const labelRef = useRef<HTMLInputElement>(null);
  const parsedDuration = parseDuration(duration);
  const valid = label.trim().length > 0 && parsedDuration !== null;

  useEffect(() => labelRef.current?.select(), []);

  return (
    <section className="surface-overlay item-overlay" role="dialog" aria-modal="true" aria-labelledby="item-editor-title">
      <header className="overlay-header">
        <div>
          <p className="eyebrow">Timeline item</p>
          <h2 id="item-editor-title">Edit while the clock runs</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close item editor"><CloseIcon /></button>
      </header>
      <form
        className="item-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid && parsedDuration) onSave(label.trim(), parsedDuration);
        }}
      >
        <label>
          <span>Label</span>
          <input ref={labelRef} value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <label>
          <span>Duration</span>
          <input value={duration} onChange={(event) => setDuration(event.target.value)} aria-invalid={!parsedDuration} />
        </label>
        <button className="primary-button" type="submit" disabled={!valid}>Update item <kbd>Enter</kbd></button>
      </form>
    </section>
  );
}
