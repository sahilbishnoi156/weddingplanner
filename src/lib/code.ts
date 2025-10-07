const ALLOWED = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // exclude 0,O,1,I

export function generateCode(length = 6) {
  const n = Math.max(6, Math.min(8, length));
  let out = "";
  for (let i = 0; i < n; i++) {
    out += ALLOWED[Math.floor(Math.random() * ALLOWED.length)];
  }
  return out;
}

export function normalizeCode(input: string | null | undefined) {
  if (!input) return "";
  return String(input).toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/[OI]/g, "");
}

export function isValidCode(code: string) {
  if (!code) return false;
  if (code.length < 6 || code.length > 8) return false;
  for (const ch of code) if (!ALLOWED.includes(ch)) return false;
  return true;
}
