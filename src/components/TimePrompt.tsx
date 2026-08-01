import type { TimelineItem } from "../types";

interface TimePromptProps {
  item: TimelineItem;
  secondsRemaining: number;
  onExtend: (minutes: number) => void;
  onSkip: () => void;
  onDismiss: () => void;
}

const increments = [3, 5, 10, 15];

export function TimePrompt({ item, secondsRemaining, onExtend, onSkip, onDismiss }: TimePromptProps) {
  return (
    <aside className="time-prompt" role="alertdialog" aria-labelledby="prompt-title" aria-describedby="prompt-copy">
      <div className="prompt-copy">
        <strong id="prompt-title">{item.label}</strong>
        <span id="prompt-copy">{Math.max(0, Math.ceil(secondsRemaining))} seconds remaining</span>
      </div>
      <div className="prompt-actions">
        {increments.map((minutes, index) => (
          <button type="button" key={minutes} onClick={() => onExtend(minutes)}>
            +{minutes}<kbd>{index + 1}</kbd>
          </button>
        ))}
        <button type="button" onClick={onSkip}>Skip<kbd>S</kbd></button>
        <button className="prompt-dismiss" type="button" onClick={onDismiss} aria-label="Dismiss prompt">×</button>
      </div>
    </aside>
  );
}
