import { useStore } from "../../src/lib/store";

/** Puts the store back to a clean, signed-out state so each test starts from the same place. */
export function resetStore(overrides: Partial<ReturnType<typeof useStore.getState>> = {}) {
  useStore.setState({
    view: "log",
    logs: {},
    weights: [],
    batches: [],
    routine: [],
    routineChecks: {},
    userId: null,
    userEmail: null,
    syncError: null,
    ...overrides,
  });
}
