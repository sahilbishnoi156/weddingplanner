"use client";

import { create } from "zustand";
import { toast } from "sonner";
import type {
  AppBootstrap,
  City,
  Guest,
  Category,
  ColumnType,
} from "@/lib/types";
import { loadSavedWedding } from "@/lib/weddingLocal";
import { OfflineQueue } from "@/lib/offline-queue";

type ColumnFilterState = "any" | "checked" | "unchecked";
type FilterState = {
  cityIds: number[];
  categories: Record<number, ColumnFilterState>;
};

type AppState = {
  cities: City[];
  categories: Category[];
  guests: Guest[];
  checks: Record<string, boolean>;
  isBootstrapped: boolean;
  syncBusy: boolean;
  draft: FilterState;
  changeLanguage: (lang: string) => void;
  applied: FilterState;
  language: string;

  bootstrap: () => Promise<void>;
  syncNow: () => Promise<void>;
  setDraft: (next: FilterState) => void;
  applyFilters: () => void;
  clearFilters: () => void;

  addCity: (name: string) => Promise<City | null>;
  addCategory: (name: string, type?: string) => Promise<Category | null>;
  editCity: (id: number, name: string) => Promise<City | null>;
  deleteCity: (id: number) => Promise<boolean>;
  deleteWedding: () => Promise<boolean>;
  deleteGuest: (id: number) => Promise<boolean>;
  editCategory: (
    id: number,
    name: string,
    type?: string
  ) => Promise<Category | null>;
  deleteCategory: (id: number) => Promise<boolean>;
  addGuest: (name: string, cityId: number | null) => Promise<Guest | null>;
  toggleCheck: (
    guestId: number,
    categoryId: number,
    checked: boolean
  ) => Promise<void>;
};

const CACHE_KEY = "guest-planner:cache-v1";

function saveCache(
  state: Pick<
    AppState,
    "cities" | "categories" | "guests" | "checks" | "draft" | "applied"
  >
) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {}
}

