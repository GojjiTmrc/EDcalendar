import { useState } from 'react';

/**
 * Runs `sync` during render whenever one of `deps` changes (compared with Object.is), and once on
 * the first render. Use it to reset local form state when a modal opens or its target changes,
 * instead of calling setState inside an effect (which renders twice with stale state).
 *
 * `deps` must be stable values (primitives or state/prop references that do not change every
 * render), otherwise this re-renders endlessly.
 */
export function useSyncOnChange(deps, sync) {
  const [prev, setPrev] = useState(null);
  const changed = prev === null || deps.length !== prev.length || deps.some((d, i) => !Object.is(d, prev[i]));
  if (changed) {
    setPrev(deps);
    sync();
  }
}
