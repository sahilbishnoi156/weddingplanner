const KEY = "wedding_code";

export type SavedWedding = {
  code: string;
  savedAt: number;
  expireAt: number;
};

export function loadSavedWedding(): SavedWedding | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedWedding;
    if (!parsed?.code) return null;
    if (parsed.expireAt && Date.now() > parsed.expireAt) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveWedding(code: string) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const expire = now + 5 * 24 * 60 * 60 * 1000;
  localStorage.setItem(
    KEY,
    JSON.stringify({
      code,
      savedAt: now,
      expireAt: expire,
    })
  );
}

export function clearSavedWedding() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
