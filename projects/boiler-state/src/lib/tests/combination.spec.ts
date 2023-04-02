import { TestState } from './mocks';

describe('Combination State Tests', () => {
  let state: TestState;

  beforeEach(async () => {
    state = new TestState();
  });

  it('should combine two selectors', () => {
    const newTitle = 'new title of item';
    state.addItem({ id: 1 });
    state.addItem({ id: 2 });
    state.setString(newTitle);

    const combination = state.combination$.snapshot;
    expect(combination.every((item) => item.title === newTitle)).toBeTruthy();
  });

  it('should combine a parametered selector', () => {
    const title = 'find me';

    state.addItem({ id: 1, title });
    state.addItem({ id: 2 });
    state.addItem({ id: 3, title });

    const selector = state.getItemsByTitle$(title);

    expect(selector.snapshot.length).toBe(2);
  });
});
