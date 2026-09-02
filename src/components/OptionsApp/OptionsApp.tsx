import { Component } from 'preact';
import { browserAPI } from '../../browser-adapter';
import { configDefaults, type Config } from '../../config';
import { OptionCheckbox } from '../OptionCheckbox/OptionCheckbox';
import styles from './optionsApp.module.css';

/** Options page opened from the browser's add-on manager. */
export class OptionsApp extends Component<{}, Config> {
  constructor(props: {}) {
    super(props);
    this.state = { ...configDefaults };
  }

  async componentDidMount() {
    const items = await browserAPI.storage.local.get(configDefaults);
    this.setState(items);
  }

  onChange = (configKey: keyof Config, value: boolean) => {
    this.setState({ [configKey]: value } as Partial<Config>);
    browserAPI.storage.local.set({ [configKey]: value });
  };

  render(_props: {}, state: Config) {
    return (
      <form class={styles.form}>
        <h3>Sorting</h3>
        <OptionCheckbox
          configKey="recentBookmarksReversed"
          label="Newest recent bookmark first"
          description="List recent bookmarks in reverse chronological order."
          checked={state.recentBookmarksReversed}
          onChange={this.onChange}
        />
        <OptionCheckbox
          configKey="bookmarkFoldersReversed"
          label="Reverse bookmarks in folders"
          description="List bookmark folders in reverse order."
          checked={state.bookmarkFoldersReversed}
          onChange={this.onChange}
        />
      </form>
    );
  }
}
