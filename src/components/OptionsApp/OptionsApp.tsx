import { Component } from 'preact';
import { browserAPI } from '../../browser-adapter';
import {
  configDefaults,
  normalizeConfig,
  clampRecentBookmarksCount,
  RECENT_BOOKMARKS_MIN,
  RECENT_BOOKMARKS_MAX,
  type Config,
} from '../../config';
import { OptionCheckbox } from '../OptionCheckbox/OptionCheckbox';
import { OptionNumber } from '../OptionNumber/OptionNumber';
import styles from './optionsApp.module.css';

interface OptionsAppState {
  config: Config;
  /** Text currently in the count input; may be invalid while typing. */
  countDraft: string;
}

/** Options page opened from the browser's add-on manager. */
export class OptionsApp extends Component<{}, OptionsAppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      config: { ...configDefaults },
      countDraft: String(configDefaults.recentBookmarksCount),
    };
  }

  async componentDidMount() {
    const config = normalizeConfig(
      await browserAPI.storage.local.get(configDefaults)
    );
    this.setState({
      config,
      countDraft: String(config.recentBookmarksCount),
    });
  }

  onToggle = (configKey: keyof Config, value: boolean) => {
    this.setState({ config: { ...this.state.config, [configKey]: value } });
    browserAPI.storage.local.set({ [configKey]: value });
  };

  onCountInput = (value: string) => {
    this.setState({ countDraft: value });
  };

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

  render(_props: {}, { config, countDraft }: OptionsAppState) {
    return (
      <form class={styles.form}>
        <h3>Recent bookmarks</h3>
        <OptionNumber
          id="option-recent-count"
          label="Number of recent bookmarks"
          description={`How many bookmarks to show in the Recent group (${RECENT_BOOKMARKS_MIN}–${RECENT_BOOKMARKS_MAX}).`}
          value={countDraft}
          min={RECENT_BOOKMARKS_MIN}
          max={RECENT_BOOKMARKS_MAX}
          onInput={this.onCountInput}
          onChange={this.onCountChange}
        />
        <h3>Appearance</h3>
        <OptionCheckbox
          configKey="showDefaultFavicon"
          label="Show default favicon"
          description="Show a globe icon for bookmarks without a favicon. When off, the space is left empty."
          checked={config.showDefaultFavicon}
          onChange={this.onToggle}
        />
        <h3>Sorting</h3>
        <OptionCheckbox
          configKey="recentBookmarksReversed"
          label="Newest recent bookmark first"
          description="List recent bookmarks in reverse chronological order."
          checked={config.recentBookmarksReversed}
          onChange={this.onToggle}
        />
        <OptionCheckbox
          configKey="bookmarkFoldersReversed"
          label="Reverse bookmarks in folders"
          description="List bookmark folders in reverse order."
          checked={config.bookmarkFoldersReversed}
          onChange={this.onToggle}
        />
      </form>
    );
  }
}