function loadCache(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  cities: [],
  categories: [],
  guests: [],
  checks: {},
  isBootstrapped: false,
  syncBusy: false,
  draft: { cityIds: [], categories: {} },
  applied: { cityIds: [], categories: {} },
  language: "hi",

  bootstrap: async () => {
    const cached = loadCache() as any;
    if (cached?.cities || cached?.guests) {
      set({
        cities: cached.cities ?? [],
        categories: cached.categories ?? [],
        guests: cached.guests ?? [],
        checks: cached.checks ?? {},
        draft: cached.draft ?? { cityIds: [], categories: {} },
        applied: cached.applied ?? { cityIds: [], categories: {} },
      });
    }

    try {
      const saved = loadSavedWedding();
      const headers: Record<string, string> = saved
        ? { "x-wedding-code": saved.code }
        : {};
      const res = await fetch("/api/bootstrap", { cache: "no-store", headers });
      if (!res.ok) throw new Error("bootstrap failed");
      const data: AppBootstrap = await res.json();

      const checksMap: Record<string, boolean> = {};
      for (const c of data.checks) {
        checksMap[`${c.guest_id}:${c.category_id}`] = !!c.checked;
      }

      set({
        cities: data.cities,
        categories: data.categories,
        guests: data.guests,
        checks: checksMap,
        isBootstrapped: true,
      });

      saveCache({
        cities: data.cities,
        categories: data.categories,
        guests: data.guests,
        checks: checksMap,
        draft: get().draft,
        applied: get().applied,
      });
    } catch {
      set({ isBootstrapped: true });
    }

    OfflineQueue.initAutoFlush();
  },

  syncNow: async () => {
    set({ syncBusy: true });
    try {
      await OfflineQueue.flush(
        async () => {},
        () => {}
      );
      await get().bootstrap();
    } finally {
      set({ syncBusy: false });
    }
  },

  changeLanguage: (lang: string) => {
    set({ language: lang });
  },

  setDraft: (next: FilterState) => {
    set({ draft: next });
  },

  applyFilters: () => {
    const s = get() as any;
    set({ applied: s.draft });
  },

  clearFilters: () => {
    set({
      draft: { cityIds: [], categories: {} },
      applied: { cityIds: [], categories: {} },
    });
  },

  deleteWedding: async () => {
    const saved = loadSavedWedding();
    if (!saved) {
      toast.error("No wedding to delete");
      return false;
    }
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const res = await fetch("/api/weddings", {
        method: "DELETE",
        body: JSON.stringify({ code: saved.code }),
      });
      if (!res.ok) throw new Error("delete wedding failed");
      toast.success("Wedding deleted");
      return true;
    } catch {
      toast.error("Could not delete wedding");
      return false;
    }
  },

  addCity: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    // frontend uniqueness check
    if (
      get().cities.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      toast.error(`City '${trimmed}' already exists.`);
      return null;
    }
    const temp: City = { id: -Date.now(), name: trimmed };
    set({
      cities: [...get().cities, temp].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    });
    saveCache({
      cities: get().cities,
      categories: get().categories,
      guests: get().guests,
      checks: get().checks,
      draft: get().draft,
      applied: get().applied,
    });

    try {
      const saved = loadSavedWedding();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (saved) headers["x-wedding-code"] = saved.code;
      const res = await fetch("/api/cities", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error("city create failed");
      const created: City = await res.json();
      set({
        cities: get()
          .cities.map((c) => (c.id === temp.id ? created : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      });
      saveCache({
        cities: get().cities,
        categories: get().categories,
        guests: get().guests,
        checks: get().checks,
        draft: get().draft,
        applied: get().applied,
      });
      return created;
    } catch {
      OfflineQueue.add({
        url: "/api/cities",
        method: "POST",
        body: { name: trimmed },
      });
      toast.success(`Added city '${trimmed}' (offline)`);
      return temp;
    }
  },

  editCity: async (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (
      get().cities.some(
        (c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      toast.error(`City '${trimmed}' already exists.`);
      return null;
    }
    const prev = get().cities;
    set({
      cities: prev
        .map((c) => (c.id === id ? { ...c, name: trimmed } : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    });
    try {
      const saved = loadSavedWedding();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (saved) headers["x-wedding-code"] = saved.code;
      const res = await fetch("/api/cities", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id, name: trimmed }),
      });
      if (!res.ok) throw new Error("city edit failed");
      const updated: City = await res.json();
      toast.success(`Updated city to '${updated.name}'`);
      set({
        cities: get()
          .cities.map((c) => (c.id === id ? updated : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      });
      return updated;
    } catch {
      set({ cities: prev });
      toast.error(`Could not update city '${trimmed}'`);
      return null;
    }
  },

  deleteCity: async (id) => {
    const prev = get().cities;
    const target = prev.find((c) => c.id === id);
    if (!target) return false;
    set({ cities: prev.filter((c) => c.id !== id) });
    try {
      const saved = loadSavedWedding();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (saved) headers["x-wedding-code"] = saved.code;
      const res = await fetch("/api/cities", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("city delete failed");
      toast.success(`Deleted city '${target.name}'`);
      return true;
    } catch {
      set({ cities: prev });
      toast.error(`Could not delete city '${target.name}'`);
      return false;
    }
  },

  deleteGuest: async (id: number) => {
    const prev = get().guests;
    const target = prev.find((g) => g.id === id);
    if (!target) return false;
    set({ guests: prev.filter((g) => g.id !== id) });
    try {
      const saved = loadSavedWedding();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (saved) headers["x-wedding-code"] = saved.code;
      const res = await fetch("/api/guests", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("guest delete failed");
      toast.success(`Deleted guest '${target.name}'`);
      return true;
    } catch {
      set({ guests: prev });
      toast.error(`Could not delete guest '${target.name}'`);
      return false;
    }
  },

  addCategory: async (name, type = "checkbox") => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (
      get().categories.some(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      toast.error(`Column '${trimmed}' already exists.`);
      return null;
    }

    const temp: Category = {
      id: -Date.now(),
      name: trimmed,
      type: type ?? ("checkbox" as ColumnType),
    };
    set({ categories: [...get().categories, temp] });
    saveCache({
      cities: get().cities,
      categories: get().categories,
      guests: get().guests,
      checks: get().checks,
      draft: get().draft,
      applied: get().applied,
    });

    try {
      const saved = loadSavedWedding();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (saved) headers["x-wedding-code"] = saved.code;
      const res = await fetch("/api/categories", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: trimmed, type }),
      });
      if (!res.ok) throw new Error("category create failed");
      const created: Category = await res.json();
      set({
        categories: get().categories.map((c) =>
          c.id === temp.id ? created : c
        ),
      });
      saveCache({
        cities: get().cities,
        categories: get().categories,
        guests: get().guests,
        checks: get().checks,
        draft: get().draft,
        applied: get().applied,
      });
      return created;
    } catch {
      OfflineQueue.add({
        url: "/api/categories",
        method: "POST",
        body: { name: trimmed, type },
      });
      toast.success(`Added column '${trimmed}' (offline)`);
      return temp;
    }
  },

  editCategory: async (id, name, type = "checkbox") => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (
      get().categories.some(
        (c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      toast.error(`Column '${trimmed}' already exists.`);
      return null;
    }
    const prev = get().categories;
    set({
      categories: prev.map((c) =>
        c.id === id ? { ...c, name: trimmed, type } : c
      ),
    });
    try {
      const saved = loadSavedWedding();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (saved) headers["x-wedding-code"] = saved.code;
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id, name: trimmed, type }),
      });
      if (!res.ok) throw new Error("category edit failed");
      const updated: Category = await res.json();
      toast.success(`Updated column to '${updated.name}'`);
      set({
        categories: get().categories.map((c) => (c.id === id ? updated : c)),
      });
      return updated;
    } catch {
      set({ categories: prev });
      toast.error(`Could not update column '${trimmed}'`);
      return null;
    }
  },

  deleteCategory: async (id) => {
    const prev = get().categories;
    const target = prev.find((c) => c.id === id);
    if (!target) return false;
    set({ categories: prev.filter((c) => c.id !== id) });
    try {
      const saved = loadSavedWedding();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (saved) headers["x-wedding-code"] = saved.code;
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("category delete failed");
      toast.success(`Deleted column '${target.name}'`);
      return true;
    } catch {
      set({ categories: prev });
      toast.error(`Could not delete column '${target.name}'`);
      return false;
    }
  },

  addGuest: async (name, cityId) => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const temp: Guest = {
      id: -Date.now(),
      name: trimmed,
      city_id: cityId ?? null,
    };
    set({ guests: [temp, ...get().guests] });
    saveCache({
      cities: get().cities,
      categories: get().categories,
      guests: get().guests,
      checks: get().checks,
      draft: get().draft,
      applied: get().applied,
    });

    try {
      const saved = loadSavedWedding();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (saved) headers["x-wedding-code"] = saved.code;
      const res = await fetch("/api/guests", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: trimmed, cityId: cityId ?? null }),
      });
      if (!res.ok) throw new Error("guest create failed");
      const created: Guest = await res.json();
      set({
        guests: get().guests.map((g) => (g.id === temp.id ? created : g)),
      });
      saveCache({
        cities: get().cities,
        categories: get().categories,
        guests: get().guests,
        checks: get().checks,
        draft: get().draft,
        applied: get().applied,
      });
      return created;
    } catch {
      OfflineQueue.add({
        url: "/api/guests",
        method: "POST",
        body: { name: trimmed, cityId: cityId ?? null },
      });
      return temp;
    }
  },

  toggleCheck: async (guestId, categoryId, checked) => {
    const key = `${guestId}:${categoryId}`;
    set({ checks: { ...get().checks, [key]: checked } });
    saveCache({
      cities: get().cities,
      categories: get().categories,
      guests: get().guests,
      checks: get().checks,
      draft: get().draft,
      applied: get().applied,
    });

    try {
      const saved = loadSavedWedding();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (saved) headers["x-wedding-code"] = saved.code;
      const res = await fetch("/api/checks", {
        method: "POST",
        headers,
        body: JSON.stringify({ guestId, categoryId, checked }),
      });
      if (!res.ok) throw new Error("check toggle failed");
    } catch {
      OfflineQueue.add({
        url: "/api/checks",
        method: "POST",
        body: { guestId, categoryId, checked },
      });
    }
  },
}));

export const useStore = useAppStore;
