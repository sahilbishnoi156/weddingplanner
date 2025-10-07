"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { City } from "@/lib/types"
import { CornerDownLeft, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

// utility: get last token (assumes caret at end)
const lastWord = (s: string) => {
  const trimmed = s
  const parts = trimmed.split(/\s+/)
  return parts[parts.length - 1] || ""
}
const removeLastWord = (s: string) => {
  const parts = s.split(/\s+/)
  parts.pop()
  const base = parts.join(" ")
  return base
}

export function AddGuestInput({
  cities,
  onCreateGuest,
  onCreateCity,
  findCityByExactToken,
  suggestCities,
}: {
  cities: City[]
  onCreateGuest: (name: string, cityIds: string[]) => void
  onCreateCity: (name: string) => City | null
  findCityByExactToken: (token: string) => City | null
  suggestCities: (partial: string) => City[]
}) {
  const [value, setValue] = React.useState("")
  const [pendingCities, setPendingCities] = React.useState<City[]>([])
  const [open, setOpen] = React.useState(false)
  const [highlight, setHighlight] = React.useState(0)

  const currentPartial = lastWord(value)
  const suggestions = React.useMemo(() => {
    const s = suggestCities(currentPartial)
    setHighlight(0)
    setOpen(
      s.length > 0 || (!!currentPartial && !cities.find((c) => c.name.toLowerCase() === currentPartial.toLowerCase())),
    )
    return s
  }, [currentPartial, suggestCities, cities])

  const attachCity = (city: City) => {
    if (pendingCities.some((c) => c.id === city.id)) return
    setPendingCities((prev) => [...prev, city])
    if (currentPartial) {
      const nextInput = removeLastWord(value).trimStart()
      setValue(nextInput.length ? nextInput + " " : "")
    }
  }

  const createCityFromPartial = () => {
    const name = currentPartial.trim()
    if (!name) return
    const created = onCreateCity(name)
    if (created) attachCity(created)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Spacebar") {
      // space confirms exact city token
      const token = currentPartial.trim()
      const exact = findCityByExactToken(token)
      if (exact) {
        e.preventDefault()
        attachCity(exact)
        return
      }
    }
    if (open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault()
      const len = suggestions.length + 1 // +1 for "create" option potentially
      setHighlight((h) => {
        const max = createOptionVisible(currentPartial, suggestions) ? suggestions.length : suggestions.length - 1
        const baseMax = Math.max(max, 0)
        if (e.key === "ArrowDown") return Math.min(h + 1, baseMax)
        return Math.max(h - 1, 0)
      })
      return
    }
    if (e.key === "Enter") {
      const token = currentPartial.trim()
      // if suggestion list open, accept highlighted option
      if (open) {
        e.preventDefault()
        if (suggestions[highlight]) {
          attachCity(suggestions[highlight])
          return
        }
        // maybe create new city
        if (createOptionVisible(token, suggestions)) {
          createCityFromPartial()
          return
        }
      }
      // otherwise create guest
      const name = value.trim()
      if (name.length === 0 && pendingCities.length > 0) {
        // allow creating an entry even if only cities were tagged; name empty is not helpful — ignore
        return
      }
      if (name) {
        onCreateGuest(
          name,
          pendingCities.map((c) => c.id),
        )
        setValue("")
        setPendingCities([])
      }
    }
    if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const removeCity = (id: string) => {
    setPendingCities((prev) => prev.filter((c) => c.id !== id))
  }

  const doCreate = () => {
    const name = value.trim()
    if (!name) return
    onCreateGuest(
      name,
      pendingCities.map((c) => c.id),
    )
    setValue("")
    setPendingCities([])
  }

  return (
    <div className="relative w-full md:max-w-xl">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-background px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {pendingCities.map((city) => (
              <Badge key={city.id} variant="secondary" className="flex items-center gap-1">
                {city.name}
                <button
                  className="rounded p-0.5 hover:bg-muted"
                  onClick={() => removeCity(city.id)}
                  aria-label={`Remove city ${city.name}`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <Input
            className={cn("border-0 shadow-none focus-visible:ring-0")}
            placeholder="Add guest fast... type city then space to tag (e.g., “California John Doe”)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Add guest"
          />
          <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground md:block">
            <CornerDownLeft className="mr-1 inline size-3" />
            add
          </kbd>
        </div>
        <Button variant="default" className="shrink-0" onClick={doCreate}>
          <Plus className="mr-1.5 size-4" />
          Guest
        </Button>
      </div>

      {/* Suggestions */}
      {open && (
        <div className="absolute left-0 right-0 z-10 mt-1 rounded-md border bg-popover p-1 shadow-sm">
          {/* city suggestions */}
          {suggestions.map((c, idx) => (
            <button
              key={c.id}
              className={cn(
                "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                idx === highlight && "bg-muted",
              )}
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(e) => {
                e.preventDefault()
                attachCity(c)
              }}
            >
              Add city label: <span className="font-medium">{c.name}</span>
            </button>
          ))}
          {/* create city option */}
          {createOptionVisible(currentPartial, suggestions) && (
            <button
              className={cn(
                "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                suggestions.length === 0 && "bg-muted",
              )}
              onMouseDown={(e) => {
                e.preventDefault()
                createCityFromPartial()
              }}
            >
              Create and label city: <span className="font-medium">{currentPartial.trim()}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function createOptionVisible(partial: string, suggestions: City[]) {
  const token = partial.trim()
  if (!token) return false
  const hasExact = suggestions.some((s) => s.name.toLowerCase() === token.toLowerCase())
  return !hasExact
}
