import { State } from '../state';
import { Selector } from '../types';

export interface TestItem {
  id: number;
}
export interface TestInterface {
  items: TestItem[];
  displayItems: boolean;
}
export class TestState extends State<TestInterface> {
  itemCalculations = 0;

  constructor() {
    super({ items: [], displayItems: false });
  }

  items$ = this.select((state) => {
    this.itemCalculations++;
    return state.items;
  });

  displayItems$ = this.select((state) => state.displayItems);

  factory$ = this.factory((state, id) =>
    state.items.find((item) => item.id === id)
  );

  combination: Selector<boolean> = this.select(
    [this.items$, this.displayItems$],
    (a, b) => {
      return b;
    }
  );

  addItem(item: TestItem): void {
    this.updateState((state) => {
      state.items.push(item);
    });
  }
}
