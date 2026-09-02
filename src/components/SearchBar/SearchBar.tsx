import styles from './searchBar.module.css';

/** id of the search input, so the app can read and clear its value. */
export const SEARCH_INPUT_ID = 'newtab-search-text';

interface SearchBarProps {
  onQueryChange: () => void;
  onSettingsClick: () => void;
}

export function SearchBar({ onQueryChange, onSettingsClick }: SearchBarProps) {
  return (
    <div class={styles.wrapper}>
      <div class={styles.padder}></div>
      <div class={styles.inner}>
        <input
          id={SEARCH_INPUT_ID}
          class={styles.input}
          maxLength={256}
          type="search"
          autoComplete="off"
          aria-label="Search Bookmarks"
          title="Search Bookmarks"
          placeholder="Search Bookmarks"
          onInput={onQueryChange}
          onSearch={onQueryChange}
        />
        <svg
          class={styles.bookmarkIcon}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
        >
          <path d="M15.845 6.064A1.1 1.1 0 0 0 15 5.331L10.911 4.6 8.985.735a1.1 1.1 0 0 0-1.969 0L5.089 4.6l-4.081.729a1.1 1.1 0 0 0-.615 1.834L3.32 10.31l-.609 4.36a1.1 1.1 0 0 0 1.6 1.127L8 13.873l3.69 1.927a1.1 1.1 0 0 0 1.6-1.127l-.61-4.363 2.926-3.146a1.1 1.1 0 0 0 .239-1.1z" />
        </svg>
        <button
          class={styles.searchButton}
          title="Search"
          aria-label="Search"
          onClick={onQueryChange}
        ></button>
      </div>
      <button
        class={styles.settingsButton}
        title="Settings"
        aria-label="Settings"
        onClick={onSettingsClick}
      ></button>
    </div>
  );
}
