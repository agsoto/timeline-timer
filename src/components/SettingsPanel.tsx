import type { Edge, Settings } from "../types";
import { BellIcon, CloseIcon, LockIcon, UnlockIcon } from "./Icons";

interface SettingsPanelProps {
  settings: Settings;
  customCssPath: string;
  onChange: (settings: Settings) => void;
  onResetAppearance: () => void;
  onResetAll: () => void;
  onClose: () => void;
}

const edges: Edge[] = ["top", "bottom", "left", "right"];

export function SettingsPanel({ settings, customCssPath, onChange, onResetAppearance, onResetAll, onClose }: SettingsPanelProps) {
  return (
    <section className="surface-overlay settings-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <header className="overlay-header">
        <div>
          <p className="eyebrow">HUD settings</p>
          <h2 id="settings-title">Position & behavior</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close settings"><CloseIcon /></button>
      </header>
      <div className="settings-grid">
        <fieldset>
          <legend>Dock edge</legend>
          <div className="choice-row">
            {edges.map((edge) => (
              <button
                type="button"
                className={settings.edge === edge ? "choice active" : "choice"}
                aria-pressed={settings.edge === edge}
                key={edge}
                onClick={() => onChange({ ...settings, edge })}
              >
                {edge}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="setting-row">
          <span className="setting-label"><BellIcon /> Remaining-time prompt</span>
          <select
            value={settings.warningSeconds}
            onChange={(event) => onChange({ ...settings, warningSeconds: Number(event.target.value) })}
          >
            <option value="0">Off</option>
            <option value="10">10 seconds</option>
            <option value="15">15 seconds</option>
            <option value="30">30 seconds</option>
            <option value="60">1 minute</option>
          </select>
        </label>
        <label className="setting-row toggle-row">
          <span className="setting-label">Keep above other windows</span>
          <input
            type="checkbox"
            checked={settings.alwaysOnTop}
            onChange={(event) => onChange({ ...settings, alwaysOnTop: event.target.checked })}
          />
        </label>
        <button
          className="setting-row lock-setting"
          type="button"
          aria-pressed={settings.locked}
          onClick={() => onChange({ ...settings, locked: !settings.locked })}
        >
          <span className="setting-label">{settings.locked ? <LockIcon /> : <UnlockIcon />} Editing lock</span>
          <span>{settings.locked ? "Locked" : "Unlocked"}</span>
        </button>
        <label className="setting-row toggle-row compact-setting">
          <span className="setting-label">
            <span>Compact mode<small>Toggle with Ctrl+Alt+C</small></span>
          </span>
          <input
            type="checkbox"
            checked={settings.compactMode}
            onChange={(event) => onChange({ ...settings, compactMode: event.target.checked })}
          />
        </label>
        <label className="setting-row size-setting">
          <span className="setting-label">
            <span>Compact label length<small>Characters before three dots</small></span>
          </span>
          <span className="number-control">
            <input
              type="number"
              min="4"
              max="40"
              step="1"
              value={settings.compactLabelChars}
              onChange={(event) => onChange({
                ...settings,
                compactLabelChars: Math.max(4, Math.min(40, Number(event.target.value) || 4)),
              })}
            />
            <i>chars</i>
          </span>
        </label>
        <label className="setting-row toggle-row compact-setting">
          <span className="setting-label">
            <span>Total passed time<small>Show in Compact Mode</small></span>
          </span>
          <input
            type="checkbox"
            checked={settings.compactShowElapsed}
            onChange={(event) => onChange({ ...settings, compactShowElapsed: event.target.checked })}
          />
        </label>
        <label className="setting-row toggle-row compact-setting">
          <span className="setting-label">
            <span>Total remaining time<small>Show in Compact Mode</small></span>
          </span>
          <input
            type="checkbox"
            checked={settings.compactShowRemaining}
            onChange={(event) => onChange({ ...settings, compactShowRemaining: event.target.checked })}
          />
        </label>
        <label className="setting-row color-setting">
          <span className="setting-label">
            <span>Accent color<small>Timeline, playhead, and controls</small></span>
          </span>
          <span className="color-control">
            <input
              type="color"
              value={settings.accentColor}
              onChange={(event) => onChange({ ...settings, accentColor: event.target.value.toLowerCase() })}
              aria-label="Accent color"
            />
            <code>{settings.accentColor.toUpperCase()}</code>
          </span>
        </label>
      </div>
      <section className="reset-settings" aria-labelledby="reset-settings-title">
        <div>
          <strong id="reset-settings-title">Reset settings</strong>
          <span>Your agenda is never removed.</span>
        </div>
        <div className="reset-actions">
          <button type="button" onClick={onResetAppearance}>Reset appearance & layout</button>
          <button
            className="reset-all-button"
            type="button"
            onClick={() => {
              if (window.confirm("Reset every Timeline Timer setting to its default value? Your agenda will be kept.")) {
                onResetAll();
              }
            }}
          >
            Reset all settings
          </button>
        </div>
      </section>
      <div className="css-note">
        <span>Custom CSS loads on startup and hot reloads</span>
        <code>{customCssPath || "Available in the desktop app"}</code>
      </div>
      <details className="shortcut-sheet">
        <summary>Keyboard shortcuts <span>Show cheat sheet</span></summary>
        <div className="shortcut-grid">
          <span><kbd>Space</kbd> Play / pause</span>
          <span><kbd>Ctrl R</kbd> Stop & restart</span>
          <span><kbd>+ / −</kbd> Adjust 1 minute</span>
          <span><kbd>Arrows</kbd> Select item</span>
          <span><kbd>Enter</kbd> Edit item</span>
          <span><kbd>Delete</kbd> Remove item</span>
          <span><kbd>Ctrl N</kbd> New item</span>
          <span><kbd>Ctrl D</kbd> Duplicate item</span>
          <span><kbd>Ctrl ↑/↓</kbd> Reorder item</span>
          <span><kbd>S</kbd> Skip current</span>
          <span><kbd>Ctrl E</kbd> Edit agenda</span>
          <span><kbd>Ctrl L</kbd> Focus timeline</span>
          <span><kbd>Alt Shift Arrow</kbd> Dock edge</span>
          <span><kbd>Ctrl K</kbd> Toggle lock</span>
          <span><kbd>Ctrl Alt C</kbd> Compact mode</span>
          <span><kbd>Esc</kbd> Close / clear focus</span>
        </div>
      </details>
    </section>
  );
}
