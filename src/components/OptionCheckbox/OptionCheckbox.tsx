import type { Config } from '../../config';
import styles from './optionCheckbox.module.css';

interface OptionCheckboxProps {
  configKey: keyof Config;
  label: string;
  description: string;
  checked: boolean;
  onChange: (configKey: keyof Config, value: boolean) => void;
}

export function OptionCheckbox({
  configKey,
  label,
  description,
  checked,
  onChange,
}: OptionCheckboxProps) {
  return (
    <div class={styles.group}>
      <label class={styles.label}>
        <input
          class={styles.checkbox}
          type="checkbox"
          checked={checked}
          onChange={e => onChange(configKey, e.currentTarget.checked)}
        />
        <span>{label}</span>
      </label>
      <p class={styles.description}>
        <em>{description}</em>
      </p>
    </div>
  );
}
