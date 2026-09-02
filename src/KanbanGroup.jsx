import { Component } from 'preact';
import {
  isChrome,
  detectBookmark,
  detectFolder,
  getFaviconURL,
} from './browser-adapter.js';
import { SvgIcon } from './icons.jsx';

class PlaceEntry extends Component {
  render({ bookmark, pinnedFolders, onEditBookmark, onTogglePin }) {
    var isBookmark = detectBookmark(bookmark);
    var isFolder = detectFolder(bookmark);
    if (!isBookmark && !isFolder) return null;

    var iconStyle = {};
    var iconClasses = 'place-icon icon';
    var hostname = '';

    if (isBookmark) {
      iconClasses += ' icon-default-favicon';
      if (isChrome) {
        iconStyle.backgroundImage = 'url(' + getFaviconURL(bookmark.url) + ')';
      } else {
        try {
          hostname = new URL(bookmark.url).hostname;
        } catch (e) {}
      }
    }

    var isPinned = isFolder && pinnedFolders.indexOf(bookmark.id) >= 0;

    return (
      <div
        class="place-entry"
        data-id={bookmark.id}
        {...(isFolder ? { container: 'true' } : {})}
        draggable="true"
      >
        <a
          class="place-link"
          href={isBookmark ? bookmark.url : undefined}
          title={
            isBookmark
              ? bookmark.title + (bookmark.url ? '\n' + bookmark.url : '')
              : bookmark.title
          }
        >
          <span
            class={iconClasses}
            style={iconStyle}
            {...(hostname ? { 'data-hostname': hostname } : {})}
          ></span>
          <span class="place-label">{bookmark.title}</span>
        </a>
        {isBookmark && (
          <button
            class="edit-place-button icon svgicon"
            onClick={() => onEditBookmark(bookmark.id)}
          >
            <SvgIcon name="icon-edit" />
          </button>
        )}
        {isFolder && (
          <button
            class={
              'group-toggle-pin icon svgicon' + (isPinned ? ' pinned' : '')
            }
            onClick={() => onTogglePin(bookmark.id)}
          >
            <SvgIcon name={isPinned ? 'icon-pinned' : 'icon-pin'} />
          </button>
        )}
      </div>
    );
  }
}

export class KanbanGroup extends Component {
  render({
    groupId,
    title,
    bookmarks,
    editable,
    pinnedFolders,
    onTogglePin,
    onMoveLeft,
    onMoveRight,
    onEditBookmark,
  }) {
    return (
      <div class="kanban-group" data-id={groupId}>
        <div class="kanban-group-heading">
          <h3
            class="kanban-group-label"
            {...(editable ? { draggable: 'true' } : {})}
          >
            {title}
          </h3>
          {editable && (
            <>
              <button class="group-move-left icon svgicon" onClick={onMoveLeft}>
                <SvgIcon name="icon-previous" />
              </button>
              <button
                class="group-move-right icon svgicon"
                onClick={onMoveRight}
              >
                <SvgIcon name="icon-next" />
              </button>
              <button
                class="group-toggle-pin icon svgicon"
                onClick={() => onTogglePin(groupId)}
              >
                <SvgIcon name="icon-pinned" />
              </button>
            </>
          )}
        </div>
        <div class="place-list">
          {bookmarks.map(bookmark => (
            <PlaceEntry
              key={bookmark.id}
              bookmark={bookmark}
              pinnedFolders={pinnedFolders}
              onEditBookmark={onEditBookmark}
              onTogglePin={onTogglePin}
            />
          ))}
        </div>
      </div>
    );
  }
}
