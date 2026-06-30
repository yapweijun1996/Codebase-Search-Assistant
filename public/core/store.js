// Micro reactive store — the SSOT engine for app-wide state.
//
//   const store = createStore({ count: 0 })
//   store.subscribe((state) => render(state))   // called on every change
//   store.set({ count: 1 })                      // shallow-merge object…
//   store.set((s) => ({ count: s.count + 1 }))   // …or updater function
//
// Each set() builds a NEW top-level state object, so subscribers can cheaply
// detect "did this slice change?" with `prev.slice !== next.slice`.

export function createStore(initial) {
  let state = initial;
  const listeners = new Set();

  return {
    get() {
      return state;
    },
    set(patch) {
      const next = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...next };
      listeners.forEach((fn) => fn(state));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };
}
