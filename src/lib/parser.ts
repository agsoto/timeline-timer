import type { TimelineItem } from "../types";

const TIME_PART = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)/gi;
const TIME_AT_END = /((?:\d+(?:\.\d+)?\s*(?:hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\s*)+)$/i;
const LIST_PREFIX = /^\s*(?:(?:[-*•–—]+)|(?:\d+[.)]))\s*/;

const multiplier = (unit: string): number => {
  const normalized = unit.toLowerCase();
  if (normalized.startsWith("h")) return 3600;
  if (normalized.startsWith("m")) return 60;
  return 1;
};

export function parseDuration(value: string): number | null {
  let seconds = 0;
  let matches = 0;
  TIME_PART.lastIndex = 0;
  for (const match of value.matchAll(TIME_PART)) {
    seconds += Number(match[1]) * multiplier(match[2]);
    matches += 1;
  }
  return matches > 0 && seconds > 0 ? Math.round(seconds) : null;
}

function splitAgenda(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const entries: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // A dash/bullet separates entries only when it looks like list punctuation,
    // preserving symbols and hyphens inside labels.
    const parts = trimmed
      .split(/\s+(?=[-•]\s+)/)
      .map((part) => part.replace(LIST_PREFIX, "").trim())
      .filter(Boolean);
    entries.push(...parts);
  }
  return entries;
}

export function parseAgenda(text: string): TimelineItem[] {
  return splitAgenda(text).flatMap((entry, index) => {
    const durationMatch = entry.match(TIME_AT_END);
    if (!durationMatch) return [];

    const durationSeconds = parseDuration(durationMatch[1]);
    if (!durationSeconds) return [];

    const label = entry.slice(0, durationMatch.index).trim().replace(/[\s:–—-]+$/, "").trim();
    if (!label) return [];

    return [{
      id: `item-${index}-${hash(`${label}\0${durationSeconds}`)}`,
      label,
      durationSeconds,
    }];
  });
}

function hash(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const remainingSeconds = whole % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (remainingSeconds || parts.length === 0) parts.push(`${remainingSeconds}s`);
  return parts.join(" ");
}

export function serializeAgenda(items: TimelineItem[]): string {
  return items.map((item) => `${item.label} ${formatDuration(item.durationSeconds)}`).join("\n");
}
