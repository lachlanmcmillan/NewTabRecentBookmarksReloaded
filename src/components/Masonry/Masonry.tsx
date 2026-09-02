// Preact port of react-responsive-masonry (MIT, Cédric Delpoux).
// https://github.com/cedricdelpoux/react-responsive-masonry
// ResponsiveMasonry and Masonry are merged into one component: the column
// count is chosen from container-width breakpoints, children are rendered,
// their heights measured, and each child is then moved into the shortest
// column. Unlike the original this measures the container rather than
// window.innerWidth, which includes the scrollbar and can cause overflow.
import {
  Component,
  Fragment,
  toChildArray,
  type ComponentChildren,
  type VNode,
} from 'preact';
import styles from './masonry.module.css';

interface MasonryProps {
  children: ComponentChildren;
  /** Minimum container width (px) → number of columns. The smallest key is the default. */
  columnsCountBreakPoints: Record<number, number>;
  /** CSS length placed between columns and between items. */
  gutter?: string;
  class?: string;
  columnClass?: string;
}

interface MasonryState {
  containerWidth: number;
  /** Child key → column index, computed from measured heights. */
  assignment: Record<string, number>;
}

interface Item {
  key: string;
  node: VNode;
}

function isVNode(child: unknown): child is VNode {
  return typeof child === 'object' && child !== null && 'type' in child;
}

function getColumnsCount(
  breakPoints: Record<number, number>,
  containerWidth: number
): number {
  const sorted = Object.keys(breakPoints)
    .map(Number)
    .sort((a, b) => a - b);
  let value = sorted.length > 0 ? breakPoints[sorted[0]] : 1;
  for (const breakPoint of sorted) {
    if (breakPoint < containerWidth) value = breakPoints[breakPoint];
  }
  return Math.max(1, value);
}

function sameAssignment(
  a: Record<string, number>,
  b: Record<string, number>
): boolean {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every(key => a[key] === b[key]);
}

/** Lays children out in balanced columns, shortest column first. */
export class Masonry extends Component<MasonryProps, MasonryState> {
  /** Rendered wrapper element per child key, for height measurement. */
  private elements = new Map<string, HTMLDivElement>();
  private container: HTMLDivElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(props: MasonryProps) {
    super(props);
    this.state = { containerWidth: 0, assignment: {} };
  }

  componentDidMount() {
    if (this.container) {
      this.resizeObserver = new ResizeObserver(this.onResize);
      this.resizeObserver.observe(this.container);
      this.onResize();
    }
    this.distribute();
  }

  componentDidUpdate() {
    this.distribute();
  }

  componentWillUnmount() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    if (width !== this.state.containerWidth) {
      this.setState({ containerWidth: width });
    }
  };

  /** Flatten children, unwrapping Fragments so every group is its own item. */
  private items(): Item[] {
    const items: Item[] = [];
    const visit = (children: ComponentChildren, prefix: string) => {
      toChildArray(children).forEach((child, index) => {
        if (!isVNode(child)) return;
        const key =
          child.key != null ? String(child.key) : prefix + '#' + index;
        if (child.type === Fragment) {
          visit(
            (child.props as { children?: ComponentChildren }).children,
            key
          );
        } else {
          items.push({ key, node: child });
        }
      });
    };
    visit(this.props.children, '');
    return items;
  }

  private columnsCount(itemCount: number): number {
    const fromBreakPoints = getColumnsCount(
      this.props.columnsCountBreakPoints,
      this.state.containerWidth
    );
    return Math.max(1, Math.min(fromBreakPoints, itemCount));
  }

  /**
   * Split items into columns using the last measured assignment. Items that
   * have not been measured yet go into the column with the fewest items.
   */
  private layout(items: Item[], count: number): Item[][] {
    const columns: Item[][] = Array.from({ length: count }, () => []);
    const { assignment } = this.state;
    for (const item of items) {
      let column = assignment[item.key];
      if (column === undefined || column >= count) {
        column = 0;
        for (let i = 1; i < count; i++) {
          if (columns[i].length < columns[column].length) column = i;
        }
      }
      columns[column].push(item);
    }
    return columns;
  }

  /** Measure rendered heights and place each item in the shortest column. */
  private distribute() {
    const items = this.items();
    const count = this.columnsCount(items.length);
    const heights = new Array<number>(count).fill(0);
    const assignment: Record<string, number> = {};
    for (const [key, el] of this.elements) {
      if (!el.isConnected) this.elements.delete(key);
    }
    for (const item of items) {
      const el = this.elements.get(item.key);
      const height = el ? el.getBoundingClientRect().height : 0;
      let column = 0;
      for (let i = 1; i < count; i++) {
        if (heights[i] < heights[column]) column = i;
      }
      heights[column] += height;
      assignment[item.key] = column;
    }
    if (!sameAssignment(assignment, this.state.assignment)) {
      this.setState({ assignment });
    }
  }

  /**
   * Only track mounts. When an item moves between columns Preact can mount
   * the new wrapper before unmounting the old one, so a null callback cannot
   * be trusted to mean "gone"; stale entries are pruned in distribute().
   */
  private setElement(key: string, el: HTMLDivElement | null) {
    if (el) this.elements.set(key, el);
  }

  render({ gutter = '0', class: className, columnClass }: MasonryProps) {
    const items = this.items();
    const columns = this.layout(items, this.columnsCount(items.length));
    return (
      <div
        ref={el => {
          this.container = el;
        }}
        class={styles.container + (className ? ' ' + className : '')}
        style={{ '--masonry-gutter': gutter }}
      >
        {columns.map((column, i) => (
          <div
            key={i}
            class={styles.column + (columnClass ? ' ' + columnClass : '')}
          >
            {column.map(item => (
              <div
                key={item.key}
                class={styles.item}
                ref={el => this.setElement(item.key, el)}
              >
                {item.node}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
}
