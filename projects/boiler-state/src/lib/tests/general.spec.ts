import { Observable } from 'rxjs';
import { TestState } from './mocks';

describe('General State Tests', () => {
  let state: TestState;

  beforeEach(async () => {
    state = new TestState();
  });

  it('should detect selectors as observable', () => {
    expect(state.items$ instanceof Observable).toBeTruthy();
  });

  it('should clean up subscriptions', () => {
    state.items$.subscribe();
    state.someString$.subscribe();
    state.destroy();

    expect(state['store'].observed).toBeFalsy();
  });

  it('should get a state snapshot', () => {
    const str = 'howdy';
    state.setString(str);

    expect(state.snapshot.someString).toBe(str);
  });

  it('should reset state', () => {
    state.addItem({ id: 5 });
    state.reset();

    expect(state.snapshot.items.length).toBe(0);
  });

  it('should log actions', () => {
    spyOn(console, 'log');

    state = new TestState({ debug: true });
    const constructorName = state.constructor.name;
    const fnName = 'addItem';

    state[fnName]({ id: 5 });

    expect(console.log).toHaveBeenCalledWith(`${constructorName}.${fnName}`);
  });

  it('should log state updates', () => {
    spyOn(console, 'log');

    state = new TestState({ debug: true });
    state.addItem({ id: 5 });

    expect(console.log).toHaveBeenCalledWith(state.snapshot);
  });

  it('should avoid logging regular functions', () => {
    spyOn(console, 'log');

    state.getItemById$;
    state['select']((s) => s.items);

    expect(console.log).not.toHaveBeenCalledWith('getItemById', 'select');
  });
});
