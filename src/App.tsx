import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgendaEditor } from "./components/AgendaEditor";
import { ArrowIcon, CloseIcon, CompactIcon, EditIcon, ExpandIcon, LockIcon, PauseIcon, PlayIcon, RestartIcon, SettingsIcon } from "./components/Icons";
import { ItemEditor } from "./components/ItemEditor";
import { SettingsPanel } from "./components/SettingsPanel";
import { Timeline } from "./components/Timeline";
import { TimePrompt } from "./components/TimePrompt";
import { useTimer } from "./hooks/useTimer";
import { closeWindow, dockWindow, listenForCustomCss, loadCustomCss, setAlwaysOnTop } from "./lib/desktop";
import { formatDuration, parseAgenda, serializeAgenda } from "./lib/parser";
import { DEFAULT_SETTINGS, loadAgenda, loadSettings, restoreDefaultAppearance, saveAgendaLocally, saveSettings } from "./lib/storage";
import { getTimelinePosition, itemStart, totalDuration } from "./lib/timeline";
import type { PlaybackState, Settings, TimelineItem, TimelinePosition } from "./types";

type Panel = "agenda" | "settings" | null;

function clock(seconds: number): string {
  const value = Math.max(0, Math.ceil(seconds));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const remaining = value % 60;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`
    : `${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
}

function accentChannels(color: string): { channels: string; contrast: string } {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color)
    ?? /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(DEFAULT_SETTINGS.accentColor)!;
  const [red, green, blue] = match.slice(1).map((channel) => Number.parseInt(channel, 16));
  const perceivedBrightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return {
    channels: `${red} ${green} ${blue}`,
    contrast: perceivedBrightness >= 145 ? "#15160f" : "#f7f7f2",
  };
}

