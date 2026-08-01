import { describe, expect, it } from "vitest";
import { formatDuration, parseAgenda, parseDuration, serializeAgenda } from "./parser";

describe("parseDuration", () => {
  it.each([
    ["15s", 15],
    ["30 sec", 30],
    ["45 seconds", 45],
    ["10 mins", 600],
    ["2hrs", 7200],
    ["1h 30m", 5400],
    ["1h30m", 5400],
    ["2h15m30s", 8130],
    ["90m", 5400],
  ])("normalizes %s", (source, expected) => {
    expect(parseDuration(source)).toBe(expected);
  });

  it("rejects missing and zero durations", () => {
    expect(parseDuration("later")).toBeNull();
    expect(parseDuration("0m")).toBeNull();
  });
});

describe("parseAgenda", () => {
  it("parses newline, dash, bullet, and numbered entries", () => {
    const result = parseAgenda(`- Intro 5m
• API Review 15 min
3. Risks 30s
Wrap 1h30m`);
    expect(result.map(({ label, durationSeconds }) => ({ label, durationSeconds }))).toEqual([
      { label: "Intro", durationSeconds: 300 },
      { label: "API Review", durationSeconds: 900 },
      { label: "Risks", durationSeconds: 30 },
      { label: "Wrap", durationSeconds: 5400 },
    ]);
  });

  it("preserves emoji, unicode, symbols, and numbers in labels", () => {
    const [item] = parseAgenda("🚀 Déploiement v2 / Q&A 10m");
    expect(item.label).toBe("🚀 Déploiement v2 / Q&A");
  });

  it("supports inline dash-separated items", () => {
    expect(parseAgenda("Intro 5m - Review 10m")).toHaveLength(2);
  });

  it("serializes parsed items without losing durations", () => {
    const input = parseAgenda("Focus 1h30m\nRest 45s");
    expect(parseAgenda(serializeAgenda(input)).map((item) => item.durationSeconds)).toEqual([5400, 45]);
    expect(formatDuration(5400)).toBe("1h 30m");
  });
});
