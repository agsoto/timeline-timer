export type Edge = "top" | "bottom" | "left" | "right";
export type PlaybackState = "playing" | "paused" | "stopped";

export interface TimelineItem {
  id: string;
  label: string;
  durationSeconds: number;
}

export interface TimelinePosition {
  currentIndex: number;
  elapsedSeconds: number;
  totalSeconds: number;
  currentElapsedSeconds: number;
  currentRemainingSeconds: number;
  progress: number;
  isComplete: boolean;
}

export interface Settings {
  edge: Edge;
  edgeMargin: number;
  alwaysOnTop: boolean;
  locked: boolean;
  warningSeconds: number;
  compactMode: boolean;
  compactLabelChars: number;
  compactShowElapsed: boolean;
  compactShowRemaining: boolean;
  accentColor: string;
}
