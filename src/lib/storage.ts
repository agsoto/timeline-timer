import type { Settings } from "../types";

const AGENDA_KEY = "timeline-timer.agenda";
const SETTINGS_KEY = "timeline-timer.settings";
const SETTINGS_VERSION = 7;

type StoredSettings = Partial<Settings> & {
  _version?: number;
  horizontalHeight?: number;
  verticalWidth?: number;
};

export const DEFAULT_AGENDA = `Welcome & context 5m
Deep work 20m
Review 10m
Wrap up 5m`;

export const DEFAULT_SETTINGS: Settings = {
  edge: "top",
  alwaysOnTop: true,
  locked: false,
  warningSeconds: 30,
  compactMode: false,
  compactLabelChars: 14,
  compactShowElapsed: false,
  compactShowRemaining: false,
  accentColor: "#d8f26b",
};

export function restoreDefaultAppearance(settings: Settings): Settings {
  return {
    ...settings,
    edge: DEFAULT_SETTINGS.edge,
    compactMode: DEFAULT_SETTINGS.compactMode,
    compactLabelChars: DEFAULT_SETTINGS.compactLabelChars,
    compactShowElapsed: DEFAULT_SETTINGS.compactShowElapsed,
    compactShowRemaining: DEFAULT_SETTINGS.compactShowRemaining,
    accentColor: DEFAULT_SETTINGS.accentColor,
  };
}

export function loadAgenda(): string {
  return localStorage.getItem(AGENDA_KEY) ?? DEFAULT_AGENDA;
}

export function saveAgendaLocally(agenda: string): void {
  localStorage.setItem(AGENDA_KEY, agenda);
}

export function loadSettings(): Settings {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") as StoredSettings;
    delete stored.horizontalHeight;
    delete stored.verticalWidth;
    if (typeof stored.accentColor !== "string" || !/^#[0-9a-f]{6}$/i.test(stored.accentColor)) {
      stored.accentColor = DEFAULT_SETTINGS.accentColor;
    } else {
      stored.accentColor = stored.accentColor.toLowerCase();
    }
    delete stored._version;
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, _version: SETTINGS_VERSION }));
}
