import { Observable } from 'rxjs';

/** An Observable that can retrieve a snapshot of its current value. */
export type Selector<T> = Observable<T> & {
  /** A synchronous snapshot of the current Observable value, retrieved by momentarily subscribing to it. */
  readonly snapshot: T;
  /** Returns a new Selector that uses a custom change comparator.
   * @param changeDefinition
   * * `shallow` - compares values using {@link https://www.npmjs.com/package/fast-equals fast-equals} `shallowEqual`.
   * * `deep` - compares values using {@link https://www.npmjs.com/package/fast-equals fast-equals} `deepEqual`.
   * * A custom comparator as defined by the {@link https://rxjs.dev/api/operators/distinctUntilChanged distinctUntilChanged} RxJS operator.
   */
  defineChange(changeDefinition: ChangeDefinition<T>): Selector<T>;
};

/** Config object for state implementations. */
export interface StateConfig {
  /** If set to `true`, method calls and state updates wil be logged in the console. Default is `false`. */
  debug?: boolean;
}

/** A tuple of selectors. */
export type Selectors<T> = {
  [K in keyof T]: Selector<T[K]>;
};

/** A string defining a built-in change function or a custom comparator as defined by {@link https://rxjs.dev/api/operators/distinctUntilChanged distinctUntilChanged}. */
export type ChangeDefinition<T> = 'shallow' | 'deep' | ((previous: T, current: T) => boolean);
