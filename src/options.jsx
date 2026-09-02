import { render, Component } from 'preact';
import { browserAPI } from './browser-adapter.js';
import { configDefaults } from './config.js';

class OptionCheckbox extends Component {
  render({ configKey, label, description, checked, onChange }) {
    return (
      <div class="settings-group">
        <label>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(configKey, e.target.checked)}
          />
          <span class="bold">{label}</span>
        </label>
        <p>
          <em>{description}</em>
        </p>
      </div>
    );
  }
}

class OptionsApp extends Component {
  constructor(props) {
    super(props);
    this.state = { ...configDefaults };
  }

  async componentDidMount() {
    var items = await browserAPI.storage.local.get(configDefaults);
    this.setState(items);
  }

  onChange = (configKey, value) => {
    this.setState({ [configKey]: value });
    var update = {};
    update[configKey] = value;
    browserAPI.storage.local.set(update);
  };

  render(props, state) {
    return (
      <form>
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

render(<OptionsApp />, document.body);
