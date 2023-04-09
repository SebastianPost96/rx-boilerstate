import { TestState } from './mocks';

describe('State Logging', () => {
  let state: TestState;
  let spy: jest.SpyInstance;

  beforeEach(async () => {
    state = new TestState({ debug: true });
  });

  afterEach(async () => {
    spy.mockRestore();
  });

  it('should log actions', () => {
    spy = jest.spyOn(console, 'log').mockImplementation();

    const actionName = 'noop';
    state[actionName]();

    expect(spy).toHaveBeenCalledWith(`${state.constructor.name}.${actionName}`, []);
  });

  it('should not log if actions are only referenced', () => {
    spy = jest.spyOn(console, 'log').mockImplementation();

    state.noop;
    state.addItem;
    state.asSelector().snapshot;

    expect(spy).not.toHaveBeenCalled();
  });

  it('should log state updates', () => {
    spy = jest.spyOn(console, 'log').mockImplementation();
    state.addItem({ id: 5 });

    expect(spy).toHaveBeenCalledWith(state.constructor.name, state.asSelector().snapshot);
  });

  it('should not log built-in functions', () => {
    const fnName = 'select';
    spy = jest.spyOn(console, 'log').mockImplementation();

    state[fnName]((s) => s.items);

    expect(spy).not.toHaveBeenCalledWith(fnName);
  });

  it('should not log factory functions', () => {
    spy = jest.spyOn(console, 'log').mockImplementation();

    state.getItemsByTitle('title');

    expect(spy).not.toHaveBeenCalled();
  });
});
