import { Observable } from 'rxjs';
import { TestState } from './mocks';

describe('General State Tests', () => {
  let state: TestState;

  beforeEach(async () => {
    state = new TestState();
  });

  it('should be detected as observable', () => {
    expect(state.items$ instanceof Observable).toBeTruthy();
  });
});
