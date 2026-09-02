import { Component } from 'preact';
import { browserAPI } from '../../browser-adapter';
import { configDefaults, type Config } from '../../config';
import { Modal, ModalTitle, ModalBody, ModalActions } from '../Modal/Modal';
import { ModalButton } from '../ModalButton/ModalButton';
import styles from './settingsModal.module.css';

interface SettingsModalProps {
  onClose: () => void;
}

const SETTINGS: { key: keyof Config; label: string; description: string }[] = [
  {
    key: 'recentBookmarksReversed',
    label: 'Newest recent bookmark first',
    description: 'List recent bookmarks in reverse chronological order.',
  },
  {
    key: 'bookmarkFoldersReversed',
    label: 'Reverse bookmarks in folders',
    description: 'List bookmark folders in reverse order.',
  },
];

/** Settings dialog on the new tab page. Changes are saved as they are made. */
export class SettingsModal extends Component<SettingsModalProps, Config> {
  constructor(props: SettingsModalProps) {
    super(props);
    this.state = { ...configDefaults };
  }

  async componentDidMount() {
    const items = await browserAPI.storage.local.get(configDefaults);
    this.setState(items);
  }

  onChange = (key: keyof Config, value: boolean) => {
    this.setState({ [key]: value } as Partial<Config>);
    browserAPI.storage.local.set({ [key]: value });
  };

  render({ onClose }: SettingsModalProps, state: Config) {
    return (
      <Modal onClose={onClose} labelledBy="settings-title">
        <form
          onSubmit={e => {
            e.preventDefault();
            onClose();
          }}
        >
          <ModalBody class={styles.body}>
            <ModalTitle id="settings-title">Settings</ModalTitle>
            <h4 class={styles.heading}>Sorting</h4>
            {SETTINGS.map(s => (
              <div class={styles.group} key={s.key}>
                <label class={styles.label}>
                  <input
                    class={styles.checkbox}
                    type="checkbox"
                    checked={state[s.key]}
                    onChange={e =>
                      this.onChange(s.key, e.currentTarget.checked)
                    }
                  />
                  <span>{s.label}</span>
                </label>
                <p class={styles.description}>{s.description}</p>
              </div>
            ))}
          </ModalBody>
          <ModalActions>
            <ModalButton variant="primary" type="submit">
              Done
            </ModalButton>
          </ModalActions>
        </form>
      </Modal>
    );
  }
}
