import type { JSX } from 'preact';
import { SvgIcon, type IconName } from '../SvgIcon/SvgIcon';
import styles from './iconButton.module.css';

interface IconButtonProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'icon' | 'class'
> {
  icon: IconName;
  class?: string;
}

/** Small square button showing a single SvgIcon. */
export function IconButton({
  icon,
  class: className,
  ...props
}: IconButtonProps) {
  return (
    <button
      class={className ? styles.button + ' ' + className : styles.button}
      {...props}
    >
      <SvgIcon name={icon} />
    </button>
  );
}
