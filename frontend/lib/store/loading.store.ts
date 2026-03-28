import { create } from "zustand";

// ── Contextual messages ──────────────────────────────────────
export const LOADING_MESSAGES = {
  default:   "Loading…",
  login:     "Signing you in…",
  register:  "Creating your account…",
  guest:     "Starting your session…",
  logout:    "Signing you out…",
  chat:      "Loading chat…",
  newChat:   "Creating new chat…",
  switching: "Switching chat…",
  saving:    "Saving changes…",
  deleting:  "Deleting…",
} as const;

export type LoadingKey = keyof typeof LOADING_MESSAGES;

// ── Store shape ──────────────────────────────────────────────
interface LoadingState {
  isLoading: boolean;
  message: string;
  /** Internal: Unix ms when the minimum display window ends */
  _targetEndTime: number;

  /**
   * Start the loading overlay.
   *
   * @param key   A key from LOADING_MESSAGES or any raw string.
   * @param minMs Minimum visible duration in ms (default random 1000-5000).
   * @param maxMs Upper bound of the random range in ms (default 5000).
   */
  startLoading: (key?: LoadingKey | string, minMs?: number, maxMs?: number) => void;

  /**
   * Signal that the real work is done.
   *
   * The overlay will stay visible until BOTH conditions are true:
   *   1. The minimum random display window has elapsed.
   *   2. This method has been called.
   *
   * @param force If true, dismisses immediately regardless of remaining time.
   */
  stopLoading: (force?: boolean) => void;
}

// ── Timeout handle (lives outside Zustand so it is never serialised) ─
let _pendingStop: ReturnType<typeof setTimeout> | null = null;

function clearPending() {
  if (_pendingStop !== null) {
    clearTimeout(_pendingStop);
    _pendingStop = null;
  }
}

// ── Store ────────────────────────────────────────────────────
export const useLoadingStore = create<LoadingState>((set, get) => ({
  isLoading: false,
  message: LOADING_MESSAGES.default,
  _targetEndTime: 0,

  startLoading(key = "default", minMs, maxMs = 5000) {
    // Cancel any pending auto-stop from a previous call
    clearPending();

    // Resolve the display message
    const msg =
      key in LOADING_MESSAGES
        ? LOADING_MESSAGES[key as LoadingKey]
        : (key as string);

    // Randomise minimum display window: 1 000 – 5 000 ms (unless caller overrides)
    const resolvedMin =
      minMs !== undefined ? minMs : 1_000 + Math.random() * (maxMs - 1_000);

    set({
      isLoading: true,
      message: msg,
      _targetEndTime: Date.now() + resolvedMin,
    });
  },

  stopLoading(force = false) {
    if (force) {
      clearPending();
      set({ isLoading: false });
      return;
    }

    const remaining = get()._targetEndTime - Date.now();

    if (remaining <= 0) {
      // Minimum window already elapsed — hide immediately
      clearPending();
      set({ isLoading: false });
    } else {
      // Wait out the remainder so the overlay never flashes for < 1 s
      clearPending();
      _pendingStop = setTimeout(() => {
        set({ isLoading: false });
        _pendingStop = null;
      }, remaining);
    }
  },
}));
