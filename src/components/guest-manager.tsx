"use client"

import * as React from "react"
import { ThemeToggle } from "./theme-toggle"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Plus, Filter, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { loadState, saveState } from "@/lib/storage"
import type { AppState, City, Guest, CategoryColumn, ID, ColumnType } from "@/lib/types"
import { GuestsTable } from "./guests-table"
import { AddGuestInput } from "./input-add-guest"
import { FiltersBar, type ColumnFilterState } from "./filters-bar"

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)

const emptyState: AppState = {
  cities: [],
  categories: [],
  guests: [],
}

export function GuestManager() {
  const [state, setState] = React.useState<AppState>(emptyState)
  const [ready, setReady] = React.useState(false)

  // Filters / search
  const [search, setSearch] = React.useState("")
  const [cityFilter, setCityFilter] = React.useState<Set<ID>>(new Set())
  const [columnFilters, setColumnFilters] = React.useState<Record<ID, ColumnFilterState>>({})

  React.useEffect(() => {
    const loaded = loadState()
    if (loaded) setState(loaded)
    setReady(true)
  }, [])
  React.useEffect(() => {
    if (ready) saveState(state)
  }, [state, ready])

  // Cities
  const addCity = (nameRaw: string): City | null => {
    const name = nameRaw.trim()
    if (!name) return null
    // dedupe by case-insensitive name
    const exists = state.cities.find((c) => c.name.toLowerCase() === name.toLowerCase())
    if (exists) return exists
    const city: City = { id: makeId(), name }
    setState((s) => ({ ...s, cities: [...s.cities, city].sort((a, b) => a.name.localeCompare(b.name)) }))
    return city
  }
  const removeCity = (id: ID) => {
    setState((s) => ({
      ...s,
      cities: s.cities.filter((c) => c.id !== id),
      guests: s.guests.map((g) => ({ ...g, cityIds: g.cityIds.filter((cid) => cid !== id) })),
    }))
  }

  // Categories (dynamic columns)
  const addCategory = (labelRaw: string, type: ColumnType = "checkbox") => {
    const label = labelRaw.trim()
    if (!label) return
    const exists = state.categories.find((c) => c.label.toLowerCase() === label.toLowerCase())
    if (exists) return
    const col: CategoryColumn = { id: makeId(), label, type }
    setState((s) => ({ ...s, categories: [...s.categories, col] }))
  }
  const removeCategory = (id: ID) => {
    setState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
      guests: s.guests.map((g) => {
        const next = { ...g }
        delete next.values[id]
        return next
      }),
    }))
    setColumnFilters((prev) => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }

  // Guests
  const createGuest = (name: string, cityIds: ID[]) => {
    const guest: Guest = { id: makeId(), name: name.trim(), cityIds: [...new Set(cityIds)], values: {} }
    setState((s) => ({ ...s, guests: [guest, ...s.guests] }))
  }
  const toggleGuestCheckbox = (guestId: ID, colId: ID) => {
    setState((s) => ({
      ...s,
      guests: s.guests.map((g) => {
        if (g.id !== guestId) return g
        const curr = Boolean(g.values[colId])
        return { ...g, values: { ...g.values, [colId]: !curr } }
      }),
    }))
  }

  // Derived filtered guests
  const filteredGuests = React.useMemo(() => {
    const text = search.trim().toLowerCase()
    const cityActive = cityFilter.size > 0
    const colFilterMap = columnFilters
    return state.guests.filter((g) => {
      if (text) {
        const match = g.name.toLowerCase().includes(text)
        if (!match) return false
      }
      if (cityActive) {
        // guest must have at least one city within selected
        const ok = g.cityIds.some((cid) => cityFilter.has(cid))
        if (!ok) return false
      }
      // per-column state filter
      for (const col of state.categories) {
        const f = colFilterMap[col.id]
        if (!f || f === "any") continue
        const val = Boolean(g.values[col.id])
        if (f === "checked" && !val) return false
        if (f === "unchecked" && val) return false
      }
      return true
    })
  }, [state.guests, state.categories, search, cityFilter, columnFilters])

  // Suggestions helper to pass to AddGuestInput
  const findCityByExactToken = (token: string) =>
    state.cities.find((c) => c.name.toLowerCase() === token.toLowerCase()) || null
  const suggestCities = (partial: string) => {
    const p = partial.trim().toLowerCase()
    if (!p) return [] as City[]
    return state.cities
      .filter((c) => c.name.toLowerCase().startsWith(p) || c.name.toLowerCase().includes(p))
      .slice(0, 5)
  }

  // Add city quick UI
  const [newCity, setNewCity] = React.useState("")

  if (!ready) return null

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-pretty text-2xl font-semibold">Wedding Guest Planner</h1>
        <ThemeToggle />
      </header>

      <Card className="p-4 md:p-6">
        {/* Top Controls */}
        <div className="flex flex-col gap-4">
          {/* Row: Add guest + Search */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <AddGuestInput
              cities={state.cities}
              onCreateGuest={createGuest}
              onCreateCity={addCity}
              findCityByExactToken={findCityByExactToken}
              suggestCities={suggestCities}
            />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:max-w-xs"
              aria-label="Search guests"
            />
          </div>

          {/* Row: City quick add + list */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add city..."
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const created = addCity(newCity)
                    if (created) setNewCity("")
                  }
                }}
                aria-label="Add city"
                className="w-56"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  const created = addCity(newCity)
                  if (created) setNewCity("")
                }}
                className="shrink-0"
              >
                <Plus className="mr-1.5 size-4" />
                City
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {state.cities.map((city) => (
                <Badge
                  key={city.id}
                  variant="secondary"
                  className="flex items-center gap-2"
                  title={`Remove ${city.name}`}
                >
                  {city.name}
                  <button
                    className="rounded-md p-0.5 hover:bg-muted"
                    onClick={() => removeCity(city.id)}
                    aria-label={`Remove city ${city.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </Badge>
              ))}
              {state.cities.length === 0 && <span className="text-sm text-muted-foreground">No cities yet</span>}
            </div>
          </div>

          {/* Row: Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters</span>
            </div>
            <FiltersBar
              cities={state.cities}
              categories={state.categories}
              cityFilter={cityFilter}
              onCityFilterChange={setCityFilter}
              columnFilters={columnFilters}
              onColumnFiltersChange={setColumnFilters}
            />
          </div>

          {/* Row: Columns manager */}
          <div className="mt-2 flex flex-col gap-2">
            <ColumnsManager onAdd={addCategory} onRemove={removeCategory} categories={state.categories} />
          </div>
        </div>

        {/* Table */}
        <div className="mt-6">
          <GuestsTable
            guests={filteredGuests}
            allCities={state.cities}
            categories={state.categories}
            onToggleCheckbox={toggleGuestCheckbox}
          />
          {state.guests.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Start by adding a city (optional) and typing a guest name above. Tag a city inline by typing its name then
              pressing space.
            </p>
          )}
        </div>
      </Card>
    </main>
  )
}

function ColumnsManager({
  categories,
  onAdd,
  onRemove,
}: {
  categories: CategoryColumn[]
  onAdd: (label: string, type?: "checkbox" | "text") => void
  onRemove: (id: ID) => void
}) {
  const [label, setLabel] = React.useState("")
  const [type, setType] = React.useState<"checkbox" | "text">("checkbox") // default checkbox

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Add category column (e.g., Invite ready)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (label.trim()) {
                  onAdd(label, type)
                  setLabel("")
                }
              }
            }}
            className="w-72"
            aria-label="New category label"
          />
          <select
            className={cn(
              "h-9 rounded-md border bg-background px-2 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            aria-label="Category type"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="checkbox">Checkbox</option>
            <option value="text">Text</option>
          </select>
          <Button
            variant="default"
            onClick={() => {
              if (label.trim()) {
                onAdd(label, type)
                setLabel("")
              }
            }}
          >
            <Plus className="mr-1.5 size-4" />
            Column
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((col) => (
            <Badge key={col.id} variant="outline" className="flex items-center gap-2">
              {col.label}
              <span className="text-xs text-muted-foreground">({col.type})</span>
              <button
                className="rounded-md p-0.5 hover:bg-muted"
                onClick={() => onRemove(col.id)}
                aria-label={`Remove ${col.label}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </Badge>
          ))}
          {categories.length === 0 && <span className="text-sm text-muted-foreground">No category columns yet</span>}
        </div>
      </div>
    </div>
  )
}
