"use client"

import { create } from "zustand"
import type { AppBootstrap, City, Guest, Category } from "@/lib/types"
import { OfflineQueue } from "@/lib/offline-queue"

type ColumnFilterState = "any" | "checked" | "unchecked"
type FilterState = {
  cityIds: number[]
  categories: Record<number, ColumnFilterState>
}

type AppState = {
  cities: City[]
  categories: Category[]
  guests: Guest[]
  checks: Record<string, boolean>
  isBootstrapped: boolean
  syncBusy: boolean
  draft: FilterState
  applied: FilterState

  bootstrap: () => Promise<void>
  syncNow: () => Promise<void>
  setDraft: (next: FilterState) => void
  applyFilters: () => void
  clearFilters: () => void

  addCity: (name: string) => Promise<City | null>
  addCategory: (name: string, type?: string) => Promise<Category | null>
  addGuest: (name: string, cityId: number | null) => Promise<Guest | null>
  toggleCheck: (guestId: number, categoryId: number, checked: boolean) => Promise<void>
}

const CACHE_KEY = "guest-planner:cache-v1"

function saveCache(state: Pick<AppState, "cities" | "categories" | "guests" | "checks" | "draft" | "applied">) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state))
  } catch {}
}

function loadCache(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
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

  bootstrap: async () => {
    const cached = loadCache() as any
    if (cached?.cities || cached?.guests) {
      set({
        cities: cached.cities ?? [],
        categories: cached.categories ?? [],
        guests: cached.guests ?? [],
        checks: cached.checks ?? {},
        draft: cached.draft ?? { cityIds: [], categories: {} },
        applied: cached.applied ?? { cityIds: [], categories: {} },
      })
    }

    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" })
      if (!res.ok) throw new Error("bootstrap failed")
      const data: AppBootstrap = await res.json()

      const checksMap: Record<string, boolean> = {}
      for (const c of data.checks) {
        checksMap[`${c.guest_id}:${c.category_id}`] = !!c.checked
      }

      set({
        cities: data.cities,
        categories: data.categories,
        guests: data.guests,
        checks: checksMap,
        isBootstrapped: true,
      })

      saveCache({
        cities: data.cities,
        categories: data.categories,
        guests: data.guests,
        checks: checksMap,
        draft: get().draft,
        applied: get().applied,
      })
    } catch {
      set({ isBootstrapped: true })
    }

    OfflineQueue.initAutoFlush()
  },

  syncNow: async () => {
    set({ syncBusy: true })
    try {
      await OfflineQueue.flush(
        async () => {},
        () => {},
      )
      await get().bootstrap()
    } finally {
      set({ syncBusy: false })
    }
  },

  setDraft: (next: FilterState) => {
    set({ draft: next })
  },

  applyFilters: () => {
    const s = get() as any
    set({ applied: s.draft })
  },

  clearFilters: () => {
    set({
      draft: { cityIds: [], categories: {} },
      applied: { cityIds: [], categories: {} },
    })
  },

  addCity: async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const temp: City = { id: -Date.now(), name: trimmed }
    set({ cities: [...get().cities, temp].sort((a, b) => a.name.localeCompare(b.name)) })
    saveCache({
      cities: get().cities,
      categories: get().categories,
      guests: get().guests,
      checks: get().checks,
      draft: get().draft,
      applied: get().applied,
    })

    try {
      const res = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) throw new Error("city create failed")
      const created: City = await res.json()
      set({
        cities: get()
          .cities.map((c) => (c.id === temp.id ? created : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      })
      saveCache({
        cities: get().cities,
        categories: get().categories,
        guests: get().guests,
        checks: get().checks,
        draft: get().draft,
        applied: get().applied,
      })
      return created
    } catch {
      OfflineQueue.add({ url: "/api/cities", method: "POST", body: { name: trimmed } })
      return temp
    }
  },

  addCategory: async (name, type = "checkbox") => {
    const trimmed = name.trim()
    if (!trimmed) return null

    const temp: Category = { id: -Date.now(), name: trimmed, type: type || "checkbox" }
    set({ categories: [...get().categories, temp] })
    saveCache({
      cities: get().cities,
      categories: get().categories,
      guests: get().guests,
      checks: get().checks,
      draft: get().draft,
      applied: get().applied,
    })

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, type }),
      })
      if (!res.ok) throw new Error("category create failed")
      const created: Category = await res.json()
      set({ categories: get().categories.map((c) => (c.id === temp.id ? created : c)) })
      saveCache({
        cities: get().cities,
        categories: get().categories,
        guests: get().guests,
        checks: get().checks,
        draft: get().draft,
        applied: get().applied,
      })
      return created
    } catch {
      OfflineQueue.add({ url: "/api/categories", method: "POST", body: { name: trimmed, type } })
      return temp
    }
  },

  addGuest: async (name, cityId) => {
    const trimmed = name.trim()
    if (!trimmed) return null

    const temp: Guest = { id: -Date.now(), name: trimmed, city_id: cityId ?? null }
    set({ guests: [temp, ...get().guests] })
    saveCache({
      cities: get().cities,
      categories: get().categories,
      guests: get().guests,
      checks: get().checks,
      draft: get().draft,
      applied: get().applied,
    })

    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, cityId: cityId ?? null }),
      })
      if (!res.ok) throw new Error("guest create failed")
      const created: Guest = await res.json()
      set({ guests: get().guests.map((g) => (g.id === temp.id ? created : g)) })
      saveCache({
        cities: get().cities,
        categories: get().categories,
        guests: get().guests,
        checks: get().checks,
        draft: get().draft,
        applied: get().applied,
      })
      return created
    } catch {
      OfflineQueue.add({ url: "/api/guests", method: "POST", body: { name: trimmed, cityId: cityId ?? null } })
      return temp
    }
  },

  toggleCheck: async (guestId, categoryId, checked) => {
    const key = `${guestId}:${categoryId}`
    set({ checks: { ...get().checks, [key]: checked } })
    saveCache({
      cities: get().cities,
      categories: get().categories,
      guests: get().guests,
      checks: get().checks,
      draft: get().draft,
      applied: get().applied,
    })

    try {
      const res = await fetch("/api/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, categoryId, checked }),
      })
      if (!res.ok) throw new Error("check toggle failed")
    } catch {
      OfflineQueue.add({ url: "/api/checks", method: "POST", body: { guestId, categoryId, checked } })
    }
  },
}))

export const useStore = useAppStore
