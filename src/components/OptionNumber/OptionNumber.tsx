import styles from './optionNumber.module.css';

interface OptionNumberProps {
  id: string;
  label: string;
  description: string;
  value: string;
  min: number;
  max: number;
  /** Fired on every keystroke with the raw text. */
  onInput: (value: string) => void;
  /** Fired when editing finishes (blur, Enter, spinner). */
  onChange: (value: string) => void;
}

export function OptionNumber({
  id,
  label,
  description,
  value,
  min,
  max,
  onInput,
  onChange,
}: OptionNumberProps) {
  return (
    <div class={styles.group}>
      <label class={styles.label} for={id}>
        <span>{label}</span>
        <input
          id={id}
          class={styles.number}
          type="number"
          min={min}
          max={max}
          step={1}
          value={value}
          onInput={e => onInput(e.currentTarget.value)}
          onChange={e => onChange(e.currentTarget.value)}
        />
      </label>
      <p class={styles.description}>
        <em>{description}</em>
      </p>
    </div>
  );
}
