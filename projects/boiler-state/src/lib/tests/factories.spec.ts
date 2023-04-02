import { TestState } from './mocks';

describe('Factory State Tests', () => {
  let state: TestState;

  beforeEach(async () => {
    state = new TestState();
  });

  it('should create a parametered selector', () => {
    const searchFor = 2;
    state.addItem({ id: 1 });
    state.addItem({ id: searchFor });
    state.addItem({ id: 3 });

    const item = state.getItemById$(searchFor).snapshot;
    expect(item?.id).toBe(searchFor);
  });
});
