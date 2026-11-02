import type { StateStorage } from "zustand/middleware";

/**
 * Storage adapter used by the persisted store. The interface is async-friendly
 * (values may be Promises), so swapping localStorage for IndexedDB later only means
 * replacing `activeStorage` below, e.g. with `idb-keyval`'s get/set/del.
 */
const memory = new Map<string, string>();

export const localStorageAdapter: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      memory.set(name, value);
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      memory.delete(name);
    }
  },
};

export const activeStorage: StateStorage = localStorageAdapter;
export const STORAGE_KEY = "routinebuddy-v1";
