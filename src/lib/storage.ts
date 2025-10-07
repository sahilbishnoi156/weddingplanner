import type { AppState } from "./types"

const KEY = "wedding-Manager-state-v1"

export function loadState(): AppState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppState
  } catch {
    return null
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // ignore quota
  }
}
