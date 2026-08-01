import { useEffect, useRef } from "react";
import { CloseIcon } from "./Icons";

interface AgendaEditorProps {
  value: string;
  itemCount: number;
  totalLabel: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

export function AgendaEditor({ value, itemCount, totalLabel, onChange, onClose }: AgendaEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <section className="surface-overlay editor-overlay" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <header className="overlay-header">
        <div>
          <p className="eyebrow">Live agenda</p>
          <h2 id="editor-title">One item per line</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close editor" title="Close editor · Escape">
          <CloseIcon />
        </button>
      </header>
      <textarea
        ref={textareaRef}
        className="agenda-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby="editor-help"
        spellCheck="true"
      />
      <footer className="editor-footer" id="editor-help">
        <span>{itemCount} {itemCount === 1 ? "item" : "items"} · {totalLabel}</span>
        <span>Changes are live · Escape to return</span>
      </footer>
    </section>
  );
}
