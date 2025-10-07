type Mutation = {
  id: string
  url: string
  method: "POST" | "PATCH" | "DELETE"
  body?: any
}

const STORAGE_KEY = "guest-Manager:pending-mutations"

function loadQueue(): Mutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Mutation[]) : []
  } catch {
    return []
  }
}

function saveQueue(q: Mutation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(q))
  } catch {}
}

export const OfflineQueue = {
  add(m: Omit<Mutation, "id">) {
    const q = loadQueue()
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    q.push({ id, ...m })
    saveQueue(q)
    return id
  },
  remove(id: string) {
    const q = loadQueue().filter((x) => x.id !== id)
    saveQueue(q)
  },
  list(): Mutation[] {
    return loadQueue()
  },
  async flush(onSuccess?: () => void, onError?: (err: any) => void) {
    const q = loadQueue()
    for (const m of q) {
      try {
        await fetch(m.url, {
          method: m.method,
          headers: { "Content-Type": "application/json" },
          body: m.body ? JSON.stringify(m.body) : undefined,
        })
        OfflineQueue.remove(m.id)
        onSuccess?.()
      } catch (err) {
        onError?.(err)
        break
      }
    }
  },
  initAutoFlush() {
    const handler = () => OfflineQueue.flush().catch(() => {})
    window.addEventListener("online", handler)
    handler()
    return () => window.removeEventListener("online", handler)
  },
}
