import { Observable } from 'rxjs';

export type Selector<T> = Observable<T> & { readonly snapshot: T };

export interface StateConfig {
  debug?: boolean;
}

export type SelectorTuple<T> = {
  [K in keyof T]: Selector<T[K]>;
};
