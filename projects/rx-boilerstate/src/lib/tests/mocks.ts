import { State } from '../state';
import { StateConfig } from '../types';

export interface TestItem {
  id: number;
  title?: string;
}
export interface TestInterface {
  items: TestItem[];
  displayItems: boolean;
  someString: string;
}
export class TestState extends State<TestInterface> {
  itemCalculations = 0;

  constructor(config?: StateConfig) {
    super({ items: [], displayItems: false, someString: '' }, config);
  }

  items$ = this.select((state) => {
    this.itemCalculations++;
    return state.items;
  });
  someString$ = this.select((state) => state.someString);
  combination$ = this.derive(this.items$, this.someString$, (items, str) =>
    items.map((item) => ({ ...item, title: str }))
  );

  getItemsByTitle = (title: string) =>
    this.derive(this.items$, (items) => items.filter((item) => item.title === title));
  getItemsByTitleShallow = (title: string) =>
    this.derive(this.items$, (items) => items.filter((item) => item.title === title)).defineChange('shallow');

  addItem(item: TestItem): void {
    this.updateState((state) => {
      state.items.push(item);
    });
  }
  setString(str: string): void {
    this.updateState((state) => {
      state.someString = str;
    });
  }
  noop(): void {}
}
