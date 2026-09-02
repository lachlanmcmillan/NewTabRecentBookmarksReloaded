import { Component, type ComponentChildren } from 'preact';
import styles from './modal.module.css';

interface ModalProps {
  /** id of the element that titles the dialog, for aria-labelledby. */
  labelledBy: string;
  onClose: () => void;
  children: ComponentChildren;
}

/**
 * Dimmed overlay plus centred dialog. Closes on Escape or a click on the
 * backdrop. Children supply the content; use ModalTitle, ModalBody and
 * ModalActions for the standard layout.
 */
export class Modal extends Component<ModalProps> {
  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.props.onClose();
  };

  onOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) this.props.onClose();
  };

  render({ children, labelledBy }: ModalProps) {
    return (
      <div
        class={styles.overlay}
        role="presentation"
        onClick={this.onOverlayClick}
      >
        <div class={styles.dialog} role="dialog" aria-labelledby={labelledBy}>
          {children}
        </div>
      </div>
    );
  }
}

export function ModalTitle({
  id,
  children,
}: {
  id: string;
  children: ComponentChildren;
}) {
  return (
    <h3 id={id} class={styles.title}>
      {children}
    </h3>
  );
}

export function ModalBody({
  class: className,
  children,
}: {
  class?: string;
  children: ComponentChildren;
}) {
  return (
    <div class={className ? styles.body + ' ' + className : styles.body}>
      {children}
    </div>
  );
}

export function ModalActions({ children }: { children: ComponentChildren }) {
  return <section class={styles.actions}>{children}</section>;
}
