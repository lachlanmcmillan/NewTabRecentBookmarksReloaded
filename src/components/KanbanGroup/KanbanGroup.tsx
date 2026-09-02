import { Component } from 'preact';
import type { Bookmark } from '../../browser-adapter';
import { IconButton } from '../IconButton/IconButton';
import { PlaceEntry } from '../PlaceEntry/PlaceEntry';
import styles from './kanbanGroup.module.css';

export interface KanbanGroupProps {
  /** "search", "recent", or a pinned folder's bookmark id. */
  groupId: string;
  title: string;
  bookmarks: Bookmark[];
  /** Pinned folders can be reordered and unpinned from their heading. */
  editable?: boolean;
  showFolders?: boolean;
  pinnedFolders: string[];
  favicons: Record<string, string>;
  onTogglePin: (folderId: string) => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onEditBookmark: (bookmarkId: string) => void;
}

/** A column of bookmarks with a heading and, when editable, move/unpin buttons. */
export class KanbanGroup extends Component<KanbanGroupProps> {
  render({
    groupId,
    title,
    bookmarks,
    editable,
    showFolders,
    pinnedFolders,
    favicons,
    onTogglePin,
    onMoveLeft,
    onMoveRight,
    onEditBookmark,
  }: KanbanGroupProps) {
    return (
      <div class={styles.group} data-id={groupId}>
        <div class={styles.heading}>
          <h3 class={styles.label} draggable={editable ? true : undefined}>
            {title}
          </h3>
          {editable && (
            <>
              <IconButton
                icon="icon-previous"
                class={styles.headingButton}
                title="Move left"
                onClick={onMoveLeft}
              />
              <IconButton
                icon="icon-next"
                class={styles.headingButton}
                title="Move right"
                onClick={onMoveRight}
              />
              <IconButton
                icon="icon-pinned"
                class={styles.headingButton}
                title="Unpin folder"
                onClick={() => onTogglePin(groupId)}
              />
            </>
          )}
        </div>
        <div class={styles.placeList}>
          {bookmarks.map(bookmark => (
            <PlaceEntry
              key={bookmark.id}
              bookmark={bookmark}
              pinnedFolders={pinnedFolders}
              favicons={favicons}
              showFolders={showFolders}
              onEditBookmark={onEditBookmark}
              onTogglePin={onTogglePin}
            />
          ))}
        </div>
      </div>
    );
  }
}
