import { useSyncExternalStore } from 'react';

/** Tiny observable value with a React hook, for service status that lives outside the persisted store. */
export function createStatusStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const get = (): T => value;
  const set = (next: T): void => {
    if (Object.is(next, value)) return;
    value = next;
    for (const l of listeners) l();
  };
  const use = (): T => useSyncExternalStore(subscribe, get, get);
  return { get, set, use, subscribe };
}
