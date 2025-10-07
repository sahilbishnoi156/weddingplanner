"use client"

import * as React from "react"
import type { City, Category, ID } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ColumnFilterState = "any" | "checked" | "unchecked"

export function FiltersBar({
  cities,
  categories,
  cityFilter,
  onCityFilterChange,
  columnFilters,
  onColumnFiltersChange,
}: {
  cities: City[]
  categories: Category[]
  cityFilter: Set<ID>
  onCityFilterChange: (v: Set<ID>) => void
  columnFilters: Record<ID, ColumnFilterState>
  onColumnFiltersChange: (v: Record<ID, ColumnFilterState>) => void
}) {
  const [openCities, setOpenCities] = React.useState(false)

  const toggleCity = (id: ID) => {
    const next = new Set(Array.from(cityFilter))
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onCityFilterChange(next)
  }

  const clearCities = () => onCityFilterChange(new Set())

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start">
      <div className="relative">
        <Button
          variant="outline"
          className="h-9 bg-transparent"
          onClick={() => setOpenCities((o) => !o)}
          aria-expanded={openCities}
          aria-haspopup="listbox"
        >
          Cities
          <ChevronDown className="ml-2 size-4" />
        </Button>
        {openCities && (
          <div
            className="absolute z-10 mt-1 w-64 rounded-md border bg-popover p-2 shadow-sm"
            role="listbox"
            aria-label="Filter by cities"
          >
            <div className="max-h-60 overflow-auto">
              {cities.length === 0 && <div className="px-2 py-1.5 text-sm text-muted-foreground">No cities yet</div>}
              {cities.map((c) => {
                const checked = cityFilter.has(c.id)
                return (
                  <label
                    key={c.id}
                    className={cn("flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted")}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleCity(c.id)}
                      aria-label={`Filter ${c.name}`}
                    />
                    <span className="text-sm">{c.name}</span>
                  </label>
                )
              })}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={clearCities}>
                Clear
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setOpenCities(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from(cityFilter).map((id) => {
          const c = cities.find((x) => x.id === id)
          if (!c) return null
          return (
            <Badge key={id} variant="secondary" className="flex items-center gap-1">
              {c.name}
              <button
                aria-label={`Remove ${c.name} filter`}
                className="rounded p-0.5 hover:bg-muted"
                onClick={() => {
                  const next = new Set(Array.from(cityFilter))
                  next.delete(id)
                  onCityFilterChange(next)
                }}
              >
                <X className="size-3.5" />
              </button>
            </Badge>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((col) => {
          const val = columnFilters[col.id] || "any"
          return (
            <div key={col.id} className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">{col.name}:</span>
              <select
                className={cn(
                  "h-8 rounded-md border bg-background px-2 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                aria-label={`${col.name} filter`}
                value={val}
                onChange={(e) =>
                  onColumnFiltersChange({ ...columnFilters, [col.id]: e.target.value as ColumnFilterState })
                }
              >
                <option value="any">Any</option>
                <option value="checked">Checked</option>
                <option value="unchecked">Unchecked</option>
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
