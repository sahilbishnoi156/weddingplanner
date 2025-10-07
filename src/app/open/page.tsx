"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { normalizeCode, isValidCode } from "@/lib/code"
import { saveWedding } from "@/lib/weddingLocal"

export default function OpenPage() {
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function onSubmit(e?: any) {
    if (e) e.preventDefault()
    const normalized = normalizeCode(code)
    if (!isValidCode(normalized)) return alert("Invalid code format")
    setBusy(true)
    try {
      const res = await fetch("/api/weddings/open", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: normalized }) })
      const json = await res.json()
      if (!res.ok) return alert(json?.error || "Not found or expired")
      saveWedding(normalized)
      router.push(`/${normalized}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="p-6">
      <h2 className="text-xl font-semibold">Open existing wedding</h2>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/[OI]/g, ""))} placeholder="Enter wedding code" maxLength={8} className="input" />
        <button type="submit" disabled={busy} className="btn-primary">Open</button>
      </form>
    </main>
  )
}
