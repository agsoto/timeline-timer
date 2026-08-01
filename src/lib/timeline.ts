import type { TimelineItem, TimelinePosition } from "../types";

export function totalDuration(items: TimelineItem[]): number {
  return items.reduce((total, item) => total + item.durationSeconds, 0);
}

export function getTimelinePosition(items: TimelineItem[], elapsedSeconds: number): TimelinePosition {
  const totalSeconds = totalDuration(items);
  const clampedElapsed = Math.max(0, Math.min(elapsedSeconds, totalSeconds));

  if (items.length === 0 || totalSeconds === 0) {
    return {
      currentIndex: -1,
      elapsedSeconds: 0,
      totalSeconds: 0,
      currentElapsedSeconds: 0,
      currentRemainingSeconds: 0,
      progress: 0,
      isComplete: false,
    };
  }

  if (clampedElapsed >= totalSeconds) {
    return {
      currentIndex: items.length - 1,
      elapsedSeconds: totalSeconds,
      totalSeconds,
      currentElapsedSeconds: items.at(-1)?.durationSeconds ?? 0,
      currentRemainingSeconds: 0,
      progress: 1,
      isComplete: true,
    };
  }

  let cursor = 0;
  for (let index = 0; index < items.length; index += 1) {
    const end = cursor + items[index].durationSeconds;
    if (clampedElapsed < end) {
      const currentElapsedSeconds = clampedElapsed - cursor;
      return {
        currentIndex: index,
        elapsedSeconds: clampedElapsed,
        totalSeconds,
        currentElapsedSeconds,
        currentRemainingSeconds: items[index].durationSeconds - currentElapsedSeconds,
        progress: clampedElapsed / totalSeconds,
        isComplete: false,
      };
    }
    cursor = end;
  }

  return getTimelinePosition(items, totalSeconds);
}

export function itemStart(items: TimelineItem[], index: number): number {
  return items.slice(0, Math.max(0, index)).reduce((total, item) => total + item.durationSeconds, 0);
}

export function pastOpacity(items: TimelineItem[], index: number, elapsedSeconds: number): number {
  const total = totalDuration(items);
  if (total <= 0) return 1;
  const midpoint = itemStart(items, index) + items[index].durationSeconds / 2;
  if (midpoint >= elapsedSeconds) return 1;
  const distance = (elapsedSeconds - midpoint) / total;
  return Math.max(0.2, Math.min(0.85, 0.85 - distance * 0.8));
}
