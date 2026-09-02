import { Component } from 'preact';
import { browserAPI, detectFolder, type Bookmark } from '../../browser-adapter';
import { SvgIcon } from '../SvgIcon/SvgIcon';
import { Modal, ModalTitle, ModalBody, ModalActions } from '../Modal/Modal';
import { ModalButton } from '../ModalButton/ModalButton';
import styles from './editBookmarkModal.module.css';

interface EditBookmarkModalProps {
  bookmarkId: string;
  onClose: () => void;
}

interface EditBookmarkModalState {
  title: string;
  url: string;
  parentId: string;
  originalParentId: string;
  folders: Bookmark[];
}

/** Every folder in the bookmark tree except the invisible roots. */
async function getAllFolders(): Promise<Bookmark[]> {
  const [root] = await browserAPI.bookmarks.getTree();
  const folderList: Bookmark[] = [];
  function visit(bookmark: Bookmark) {
    const isChromeRoot = bookmark.id === '0';
    if (detectFolder(bookmark) || isChromeRoot) {
      if (
        bookmark.id !== 'root________' &&
        bookmark.id !== 'mobile______' &&
        !isChromeRoot
      ) {
        folderList.push(bookmark);
      }
      bookmark.children?.forEach(visit);
    }
  }
  visit(root);
  return folderList;
}

/** Built-in folders first, then the rest by most recently modified. */
function sortFolders(folderList: Bookmark[]): Bookmark[] {
  const prefOrder = [
    'toolbar_____',
    'menu________',
    'unfiled_____',
    'mobile______',
  ];
  return folderList.sort(function (a, b) {
    const aPref = prefOrder.indexOf(a.id);
    const bPref = prefOrder.indexOf(b.id);
    if (aPref === -1 && bPref === -1)
      return (b.dateGroupModified ?? 0) - (a.dateGroupModified ?? 0);
    if (aPref >= 0 && bPref === -1) return -1;
    if (aPref === -1 && bPref >= 0) return 1;
    return aPref - bPref;
  });
}

export class EditBookmarkModal extends Component<
  EditBookmarkModalProps,
  EditBookmarkModalState
> {
  constructor(props: EditBookmarkModalProps) {
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
    const [bookmark] = await browserAPI.bookmarks.get([this.props.bookmarkId]);
    const folders = await getAllFolders();
    sortFolders(folders);
    this.setState({
      title: bookmark.title,
      url: bookmark.url || '',
      parentId: bookmark.parentId || '',
      originalParentId: bookmark.parentId || '',
      folders: folders,
    });
  }

  onSubmit = async (e: Event) => {
    e.preventDefault();
    const { bookmarkId, onClose } = this.props;
    const { title, url, parentId, originalParentId } = this.state;

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

  render({ onClose }: EditBookmarkModalProps, state: EditBookmarkModalState) {
    return (
      <Modal onClose={onClose} labelledBy="edit-bookmark-title">
        <form class={styles.form} onSubmit={this.onSubmit}>
          <ModalButton
            variant="danger"
            class={styles.deleteButton}
            type="button"
            onClick={this.onDelete}
          >
            Delete
          </ModalButton>
          <ModalBody>
            <ModalTitle id="edit-bookmark-title">Edit Bookmark</ModalTitle>
            <label class={styles.label}>
              <span>Title</span>
              <div class={styles.field}>
                <input
                  class={styles.input}
                  type="text"
                  placeholder="Enter a title"
                  value={state.title}
                  onInput={e => this.setState({ title: e.currentTarget.value })}
                />
              </div>
            </label>
            <label class={styles.label}>
              <span>URL</span>
              <div class={styles.field}>
                <input
                  class={styles.input + ' ' + styles.urlInput}
                  type="text"
                  placeholder="Type or paste a URL"
                  value={state.url}
                  onInput={e => this.setState({ url: e.currentTarget.value })}
                />
                <button
                  class={styles.clearButton}
                  type="button"
                  title="Clear"
                  onClick={() => this.setState({ url: '' })}
                >
                  <SvgIcon name="icon-clear-input" />
                </button>
              </div>
            </label>
            <label class={styles.label}>
              <span>Folder</span>
              <div class={styles.field}>
                <select
                  class={styles.select}
                  value={state.parentId}
                  onChange={e =>
                    this.setState({ parentId: e.currentTarget.value })
                  }
                >
                  {state.folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.title}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </ModalBody>
          <ModalActions>
            <ModalButton type="button" onClick={onClose}>
              Cancel
            </ModalButton>
            <ModalButton variant="primary" type="submit">
              Save
            </ModalButton>
          </ModalActions>
        </form>
      </Modal>
    );
  }
}