export default function App() {
  const [agendaText, setAgendaText] = useState(loadAgenda);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [panel, setPanel] = useState<Panel>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [promptIndex, setPromptIndex] = useState<number | null>(null);
  const [customCssPath, setCustomCssPath] = useState("");
  const [status, setStatus] = useState("Ready");
  const [windowSizeResetKey, setWindowSizeResetKey] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const resetWindowDimensionsRef = useRef(false);
  const warnedItems = useRef(new Set<string>());

  const items = useMemo(() => parseAgenda(agendaText), [agendaText]);
  const totalSeconds = useMemo(() => totalDuration(items), [items]);
  const timer = useTimer(totalSeconds);
  const position = useMemo(
    () => getTimelinePosition(items, timer.elapsedSeconds),
    [items, timer.elapsedSeconds],
  );
  const currentItem = items[position.currentIndex];
  const compactActive = settings.compactMode && panel === null && editingIndex === null;

  const itemsRef = useRef(items);
  const positionRef = useRef<TimelinePosition>(position);
  const selectedRef = useRef(selectedIndex);
  const settingsRef = useRef(settings);
  const panelRef = useRef(panel);
  const promptRef = useRef(promptIndex);
  itemsRef.current = items;
  positionRef.current = position;
  selectedRef.current = selectedIndex;
  settingsRef.current = settings;
  panelRef.current = panel;
  promptRef.current = promptIndex;

  useEffect(() => {
    saveAgendaLocally(agendaText);
  }, [agendaText]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const accent = accentChannels(settings.accentColor);
    document.documentElement.style.setProperty("--configured-accent-rgb", accent.channels);
    document.documentElement.style.setProperty("--configured-accent-contrast", accent.contrast);
    return () => {
      document.documentElement.style.removeProperty("--configured-accent-rgb");
      document.documentElement.style.removeProperty("--configured-accent-contrast");
    };
  }, [settings.accentColor]);

  useEffect(() => {
    const resetDimensions = resetWindowDimensionsRef.current;
    resetWindowDimensionsRef.current = false;
    void dockWindow(
      settings.edge,
      compactActive,
      settings.compactLabelChars,
      settings.edgeMargin,
      resetDimensions,
    )
      .catch(() => setStatus("Could not dock the window"));
  }, [compactActive, settings.compactLabelChars, settings.edge, settings.edgeMargin, windowSizeResetKey]);

  useEffect(() => {
    void setAlwaysOnTop(settings.alwaysOnTop).catch(() => setStatus("Could not change window level"));
  }, [settings.alwaysOnTop]);

  useEffect(() => {
    let unlisten: () => void = () => undefined;
    const applyCss = (css: string) => {
      let element = document.querySelector<HTMLStyleElement>("#timeline-custom-css");
      if (!element) {
        element = document.createElement("style");
        element.id = "timeline-custom-css";
        document.head.append(element);
      }
      element.textContent = css;
    };
    void loadCustomCss().then((result) => {
      if (!result) return;
      setCustomCssPath(result.path);
      applyCss(result.content);
    });
    void listenForCustomCss(applyCss).then((dispose) => { unlisten = dispose; });
    return () => unlisten();
  }, []);

  useEffect(() => {
    setSelectedIndex((index) => Math.max(0, Math.min(index, items.length - 1)));
  }, [items.length]);

  useEffect(() => {
    if (settings.compactMode) {
      if (promptIndex !== null) setPromptIndex(null);
      return;
    }
    if (!timer.running || settings.warningSeconds <= 0 || position.isComplete || !currentItem) {
      if (position.isComplete) setPromptIndex(null);
      return;
    }
    const warningKey = `${position.currentIndex}:${currentItem.id}`;
    if (position.currentRemainingSeconds <= settings.warningSeconds && !warnedItems.current.has(warningKey)) {
      warnedItems.current.add(warningKey);
      setPromptIndex(position.currentIndex);
    }
  }, [currentItem, position.currentIndex, position.currentRemainingSeconds, position.isComplete, promptIndex, settings.compactMode, settings.warningSeconds, timer.running]);

  useEffect(() => {
    if (promptIndex !== null && promptIndex !== position.currentIndex) setPromptIndex(null);
  }, [position.currentIndex, promptIndex]);

  useEffect(() => {
    if (promptIndex === null) return;
    const timeout = window.setTimeout(() => setPromptIndex(null), 12_000);
    return () => window.clearTimeout(timeout);
  }, [promptIndex]);

  const announce = useCallback((message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus((value) => value === message ? "Ready" : value), 2400);
  }, []);

  const commitItems = useCallback((nextItems: TimelineItem[], nextSelection?: number) => {
    const nextText = serializeAgenda(nextItems);
    setAgendaText(nextText);
    if (typeof nextSelection === "number") setSelectedIndex(Math.max(0, Math.min(nextSelection, nextItems.length - 1)));
  }, []);

  const extendCurrent = useCallback((minutes: number) => {
    const current = positionRef.current.currentIndex;
    if (current < 0) return;
    const next = itemsRef.current.map((item, index) => index === current
      ? { ...item, durationSeconds: item.durationSeconds + minutes * 60 }
      : item);
    commitItems(next, current);
    setPromptIndex(null);
    announce(`Extended ${next[current].label} by ${minutes} minutes`);
  }, [announce, commitItems]);

  const adjustItemByMinute = useCallback((direction: -1 | 1, focusedIndex?: number) => {
    const liveItems = itemsRef.current;
    const targetIndex = focusedIndex ?? positionRef.current.currentIndex;
    const target = liveItems[targetIndex];
    if (!target) return;

    const durationSeconds = Math.max(1, target.durationSeconds + direction * 60);
    if (durationSeconds === target.durationSeconds) {
      announce(`${target.label} cannot be shortened further`);
      return;
    }

    const next = liveItems.map((item, index) => index === targetIndex
      ? { ...item, durationSeconds }
      : item);
    commitItems(next, focusedIndex);
    setPromptIndex(null);
    announce(`${target.label} is now ${formatDuration(durationSeconds)}`);
  }, [announce, commitItems]);

  const skipCurrent = useCallback(() => {
    const current = positionRef.current.currentIndex;
    const liveItems = itemsRef.current;
    if (current < 0 || !liveItems[current]) return;
    const nextBoundary = itemStart(liveItems, current) + liveItems[current].durationSeconds;
    timer.setElapsedSeconds(nextBoundary);
    setPromptIndex(null);
    announce(`Skipped ${liveItems[current].label}`);
  }, [announce, timer.setElapsedSeconds]);

  const restart = useCallback(() => {
    warnedItems.current.clear();
    setPromptIndex(null);
    timer.restart();
    announce("Timeline restarted");
  }, [announce, timer.restart]);

  const focusTimelineItem = useCallback((index: number) => {
    const next = Math.max(0, Math.min(index, itemsRef.current.length - 1));
    setSelectedIndex(next);
    requestAnimationFrame(() => {
      timelineRef.current?.querySelector<HTMLElement>(`[data-timeline-index="${next}"]`)?.focus();
    });
  }, []);

  const removeSelected = useCallback(() => {
    if (settingsRef.current.locked) return;
    const index = selectedRef.current;
    const liveItems = itemsRef.current;
    if (!liveItems[index]) return;
    const removed = liveItems[index];
    commitItems(liveItems.filter((_, itemIndex) => itemIndex !== index), index - 1);
    announce(`Removed ${removed.label}`);
  }, [announce, commitItems]);

  const duplicateSelected = useCallback(() => {
    if (settingsRef.current.locked) return;
    const index = selectedRef.current;
    const liveItems = itemsRef.current;
    if (!liveItems[index]) return;
    const copy = { ...liveItems[index], id: `${liveItems[index].id}-copy-${Date.now()}` };
    const next = [...liveItems.slice(0, index + 1), copy, ...liveItems.slice(index + 1)];
    commitItems(next, index + 1);
    announce(`Duplicated ${copy.label}`);
  }, [announce, commitItems]);

  const moveSelected = useCallback((offset: -1 | 1) => {
    if (settingsRef.current.locked) return;
    const index = selectedRef.current;
    const target = index + offset;
    const liveItems = itemsRef.current;
    if (index < 0 || target < 0 || target >= liveItems.length) return;
    const next = [...liveItems];
    [next[index], next[target]] = [next[target], next[index]];
    commitItems(next, target);
    requestAnimationFrame(() => focusTimelineItem(target));
  }, [commitItems, focusTimelineItem]);

  const newItem = useCallback(() => {
    if (settingsRef.current.locked) return;
    const index = itemsRef.current.length;
    const next = [...itemsRef.current, { id: `item-new-${Date.now()}`, label: "New item", durationSeconds: 300 }];
    commitItems(next, index);
    setEditingIndex(index);
  }, [commitItems]);

  const toggleCompactMode = useCallback(() => {
    setPanel(null);
    setEditingIndex(null);
    setPromptIndex(null);
    setSettings((value) => {
      const compactMode = !value.compactMode;
      announce(compactMode ? "Compact mode enabled" : "Compact mode disabled");
      return { ...value, compactMode };
    });
  }, [announce]);

  const resetAppearanceSettings = useCallback(() => {
    resetWindowDimensionsRef.current = true;
    setSettings(restoreDefaultAppearance);
    setWindowSizeResetKey((value) => value + 1);
    announce("Appearance and layout reset");
  }, [announce]);

  const resetAllSettings = useCallback(() => {
    resetWindowDimensionsRef.current = true;
    setSettings({ ...DEFAULT_SETTINGS });
    setWindowSizeResetKey((value) => value + 1);
    announce("All settings reset");
  }, [announce]);

  const dockToEdge = useCallback((edge: Settings["edge"]) => {
    setSettings((value) => ({ ...value, edge }));
    announce(`Docked to the ${edge} edge`);
  }, [announce]);

  const closeApp = useCallback(() => {
    void closeWindow().catch((error) => announce(`Could not close the window: ${String(error)}`));
  }, [announce]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;
      const target = event.target as HTMLElement | null;
      const typing = target?.matches("input, textarea, select, [contenteditable='true']") ?? false;

      if (event.key === "Escape") {
        const hasOverlay = panelRef.current !== null || editingIndex !== null || promptRef.current !== null;
        setPanel(null);
        setEditingIndex(null);
        setPromptIndex(null);
        if (!hasOverlay) target?.closest<HTMLElement>("[data-timeline-index]")?.blur();
        return;
      }
      if (modifier && key === "e") {
        event.preventDefault();
        if (!settingsRef.current.locked) setPanel("agenda");
        return;
      }
      if (modifier && event.altKey && key === "c") {
        event.preventDefault();
        toggleCompactMode();
        return;
      }
      if (typing || panelRef.current || editingIndex !== null) return;

      if (promptRef.current !== null && ["1", "2", "3", "4"].includes(event.key)) {
        event.preventDefault();
        extendCurrent([3, 5, 10, 15][Number(event.key) - 1]);
        return;
      }
      if (modifier && key === "n") {
        event.preventDefault();
        newItem();
      } else if (modifier && key === "d") {
        event.preventDefault();
        duplicateSelected();
      } else if (modifier && key === "p") {
        event.preventDefault();
        timer.toggle();
      } else if (modifier && key === "r") {
        event.preventDefault();
        restart();
      } else if (modifier && key === "l") {
        event.preventDefault();
        focusTimelineItem(selectedRef.current);
      } else if (modifier && key === "k") {
        event.preventDefault();
        setSettings((value) => ({ ...value, locked: !value.locked }));
      } else if (modifier && event.key === ",") {
        event.preventDefault();
        setPanel("settings");
      } else if (modifier && event.key === "ArrowUp") {
        event.preventDefault();
        moveSelected(-1);
      } else if (modifier && event.key === "ArrowDown") {
        event.preventDefault();
        moveSelected(1);
      } else if (event.altKey && event.shiftKey && event.key.startsWith("Arrow")) {
        event.preventDefault();
        const edge = ({ ArrowUp: "top", ArrowDown: "bottom", ArrowLeft: "left", ArrowRight: "right" } as Record<string, Settings["edge"]>)[event.key];
        setSettings((value) => ({ ...value, edge }));
      } else if (event.key === " ") {
        event.preventDefault();
        timer.toggle();
      } else if (event.key === "Enter") {
        if (!settingsRef.current.locked && itemsRef.current[selectedRef.current]) setEditingIndex(selectedRef.current);
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removeSelected();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        focusTimelineItem(selectedRef.current - 1);
      } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        focusTimelineItem(selectedRef.current + 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        focusTimelineItem(0);
      } else if (event.key === "End") {
        event.preventDefault();
        focusTimelineItem(itemsRef.current.length - 1);
      } else if (event.key === "+" || event.key === "=" || event.code === "NumpadAdd" || event.code === "Equal") {
        event.preventDefault();
        const focusedSegment = target?.closest<HTMLElement>("[data-timeline-index]");
        const focusedIndex = focusedSegment ? Number(focusedSegment.dataset.timelineIndex) : undefined;
        adjustItemByMinute(1, Number.isInteger(focusedIndex) ? focusedIndex : undefined);
      } else if (event.key === "-" || event.key === "_" || event.code === "NumpadSubtract" || event.code === "Minus") {
        event.preventDefault();
        const focusedSegment = target?.closest<HTMLElement>("[data-timeline-index]");
        const focusedIndex = focusedSegment ? Number(focusedSegment.dataset.timelineIndex) : undefined;
        adjustItemByMinute(-1, Number.isInteger(focusedIndex) ? focusedIndex : undefined);
      } else if (key === "s") {
        event.preventDefault();
        skipCurrent();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [adjustItemByMinute, duplicateSelected, editingIndex, extendCurrent, focusTimelineItem, moveSelected, newItem, removeSelected, restart, skipCurrent, timer.toggle, toggleCompactMode]);

  const stateLabel = position.isComplete ? "Complete" : timer.running ? "Running" : timer.elapsedSeconds > 0 ? "Paused" : "Ready";
  const playbackState: PlaybackState = timer.running
    ? "playing"
    : timer.elapsedSeconds > 0 && !position.isComplete ? "paused" : "stopped";
  const remaining = currentItem ? position.currentRemainingSeconds : 0;
  const totalRemaining = Math.max(0, totalSeconds - position.elapsedSeconds);

  return (
    <main className="app-shell" data-locked={settings.locked} data-compact={compactActive}>
      <div className="hud" data-tauri-drag-region={!settings.locked ? "true" : undefined}>
        <header className="topline" data-tauri-drag-region={!settings.locked ? "true" : undefined}>
          <div className="identity" data-tauri-drag-region={!settings.locked ? "true" : undefined}>
            <span className={timer.running ? "status-dot running" : "status-dot"} />
            <span className="app-name">Timeline Timer</span>
          </div>
          <div className="now" aria-live="polite">
            {currentItem && <span className="now-label">{currentItem.label}</span>}
            <strong>{clock(remaining)}</strong>
          </div>
          <nav className="window-actions" aria-label="Application actions">
            <button className="icon-button" type="button" disabled={settings.locked} onClick={() => setPanel("agenda")} title="Edit agenda · Ctrl+E" aria-label="Edit agenda"><EditIcon /></button>
            <button className="icon-button" type="button" onClick={toggleCompactMode} title="Enter compact mode · Ctrl+Alt+C" aria-label="Enter compact mode"><CompactIcon /></button>
            <button className="icon-button" type="button" onClick={() => setPanel("settings")} title="Settings · Ctrl+," aria-label="Open settings"><SettingsIcon /></button>
            <button className="icon-button" type="button" onClick={closeApp} title="Close Timeline Timer" aria-label="Close Timeline Timer"><CloseIcon /></button>
          </nav>
        </header>

        <section className="timeline-region" aria-label="Timeline timer">
          <Timeline
            ref={timelineRef}
            items={items}
            position={position}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onEdit={setEditingIndex}
            locked={settings.locked}
            edge={settings.edge}
            playbackState={playbackState}
            labelCharacterLimit={compactActive ? settings.compactLabelChars : undefined}
          />
        </section>

        {compactActive && (
          <div className="compact-clocks">
            {settings.compactShowElapsed && (
              <output className="compact-total-clock" aria-label={`${clock(position.elapsedSeconds)} total passed`}>
                <span>Passed</span>
                <strong>{clock(position.elapsedSeconds)}</strong>
              </output>
            )}
            {settings.compactShowRemaining && (
              <output className="compact-total-clock" aria-label={`${clock(totalRemaining)} total remaining`}>
                <span>Left</span>
                <strong>{clock(totalRemaining)}</strong>
              </output>
            )}
            <output className="compact-clock" aria-label={`${stateLabel}, ${clock(remaining)} current item remaining`}>
              {clock(remaining)}
            </output>
          </div>
        )}

        {compactActive && (
          <div className="compact-window-controls" role="group" aria-label="Docking and compact mode controls">
            {(["top", "right", "bottom", "left"] as const).map((edge) => (
              <button
                className="icon-button compact-edge-button"
                type="button"
                key={edge}
                data-dock-edge={edge}
                disabled={settings.edge === edge}
                onClick={() => dockToEdge(edge)}
                title={settings.edge === edge ? `Docked to the ${edge} edge` : `Dock to the ${edge} edge`}
                aria-label={`Dock to the ${edge} edge`}
                aria-pressed={settings.edge === edge}
              >
                <ArrowIcon />
              </button>
            ))}
            <button
              className="icon-button compact-exit-button"
              type="button"
              onClick={toggleCompactMode}
              title="Exit compact mode · Ctrl+Alt+C"
              aria-label="Exit compact mode"
              aria-pressed="true"
            >
              <ExpandIcon />
            </button>
          </div>
        )}

        <footer className="command-strip">
          <div className="transport">
            <button className="play-button" type="button" onClick={timer.toggle} disabled={items.length === 0} aria-label={timer.running ? "Pause timeline" : "Start timeline"}>
              {timer.running ? <PauseIcon /> : <PlayIcon />}
              <span>{timer.running ? "Pause" : timer.elapsedSeconds > 0 ? "Resume" : "Start"}</span>
              <kbd>Space</kbd>
            </button>
            <button className="text-button" type="button" onClick={restart} title="Restart · Ctrl+R"><RestartIcon />Restart</button>
          </div>
          <div className="quick-actions">
            <button className="text-button" type="button" onClick={() => adjustItemByMinute(-1)} disabled={!currentItem}>−1 min <kbd>−</kbd></button>
            <button className="text-button" type="button" onClick={() => adjustItemByMinute(1)} disabled={!currentItem}>+1 min <kbd>+</kbd></button>
            <button className="text-button" type="button" onClick={skipCurrent} disabled={!currentItem}>Skip <kbd>S</kbd></button>
            {settings.locked && <span className="locked-label"><LockIcon /> Locked</span>}
          </div>
          <span className="overall-time">{clock(position.elapsedSeconds)} <i>/</i> {formatDuration(totalSeconds || 0)}</span>
        </footer>
      </div>

      {panel === "agenda" && !settings.locked && (
        <AgendaEditor
          value={agendaText}
          itemCount={items.length}
          totalLabel={formatDuration(totalSeconds || 0)}
          onChange={setAgendaText}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "settings" && (
        <SettingsPanel
          settings={settings}
          customCssPath={customCssPath}
          onChange={setSettings}
          onResetAppearance={resetAppearanceSettings}
          onResetAll={resetAllSettings}
          onClose={() => setPanel(null)}
        />
      )}
      {editingIndex !== null && items[editingIndex] && !settings.locked && (
        <ItemEditor
          item={items[editingIndex]}
          onClose={() => setEditingIndex(null)}
          onSave={(label, durationSeconds) => {
            commitItems(items.map((item, index) => index === editingIndex ? { ...item, label, durationSeconds } : item), editingIndex);
            setEditingIndex(null);
            announce("Item updated");
          }}
        />
      )}
      {!compactActive && !settings.compactMode && promptIndex !== null && items[promptIndex] && (
        <TimePrompt
          item={items[promptIndex]}
          secondsRemaining={position.currentRemainingSeconds}
          onExtend={extendCurrent}
          onSkip={skipCurrent}
          onDismiss={() => setPromptIndex(null)}
        />
      )}
      <div className="sr-status" role="status" aria-live="polite">{status}</div>
    </main>
  );
}
