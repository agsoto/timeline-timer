import { describe, expect, it } from "vitest";
import type { TimelineItem } from "../types";
import { getTimelinePosition, itemStart, pastOpacity, totalDuration } from "./timeline";

const items: TimelineItem[] = [
  { id: "a", label: "A", durationSeconds: 60 },
  { id: "b", label: "B", durationSeconds: 120 },
  { id: "c", label: "C", durationSeconds: 20 },
];

describe("timeline calculations", () => {
  it("calculates totals and item starts", () => {
    expect(totalDuration(items)).toBe(200);
    expect(itemStart(items, 2)).toBe(180);
  });

  it("finds the active item and continuous progress", () => {
    expect(getTimelinePosition(items, 90)).toMatchObject({
      currentIndex: 1,
      currentElapsedSeconds: 30,
      currentRemainingSeconds: 90,
      progress: 0.45,
      isComplete: false,
    });
  });

  it("uses the next item at an exact boundary", () => {
    expect(getTimelinePosition(items, 60).currentIndex).toBe(1);
  });

  it("clamps at completion", () => {
    expect(getTimelinePosition(items, 300)).toMatchObject({ progress: 1, isComplete: true });
  });

  it("fades older segments more than recent ones", () => {
    expect(pastOpacity(items, 0, 190)).toBeLessThan(pastOpacity(items, 1, 190));
  });
});
