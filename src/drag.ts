// Drag and drop for bookmark rows and pinned folder columns.
// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
import { browserAPI } from './browser-adapter';
import { config, canModifyGroup, insertBeforePinnedFolder } from './state';
import groupStyles from './components/KanbanGroup/kanbanGroup.module.css';
import entryStyles from './components/PlaceEntry/placeEntry.module.css';
import styles from './drag.module.css';

// Selectors for the elements rendered by KanbanGroup.tsx and PlaceEntry.tsx.
const ENTRY = '.' + entryStyles.entry;
const GROUP = '.' + groupStyles.group;
const GROUP_HEADING = '.' + groupStyles.heading;
const DRAGGING = styles.dragging;
const DRAGHOVER = styles.draghover;

let draggedGroup: Element | null = null;
let draggedEntry: Element | null = null;

/** Event targets can be text nodes; resolve to the nearest element. */
function elementFromTarget(target: EventTarget | null): Element | null {
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
}

function groupId(group: Element): string | null {
  return group.getAttribute('data-id');
}

document.addEventListener('dragstart', function (event) {
  const targetEl = elementFromTarget(event.target);
  if (!targetEl) return;
  const targetEntry = targetEl.closest(ENTRY);
  if (targetEntry) {
    draggedEntry = targetEntry;
    targetEntry.classList.add(DRAGGING);
    return;
  }
  const targetGroupHeading = targetEl.closest(GROUP_HEADING);
  const targetGroup = targetEl.closest(GROUP);
  if (targetGroupHeading && targetGroup) {
    event.dataTransfer?.setData('text/plain', '');
    draggedGroup = targetGroup;
    targetGroup.classList.add(DRAGGING);
  }
});

document.addEventListener('dragend', function (event) {
  const targetEl = elementFromTarget(event.target);
  if (draggedEntry) {
    targetEl?.closest(ENTRY)?.classList.remove(DRAGGING);
    draggedEntry = null;
  } else if (draggedGroup) {
    targetEl?.closest(GROUP)?.classList.remove(DRAGGING);
    draggedGroup = null;
  }
});

document.addEventListener('dragover', function (event) {
  const targetEl = elementFromTarget(event.target);
  if (!targetEl) return;
  if (draggedEntry) {
    const targetEntry = targetEl.closest(ENTRY);
    const targetGroup = targetEntry
      ? targetEntry.closest(GROUP)
      : targetEl.closest(GROUP);
    if (!targetGroup) return;
    const id = groupId(targetGroup);
    if (!id || !canModifyGroup(id)) return;
    (targetEntry || targetGroup).classList.add(DRAGHOVER);
    event.preventDefault();
  } else if (draggedGroup) {
    const targetGroup = targetEl.closest(GROUP);
    if (!targetGroup) return;
    const id = groupId(targetGroup);
    if (!id || !canModifyGroup(id)) return;
    targetGroup.classList.add(DRAGHOVER);
    event.preventDefault();
  }
});

document.addEventListener('dragleave', function (event) {
  if (!draggedEntry && !draggedGroup) return;
  const targetEl = elementFromTarget(event.target);
  targetEl?.closest('.' + DRAGHOVER)?.classList.remove(DRAGHOVER);
});

document.addEventListener('drop', function (event) {
  const targetEl = elementFromTarget(event.target);
  if (!targetEl) return;
  if (draggedEntry) {
    const targetEntry = targetEl.closest(ENTRY);
    if (targetEntry) {
      // Prevent opening the target link.
      event.preventDefault();
      // Cleanup style since dragleave won't fire.
      targetEntry.classList.remove(DRAGHOVER);
      dropEntryOnEntry(draggedEntry, targetEntry);
      return;
    }
    const targetGroup = targetEl.closest(GROUP);
    if (targetGroup) {
      targetGroup.classList.remove(DRAGHOVER);
      dropEntryOnGroup(draggedEntry, targetGroup);
    }
  } else if (draggedGroup) {
    const targetGroup = targetEl.closest(GROUP);
    if (!targetGroup) return;
    targetGroup.classList.remove(DRAGHOVER);
    dropGroup(draggedGroup, targetGroup);
  }
});

async function dropEntryOnEntry(dragged: Element, targetEntry: Element) {
  const draggedId = dragged.getAttribute('data-id');
  const targetId = targetEntry.getAttribute('data-id');
  if (!draggedId || !targetId || draggedId === targetId) return;

  const targetGroup = targetEntry.closest(GROUP);
  const draggedGroupEl = dragged.closest(GROUP);
  if (!draggedGroupEl || !targetGroup) return;
  const targetGroupId = groupId(targetGroup);
  if (
    !groupId(draggedGroupEl) ||
    !targetGroupId ||
    !canModifyGroup(targetGroupId)
  ) {
    return;
  }

  const [, targetBookmark] = await browserAPI.bookmarks.get([
    draggedId,
    targetId,
  ]);
  const destination: { parentId: string; index?: number } = {
    parentId: targetGroupId,
  };
  if (
    targetBookmark.parentId === targetGroupId &&
    targetBookmark.index !== undefined
  ) {
    if (config.bookmarkFoldersReversed) {
      // We want to display the dragged bookmark above the target. Since the
      // list is shown in reverse order, tell the API to place it after.
      destination.index = targetBookmark.index + 1;
    } else {
      // Push everything else down and take the index of the drop location.
      destination.index = targetBookmark.index;
    }
  }
  // Otherwise the tab is out of sync and the target has moved folders, so
  // the bookmark goes to the bottom of the target group.

  // The page refreshes via bookmarks.onMoved.
  await browserAPI.bookmarks.move(draggedId, destination);
}

async function dropEntryOnGroup(dragged: Element, targetGroup: Element) {
  const draggedId = dragged.getAttribute('data-id');
  if (!draggedId) return;
  const draggedGroupEl = dragged.closest(GROUP);
  if (!draggedGroupEl) return;
  const targetGroupId = groupId(targetGroup);
  if (
    !groupId(draggedGroupEl) ||
    !targetGroupId ||
    !canModifyGroup(targetGroupId)
  ) {
    return;
  }
  // Place the bookmark at the bottom of the target group.
  await browserAPI.bookmarks.move(draggedId, { parentId: targetGroupId });
}

function dropGroup(dragged: Element, targetGroup: Element) {
  const draggedGroupId = groupId(dragged);
  const targetGroupId = groupId(targetGroup);
  if (!draggedGroupId || !targetGroupId) return;
  if (draggedGroupId === targetGroupId || !canModifyGroup(targetGroupId))
    return;
  insertBeforePinnedFolder(draggedGroupId, targetGroupId);
}
