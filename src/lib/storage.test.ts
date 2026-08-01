import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, loadSettings, restoreDefaultAppearance, saveSettings } from "./storage";

const SETTINGS_KEY = "timeline-timer.settings";

beforeEach(() => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
});

describe("settings storage", () => {
  it("loads defaults when no settings have been saved", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("normalizes valid accent colors and rejects invalid values", () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ accentColor: "#A1B2C3" }));
    expect(loadSettings().accentColor).toBe("#a1b2c3");

    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ accentColor: "not-a-color" }));
    expect(loadSettings().accentColor).toBe(DEFAULT_SETTINGS.accentColor);
  });

  it("persists the current settings schema", () => {
    saveSettings({ ...DEFAULT_SETTINGS, edge: "right", accentColor: "#123456" });
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");

    expect(saved).toMatchObject({ _version: 7, edge: "right", accentColor: "#123456" });
  });

  it("discards legacy size settings now controlled by window resizing", () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      _version: 6,
      horizontalHeight: 480,
      verticalWidth: 510,
      edge: "right",
    }));

    const loaded = loadSettings();
    expect(loaded.edge).toBe("right");
    expect(loaded).not.toHaveProperty("horizontalHeight");
    expect(loaded).not.toHaveProperty("verticalWidth");
  });

  it("resets appearance without changing behavioral settings", () => {
    const restored = restoreDefaultAppearance({
      ...DEFAULT_SETTINGS,
      edge: "left",
      alwaysOnTop: false,
      locked: true,
      warningSeconds: 60,
      compactMode: true,
      compactLabelChars: 30,
      compactShowElapsed: true,
      compactShowRemaining: true,
      accentColor: "#123456",
    });

    expect(restored).toMatchObject({
      edge: DEFAULT_SETTINGS.edge,
      compactMode: DEFAULT_SETTINGS.compactMode,
      compactLabelChars: DEFAULT_SETTINGS.compactLabelChars,
      compactShowElapsed: DEFAULT_SETTINGS.compactShowElapsed,
      compactShowRemaining: DEFAULT_SETTINGS.compactShowRemaining,
      accentColor: DEFAULT_SETTINGS.accentColor,
      alwaysOnTop: false,
      locked: true,
      warningSeconds: 60,
    });
  });
});
