import type { JSX } from 'preact';
import styles from './modalButton.module.css';

interface ModalButtonProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'class'
> {
  /** Visual emphasis. Omit for a plain secondary button. */
  variant?: 'primary' | 'danger';
  class?: string;
}

function cx(...names: (string | false | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}

/** Button for a modal's action row. */
export function ModalButton({
  variant,
  class: className,
  ...props
}: ModalButtonProps) {
  return (
    <button
      class={cx(styles.button, variant && styles[variant], className)}
      {...props}
    />
  );
}
