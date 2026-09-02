import { Component } from 'preact';
import {
  isChrome,
  detectBookmark,
  detectFolder,
  getFaviconURL,
  type Bookmark,
} from '../../browser-adapter';
import { IconButton } from '../IconButton/IconButton';
import styles from './placeEntry.module.css';

export interface PlaceEntryProps {
  bookmark: Bookmark;
  pinnedFolders: string[];
  /** Cached favicon URL per hostname (Firefox only). */
  favicons: Record<string, string>;
  /** Folders are only listed in search results. */
  showFolders?: boolean;
  onEditBookmark: (bookmarkId: string) => void;
  onTogglePin: (folderId: string) => void;
}

function cx(...names: (string | false | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}

/** One row in a kanban column: a bookmark link or a folder. */
export class PlaceEntry extends Component<PlaceEntryProps> {
  render({
    bookmark,
    pinnedFolders,
    favicons,
    showFolders,
    onEditBookmark,
    onTogglePin,
  }: PlaceEntryProps) {
    const isBookmark = detectBookmark(bookmark);
    const isFolder = detectFolder(bookmark);
    if (!isBookmark && !isFolder) return null;
    if (isFolder && !showFolders) return null;

    const iconStyle: { backgroundImage?: string } = {};
    let iconClass = cx(styles.icon, isFolder && styles.folderIcon);

    if (isBookmark && bookmark.url) {
      let favIconUrl: string | null = null;
      if (isChrome) {
        favIconUrl = getFaviconURL(bookmark.url);
      } else {
        try {
          favIconUrl = favicons[new URL(bookmark.url).hostname] ?? null;
        } catch (e) {}
      }
      if (favIconUrl) {
        iconStyle.backgroundImage = 'url(' + favIconUrl + ')';
      } else {
        iconClass = cx(iconClass, styles.defaultFavicon);
      }
    }

    const isPinned = isFolder && pinnedFolders.indexOf(bookmark.id) >= 0;

    return (
      <div class={styles.entry} data-id={bookmark.id} draggable>
        <a
          class={styles.link}
          href={isBookmark ? bookmark.url : undefined}
          title={
            isBookmark
              ? bookmark.title + (bookmark.url ? '\n' + bookmark.url : '')
              : bookmark.title
          }
        >
          <span class={iconClass} style={iconStyle}></span>
          <span class={styles.title}>{bookmark.title}</span>
        </a>
        {isBookmark && (
          <IconButton
            icon="icon-edit"
            class={styles.editButton}
            title="Edit bookmark"
            onClick={() => onEditBookmark(bookmark.id)}
          />
        )}
        {isFolder && (
          <IconButton
            icon={isPinned ? 'icon-pinned' : 'icon-pin'}
            title={isPinned ? 'Unpin folder' : 'Pin folder'}
            onClick={() => onTogglePin(bookmark.id)}
          />
        )}
      </div>
    );
  }
}
