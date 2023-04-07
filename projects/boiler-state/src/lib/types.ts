import { Observable } from 'rxjs';

export type Selector<T> = Observable<T> & {
  readonly snapshot: T;
  defineChange(changeDefinition: ChangeDefinition<T>): Selector<T>;
};

export interface StateConfig {
  debug?: boolean;
}

export type SelectorTuple<T> = {
  [K in keyof T]: Selector<T[K]>;
};

export type ChangeDefinition<T> = 'shallow' | 'deep' | ((previous: T, current: T) => boolean);
