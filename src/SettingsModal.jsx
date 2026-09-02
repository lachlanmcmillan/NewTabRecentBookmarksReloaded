import { Component } from 'preact';
import { browserAPI } from './browser-adapter.js';
import { configDefaults } from './config.js';

const SETTINGS = [
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

export class SettingsModal extends Component {
  constructor(props) {
    super(props);
    this.state = { ...configDefaults };
  }

  async componentDidMount() {
    var items = await browserAPI.storage.local.get(configDefaults);
    this.setState(items);
    document.addEventListener('keydown', this.onKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = e => {
    if (e.key === 'Escape') this.props.onClose();
  };

  onOverlayClick = e => {
    if (e.target === e.currentTarget) this.props.onClose();
  };

  onChange = (key, value) => {
    this.setState({ [key]: value });
    browserAPI.storage.local.set({ [key]: value });
  };

  render(props, state) {
    return (
      <div class="settings-modal-wrapper edit-topsites-wrapper">
        <div class="edit-topsites">
          <div
            class="modalOverlayOuter active"
            role="presentation"
            onClick={this.onOverlayClick}
          >
            <div class="modal" role="dialog" aria-labelledby="settings-title">
              <form
                class="settings-form topsite-form"
                onSubmit={e => {
                  e.preventDefault();
                  props.onClose();
                }}
              >
                <div class="form-input-container">
                  <h3 id="settings-title" class="section-title grey-title">
                    Settings
                  </h3>
                  <div class="form-wrapper">
                    <h4 class="settings-heading">Sorting</h4>
                    {SETTINGS.map(s => (
                      <div class="settings-group" key={s.key}>
                        <label>
                          <input
                            type="checkbox"
                            checked={state[s.key]}
                            onChange={e =>
                              this.onChange(s.key, e.target.checked)
                            }
                          />
                          <span>{s.label}</span>
                        </label>
                        <p class="settings-description">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <section class="actions">
                  <button class="done" type="submit">
                    Done
                  </button>
                </section>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
