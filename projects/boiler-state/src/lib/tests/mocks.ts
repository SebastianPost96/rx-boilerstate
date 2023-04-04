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
  displayItems$ = this.select((state) => state.displayItems);
  someString$ = this.select((state) => state.someString);
  combination$ = this.derive(this.items$, this.someString$, (items, str) =>
    items.map((item) => ({ ...item, title: str }))
  );

  getItemById = this.selectDynamic((state, id: number) => state.items.find((item) => item.id === id));
  getItemsByTitle = this.deriveDynamic(this.items$, ([items], title: string) =>
    items.filter((item) => item.title === title)
  );

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
