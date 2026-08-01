import type { Edge } from "../types";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function command<T>(name: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!isTauri()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(name, args);
}

export async function dockWindow(
  edge: Edge,
  compactMode: boolean,
  compactLabelChars: number,
): Promise<void> {
  document.documentElement.dataset.edge = edge;
  await command("dock_window", { edge, compactMode, compactLabelChars });
}

export async function setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
  await command("set_always_on_top", { alwaysOnTop });
}

export async function closeWindow(): Promise<void> {
  if (!isTauri()) {
    window.close();
    return;
  }
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  await getCurrentWindow().close();
}

export async function loadCustomCss(): Promise<{ content: string; path: string } | null> {
  return command<{ content: string; path: string }>("load_custom_css");
}

export async function listenForCustomCss(callback: (css: string) => void): Promise<() => void> {
  if (!isTauri()) return () => undefined;
  const { listen } = await import("@tauri-apps/api/event");
  return listen<string>("custom-css-changed", (event) => callback(event.payload));
}
