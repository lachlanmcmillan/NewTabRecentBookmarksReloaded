import { Component } from 'preact';
import { browserAPI, type StorageChanges } from '../../browser-adapter';
import {
  configDefaults,
  normalizeConfig,
  clampRecentBookmarksCount,
  RECENT_BOOKMARKS_MIN,
  RECENT_BOOKMARKS_MAX,
  type Config,
} from '../../config';
import { Modal, ModalTitle, ModalBody, ModalActions } from '../Modal/Modal';
import { ModalButton } from '../ModalButton/ModalButton';
import { FolderTree } from '../FolderTree/FolderTree';
import styles from './settingsModal.module.css';

interface SettingsModalProps {
  onClose: () => void;
}

interface SettingsModalState {
  config: Config;
  /** Text currently in the count input; may be invalid while typing. */
  countDraft: string;
  pinnedFolders: string[];
}

type BooleanConfigKey = {
  [K in keyof Config]: Config[K] extends boolean ? K : never;
}[keyof Config];

const SORTING_SETTINGS: {
  key: BooleanConfigKey;
  label: string;
  description: string;
}[] = [
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
export class SettingsModal extends Component<
  SettingsModalProps,
  SettingsModalState
> {
  constructor(props: SettingsModalProps) {
    super(props);
    this.state = {
      config: { ...configDefaults },
      countDraft: String(configDefaults.recentBookmarksCount),
      pinnedFolders: [],
    };
  }

  async componentDidMount() {
    browserAPI.storage.onChanged.addListener(this.onStorageChange);
    const stored = await browserAPI.storage.local.get({
      ...configDefaults,
      pinnedFolders: [] as string[],
    });
    const { pinnedFolders, ...rawConfig } = stored;
    const config = normalizeConfig(rawConfig);
    this.setState({
      config,
      countDraft: String(config.recentBookmarksCount),
      pinnedFolders,
    });
  }

  componentWillUnmount() {
    browserAPI.storage.onChanged.removeListener(this.onStorageChange);
  }

  /** Keep the pin checkboxes in sync if folders are pinned elsewhere (e.g. from a column heading). */
  onStorageChange = (changes: StorageChanges) => {
    if (changes.pinnedFolders) {
      const value = changes.pinnedFolders.newValue;
      this.setState({ pinnedFolders: Array.isArray(value) ? value : [] });
    }
  };

  onTogglePin = (folderId: string, pinned: boolean) => {
    const current = this.state.pinnedFolders;
    const next = pinned
      ? current.includes(folderId)
        ? current
        : current.concat([folderId])
      : current.filter(id => id !== folderId);
    this.setState({ pinnedFolders: next });
    browserAPI.storage.local.set({ pinnedFolders: next });
  };

  onToggle = (key: BooleanConfigKey, value: boolean) => {
    this.setState({ config: { ...this.state.config, [key]: value } });
    browserAPI.storage.local.set({ [key]: value });
  };

  onCountInput = (value: string) => {
    this.setState({ countDraft: value });
  };

  /** Commit the count once editing finishes (blur / Enter / spinner). */
  onCountChange = (value: string) => {
    const count =
      value.trim() === ''
        ? configDefaults.recentBookmarksCount
        : clampRecentBookmarksCount(value);
    this.setState({
      config: { ...this.state.config, recentBookmarksCount: count },
      countDraft: String(count),
    });
    browserAPI.storage.local.set({ recentBookmarksCount: count });
  };

  render(
    { onClose }: SettingsModalProps,
    { config, countDraft, pinnedFolders }: SettingsModalState
  ) {
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

            <h4 class={styles.heading}>Recent bookmarks</h4>
            <div class={styles.group + ' ' + styles.numberGroup}>
              <label class={styles.label} for="settings-recent-count">
                <span class={styles.labelText}>Number of recent bookmarks</span>
                <input
                  id="settings-recent-count"
                  class={styles.number}
                  type="number"
                  min={RECENT_BOOKMARKS_MIN}
                  max={RECENT_BOOKMARKS_MAX}
                  step={1}
                  value={countDraft}
                  onInput={e => this.onCountInput(e.currentTarget.value)}
                  onChange={e => this.onCountChange(e.currentTarget.value)}
                />
              </label>
              <p class={styles.description}>
                How many bookmarks to show in the Recent group (
                {RECENT_BOOKMARKS_MIN}–{RECENT_BOOKMARKS_MAX}).
              </p>
            </div>

            <h4 class={styles.heading}>Pinned folders</h4>
            <p class={styles.sectionDescription}>
              Pinned folders appear as columns on the new tab page.
            </p>
            <div class={styles.group}>
              <FolderTree
                pinnedFolders={pinnedFolders}
                onTogglePin={this.onTogglePin}
              />
            </div>

            <h4 class={styles.heading}>Sorting</h4>
            {SORTING_SETTINGS.map(s => (
              <div class={styles.group} key={s.key}>
                <label class={styles.label}>
                  <input
                    class={styles.checkbox}
                    type="checkbox"
                    checked={config[s.key]}
                    onChange={e =>
                      this.onToggle(s.key, e.currentTarget.checked)
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
