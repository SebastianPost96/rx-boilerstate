import { TestItem, TestState } from './mocks';

describe('Sharing Behaviour', () => {
  let state: TestState;

  beforeEach(async () => {
    state = new TestState();
  });

  it('should return a synchronous snapshot', () => {
    const item: TestItem = { id: 1 };
    state.addItem(item);
    expect(state.items$.snapshot[0]).toBe(item);
  });

  it('should share calculations while active', () => {
    const item: TestItem = { id: 1 };

    state.addItem(item);
    state.items$.subscribe();
    state.items$.subscribe();
    state.items$.snapshot;
    state.addItem(item);

    expect(state.itemCalculations).toBe(2);
  });

  it('should not calculate when not subscribed', () => {
    const item: TestItem = { id: 1 };
    state.addItem(item);

    expect(state.itemCalculations).toBe(0);
  });

  it('should not calculate when inactive after unsubscribed', () => {
    state.items$.subscribe().unsubscribe();
    const item: TestItem = { id: 1 };
    state.addItem(item);
    state.addItem(item);
    state.addItem(item);

    expect(state.itemCalculations).toBe(1);
  });

  it('should perform new calculations when not subscribed and getting snapshots', () => {
    state.items$.snapshot;
    state.items$.snapshot;
    state.items$.snapshot;

    expect(state.itemCalculations).toBe(3);
  });

  it('should emit on new ref with regular change definition', () => {
    let calcCount = 0;
    const title = 'hello world';

    const selector = state.getItemsByTitle(title);
    selector.subscribe(() => calcCount++);
    state.addItem({ id: 1, title });
    state.addItem({ id: 2 });
    state.addItem({ id: 3 });

    expect(calcCount).toBe(4);
  });

  it('should not emit with custom change definition', () => {
    let calcCount = 0;
    const title = 'hello world';

    const selector = state.getItemsByTitleShallow(title);
    selector.subscribe(() => calcCount++);
    state.addItem({ id: 1, title });
    state.addItem({ id: 2 });
    state.addItem({ id: 3 });

    expect(calcCount).toBe(2);
  });
});
