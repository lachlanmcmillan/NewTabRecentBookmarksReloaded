import { Component } from 'preact';
import { browserAPI, detectFolder, type Bookmark } from '../../browser-adapter';
import styles from './folderTree.module.css';

interface FolderTreeProps {
  /** IDs of folders that are currently pinned. */
  pinnedFolders: string[];
  onTogglePin: (folderId: string, pinned: boolean) => void;
}

interface FolderRow {
  id: string;
  title: string;
  /** Nesting depth; top-level folders such as "Bookmarks Toolbar" are 0. */
  depth: number;
}

interface FolderTreeState {
  /** Every bookmark folder, in tree order. null until loaded. */
  folders: FolderRow[] | null;
}

const INDENT_PX = 20;

/** Flatten the bookmark tree into folders only, depth-first, skipping the invisible root. */
function collectFolders(nodes: Bookmark[], depth: number, out: FolderRow[]) {
  for (const node of nodes) {
    if (!detectFolder(node)) continue;
    const isRoot = depth === 0 && !node.parentId;
    if (!isRoot) {
      out.push({ id: node.id, title: node.title || '(untitled)', depth });
    }
    if (node.children) {
      collectFolders(node.children, isRoot ? depth : depth + 1, out);
    }
  }
  return out;
}

/** Scrollable list of every bookmark folder with a pin checkbox per row. */
export class FolderTree extends Component<FolderTreeProps, FolderTreeState> {
  constructor(props: FolderTreeProps) {
    super(props);
    this.state = { folders: null };
  }

  async componentDidMount() {
    browserAPI.bookmarks.onCreated.addListener(this.load);
    browserAPI.bookmarks.onRemoved.addListener(this.load);
    browserAPI.bookmarks.onMoved.addListener(this.load);
    await this.load();
  }

  componentWillUnmount() {
    browserAPI.bookmarks.onCreated.removeListener(this.load);
    browserAPI.bookmarks.onRemoved.removeListener(this.load);
    browserAPI.bookmarks.onMoved.removeListener(this.load);
  }

  load = async () => {
    const tree = await browserAPI.bookmarks.getTree();
    this.setState({ folders: collectFolders(tree, 0, []) });
  };

  render(
    { pinnedFolders, onTogglePin }: FolderTreeProps,
    { folders }: FolderTreeState
  ) {
    return (
      <div class={styles.list}>
        {folders === null && <p class={styles.message}>Loading folders…</p>}
        {folders !== null && folders.length === 0 && (
          <p class={styles.message}>No bookmark folders found.</p>
        )}
        {folders?.map(folder => (
          <label
            key={folder.id}
            class={styles.row}
            style={{ paddingLeft: 8 + folder.depth * INDENT_PX + 'px' }}
          >
            <input
              class={styles.checkbox}
              type="checkbox"
              checked={pinnedFolders.includes(folder.id)}
              onChange={e => onTogglePin(folder.id, e.currentTarget.checked)}
            />
            <span class={styles.icon} aria-hidden="true" />
            <span class={styles.title}>{folder.title}</span>
          </label>
        ))}
      </div>
    );
  }
}
