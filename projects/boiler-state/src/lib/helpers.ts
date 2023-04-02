import { MonoTypeOperatorFunction, Observable, shareReplay } from 'rxjs';
import { Selector } from './types';

const loggingInactive = Symbol('state logging deactivated');
export function deactivateLogging(...objects: object[]): void {
  for (const obj of objects) {
    Object.defineProperty(obj, loggingInactive, {
      value: true,
      writable: false,
    });
  }
}
export function isLoggingDeactivated(item: object): boolean {
  return !!(loggingInactive in item);
}

export function asSelector<T>(observable: Observable<T>): Selector<T> {
  return new Proxy(observable as Selector<T>, {
    get(target: Selector<T>, property: keyof typeof target): unknown {
      switch (property) {
        case 'snapshot': {
          let snapshot;
          target.subscribe((val) => (snapshot = val)).unsubscribe();
          return snapshot;
        }
        default:
          return target[property];
      }
    },
  });
}

export function shareState<T>(): MonoTypeOperatorFunction<T> {
  return shareReplay({ bufferSize: 0, refCount: true });
}
