/**
 * Storage wrappers  [LEAD]
 * Every access is wrapped in try/catch: private windows, blocked site data and sandboxed
 * previews throw on the accessor itself. The site must work identically without storage.
 *
 * Keys in use: lmf-theme ("dark" | "light"), lmf-motion ("paused"), lmf-bomb-best (WP4),
 * session: lmf-forged (WP3).
 */

function wrap(getStore) {
  const store = () => {
    try {
      return getStore();
    } catch {
      return null;
    }
  };
  return {
    get(key, fallback = null) {
      try {
        const v = store()?.getItem(key);
        return v === null || v === undefined ? fallback : v;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        store()?.setItem(key, String(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        store()?.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
    getJSON(key, fallback = null) {
      const v = this.get(key);
      if (v === null) return fallback;
      try {
        return JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    setJSON(key, value) {
      try {
        return this.set(key, JSON.stringify(value));
      } catch {
        return false;
      }
    },
  };
}

export const local = wrap(() => globalThis.localStorage);
export const session = wrap(() => globalThis.sessionStorage);

const storage = { local, session };
export default storage;
