import { TestState } from './mocks';

describe('State Logging', () => {
  let state: TestState;

  beforeEach(async () => {
    state = new TestState({ debug: true });
  });

  it('should log actions', () => {
    spyOn(console, 'log');

    const actionName = 'noop';
    state[actionName]();

    expect(console.log).toHaveBeenCalledWith(`${state.constructor.name}.${actionName}`, []);
  });

  it('should not log if actions are only referenced', () => {
    spyOn(console, 'log');

    state.noop;
    state.addItem;
    state.displayItems$;
    state.snapshot;

    expect(console.log).not.toHaveBeenCalled();
  });

  it('should log state updates', () => {
    spyOn(console, 'log');
    state.addItem({ id: 5 });

    expect(console.log).toHaveBeenCalledWith(state.constructor.name, state.snapshot);
  });

  it('should not log built-in functions', () => {
    const fnName = 'select';
    spyOn(console, 'log');

    state[fnName]((s) => s.items);

    expect(console.log).not.toHaveBeenCalledWith(fnName);
  });

  it('should not log factory functions', () => {
    spyOn(console, 'log');

    state.getItemById(1);

    expect(console.log).not.toHaveBeenCalled();
  });
});
