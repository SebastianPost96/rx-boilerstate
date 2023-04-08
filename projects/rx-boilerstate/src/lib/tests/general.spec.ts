import { BehaviorSubject, Observable } from 'rxjs';
import { TestState } from './mocks';
import { asSelector } from '../internal-helpers';

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

    expect(state['_store'].observed).toBeFalsy();
  });

  it('should get a state snapshot', () => {
    const str = 'howdy';
    state.setString(str);

    expect(state.asSelector().snapshot.someString).toBe(str);
  });

  it('should reset state', () => {
    state.addItem({ id: 5 });
    state.reset();

    expect(state.asSelector().snapshot.items.length).toBe(0);
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

    const selector = state.getItemsByTitle(title);

    expect(selector.snapshot.length).toBe(2);
  });

  it('should use the same source when defining a change', () => {
    const src = state.items$;
    const test = src
      .defineChange('deep')
      .defineChange('shallow')
      .defineChange((a) => !!a);

    expect(test.source?.source).toBe(src.source?.source);
  });
});
