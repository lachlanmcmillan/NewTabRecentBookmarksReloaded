import { Component } from 'preact';
import { browserAPI, detectFolder } from './browser-adapter.js';
import { SvgIcon } from './icons.jsx';

function getAllFolders() {
  return browserAPI.bookmarks.getTree().then(function (items) {
    var root = items[0];
    var folderList = [];
    function visit(bookmark) {
      var isChromeRoot = bookmark.id === '0';
      if (detectFolder(bookmark) || isChromeRoot) {
        if (
          bookmark.id !== 'root________' &&
          bookmark.id !== 'mobile______' &&
          !isChromeRoot
        ) {
          folderList.push(bookmark);
        }
        if (Array.isArray(bookmark.children)) {
          bookmark.children.forEach(visit);
        }
      }
    }
    visit(root);
    return folderList;
  });
}

function sortFolders(folderList) {
  var prefOrder = [
    'toolbar_____',
    'menu________',
    'unfiled_____',
    'mobile______',
  ];
  return folderList.sort(function (a, b) {
    var aPref = prefOrder.indexOf(a.id);
    var bPref = prefOrder.indexOf(b.id);
    if (aPref === -1 && bPref === -1)
      return b.dateGroupModified - a.dateGroupModified;
    if (aPref >= 0 && bPref === -1) return -1;
    if (aPref === -1 && bPref >= 0) return 1;
    return aPref - bPref;
  });
}

export class EditBookmarkModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      url: '',
      parentId: '',
      originalParentId: '',
      folders: [],
    };
  }

  async componentDidMount() {
    var items = await browserAPI.bookmarks.get([this.props.bookmarkId]);
    var bookmark = items[0];
    var folders = await getAllFolders();
    sortFolders(folders);
    this.setState({
      title: bookmark.title,
      url: bookmark.url || '',
      parentId: bookmark.parentId,
      originalParentId: bookmark.parentId,
      folders: folders,
    });
  }

  onSubmit = async (e) => {
    e.preventDefault();
    var { bookmarkId, onClose } = this.props;
    var { title, url, parentId, originalParentId } = this.state;

    await browserAPI.bookmarks.update(bookmarkId, { title: title, url: url });
    if (parentId && parentId !== originalParentId) {
      await browserAPI.bookmarks.move(bookmarkId, { parentId: parentId });
    }
    onClose();
  };

  onDelete = async () => {
    await browserAPI.bookmarks.remove(this.props.bookmarkId);
    this.props.onClose();
  };

  render(props, state) {
    return (
      <div class="edit-bookmark-wrapper edit-topsites-wrapper">
        <div class="edit-bookmark edit-topsites">
          <div class="modalOverlayOuter active" role="presentation">
            <div class="modal">
              <form class="edit-bookmark-form topsite-form" onSubmit={this.onSubmit}>
                <button
                  class="edit-bookmark-delete danger"
                  type="button"
                  onClick={this.onDelete}
                >
                  Delete
                </button>
                <div class="form-input-container">
                  <h3 class="section-title grey-title">Edit Bookmark</h3>
                  <div class="fields-and-preview">
                    <div class="form-wrapper">
                      <label>
                        <span>Title</span>
                        <div class="field">
                          <input
                            type="text"
                            placeholder="Enter a title"
                            value={state.title}
                            onInput={(e) =>
                              this.setState({ title: e.target.value })
                            }
                          />
                        </div>
                      </label>
                      <label>
                        <span>URL</span>
                        <div class="field url">
                          <input
                            type="text"
                            placeholder="Type or paste a URL"
                            value={state.url}
                            onInput={(e) =>
                              this.setState({ url: e.target.value })
                            }
                          />
                          <button
                            class="clear-input-button icon-button-style icon svgicon"
                            type="button"
                            onClick={() => this.setState({ url: '' })}
                          >
                            <SvgIcon name="icon-clear-input" />
                          </button>
                        </div>
                      </label>
                      <label>
                        <span>Folder</span>
                        <div class="field folder">
                          <select
                            value={state.parentId}
                            onChange={(e) =>
                              this.setState({ parentId: e.target.value })
                            }
                          >
                            {state.folders.map((folder) => (
                              <option key={folder.id} value={folder.id}>
                                {folder.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                <section class="actions">
                  <button
                    class="cancel"
                    type="button"
                    onClick={props.onClose}
                  >
                    Cancel
                  </button>
                  <button class="done" type="submit">
                    Save
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
