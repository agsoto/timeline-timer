import { forwardRef, useLayoutEffect, useRef } from "react";
import { formatDuration } from "../lib/parser";
import { itemStart, pastOpacity, totalDuration } from "../lib/timeline";
import type { Edge, PlaybackState, TimelineItem, TimelinePosition } from "../types";

interface TimelineProps {
  items: TimelineItem[];
  position: TimelinePosition;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: (index: number) => void;
  locked: boolean;
  edge: Edge;
  playbackState: PlaybackState;
  labelCharacterLimit?: number;
}

interface AnimatedPlayheadProps {
  edge: Edge;
  progress: number;
  remainingSeconds: number;
  playbackState: PlaybackState;
  resyncKey: string;
}

function playheadTransform(edge: Edge, distance: number): string {
  const translated = Math.max(0, distance) - 0.5;
  return edge === "left" || edge === "right"
    ? `translateY(${translated}px)`
    : `translateX(${translated}px)`;
}

function AnimatedPlayhead({ edge, progress, remainingSeconds, playbackState, resyncKey }: AnimatedPlayheadProps) {
  const playheadRef = useRef<HTMLSpanElement>(null);
  const running = playbackState === "playing";
  const staticProgress = running ? null : progress;

  useLayoutEffect(() => {
    const playhead = playheadRef.current;
    const track = playhead?.parentElement;
    if (!playhead || !track) return;

    const vertical = edge === "left" || edge === "right";
    const initialProgress = Math.max(0, Math.min(1, progress));
    const initialRemaining = Math.max(0, remainingSeconds);
    const startedAt = Date.now();
    let animation: Animation | null = null;

    const livePosition = () => {
      if (!running || initialRemaining <= 0) {
        return { liveProgress: initialProgress, liveRemaining: 0 };
      }
      const elapsed = Math.max(0, (Date.now() - startedAt) / 1000);
      const liveRemaining = Math.max(0, initialRemaining - elapsed);
      const completion = 1 - liveRemaining / initialRemaining;
      return {
        liveProgress: initialProgress + (1 - initialProgress) * completion,
        liveRemaining,
      };
    };

    const synchronize = () => {
      const extent = vertical ? track.clientHeight : track.clientWidth;
      const { liveProgress, liveRemaining } = livePosition();
      const from = playheadTransform(edge, liveProgress * extent);
      const to = playheadTransform(edge, extent);

      animation?.cancel();
      playhead.style.transform = from;
      if (!running || liveRemaining <= 0 || extent <= 0) return;

      animation = playhead.animate(
        [{ transform: from }, { transform: to }],
        {
          duration: liveRemaining * 1000,
          easing: "linear",
          fill: "forwards",
        },
      );
    };

    const resizeObserver = new ResizeObserver(synchronize);
    resizeObserver.observe(track);
    window.addEventListener("focus", synchronize);
    document.addEventListener("visibilitychange", synchronize);
    synchronize();

    return () => {
      animation?.cancel();
      resizeObserver.disconnect();
      window.removeEventListener("focus", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
    };
  }, [edge, playbackState, resyncKey, running, staticProgress]);

  return (
    <span className="playhead" ref={playheadRef} data-playback-state={playbackState} aria-hidden="true">
      <span className="playhead-mark" />
    </span>
  );
}

function trimLabel(label: string, limit?: number): string {
  if (!limit) return label;
  const characters = Array.from(label);
  return characters.length > limit ? `${characters.slice(0, limit).join("")}...` : label;
}

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(function Timeline(
  { items, position, selectedIndex, onSelect, onEdit, locked, edge, playbackState, labelCharacterLimit },
  ref,
) {
  const total = totalDuration(items);
  const playheadResyncKey = `${position.currentIndex}:${items.map((item) => `${item.id}:${item.durationSeconds}`).join("|")}`;

  if (items.length === 0) {
    return (
      <div className="timeline-empty" role="status">
        <span>No timed items yet</span>
        <small>Open the editor and add a line such as “Introduction 5m”.</small>
      </div>
    );
  }

  return (
    <div
      className="timeline"
      ref={ref}
      role="listbox"
      aria-label="Agenda timeline"
      aria-activedescendant={items[selectedIndex] ? `segment-${items[selectedIndex].id}` : undefined}
    >
      <div className="timeline-segments">
        {items.map((item, index) => {
          const tooltipId = `segment-time-${item.id}`;
          const start = itemStart(items, index);
          const localProgress = index === position.currentIndex
            ? Math.max(0, Math.min(1, (position.elapsedSeconds - start) / item.durationSeconds))
            : index < position.currentIndex ? 1 : 0;
          const opacity = index < position.currentIndex
            ? pastOpacity(items, index, position.elapsedSeconds)
            : 1;
          const state = index < position.currentIndex
            ? "past"
            : index === position.currentIndex ? "current" : "future";

          return (
            <button
              className="timeline-segment"
              id={`segment-${item.id}`}
              key={`timeline-slot-${index}`}
              type="button"
              role="option"
              aria-selected={selectedIndex === index}
              aria-describedby={tooltipId}
              aria-label={`${item.label}, ${state}`}
              data-state={state}
              data-timeline-index={index}
              tabIndex={selectedIndex === index ? 0 : -1}
              onFocus={() => onSelect(index)}
              onClick={() => onSelect(index)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                event.stopPropagation();
                onSelect(index);
                if (!locked) onEdit(index);
              }}
              onDoubleClick={() => !locked && onEdit(index)}
              style={{
                "--segment-size": `${(item.durationSeconds / total) * 100}%`,
                "--segment-opacity": opacity,
                "--local-progress": `${localProgress * 100}%`,
              } as React.CSSProperties}
            >
              <span className="segment-rail" />
              <span className="segment-copy">
                <span className="segment-label">{trimLabel(item.label, labelCharacterLimit)}</span>
                <span className="segment-duration">{formatDuration(item.durationSeconds)}</span>
              </span>
              <span className="segment-time-tooltip" id={tooltipId} role="tooltip">
                {formatDuration(item.durationSeconds)}
              </span>
            </button>
          );
        })}
        <AnimatedPlayhead
          edge={edge}
          progress={position.progress}
          remainingSeconds={Math.max(0, position.totalSeconds - position.elapsedSeconds)}
          playbackState={playbackState}
          resyncKey={playheadResyncKey}
        />
      </div>
    </div>
  );
});
