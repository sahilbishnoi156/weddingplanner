"use client"

import * as React from "react"
import type { Guest, City, CategoryColumn, ID } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function GuestsTable({
  guests,
  allCities,
  categories,
  onToggleCheckbox,
}: {
  guests: Guest[]
  allCities: City[]
  categories: CategoryColumn[]
  onToggleCheckbox: (guestId: ID, colId: ID) => void
}) {
  const cityName = React.useCallback((id: ID) => allCities.find((c) => c.id === id)?.name || "—", [allCities])

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <Th className="w-[72px]">Sr n</Th>
            <Th>Name / City</Th>
            {categories.map((col) => (
              <Th key={col.id}>{col.label}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guests.map((g, idx) => (
            <tr key={g.id} className="border-t">
              <Td className="text-muted-foreground">{idx + 1}</Td>
              <Td>
                <div className="flex flex-col">
                  <span className="font-medium">{g.name || "—"}</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {g.cityIds.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No city</span>
                    ) : (
                      g.cityIds.map((cid) => (
                        <Badge key={cid} variant="outline" className="text-xs">
                          {cityName(cid)}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </Td>
              {categories.map((col) => (
                <Td key={col.id}>
                  {col.type === "checkbox" ? (
                    <Checkbox
                      checked={Boolean(g.values[col.id])}
                      onCheckedChange={() => onToggleCheckbox(g.id, col.id)}
                      aria-label={`${col.label} for ${g.name}`}
                    />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-3 py-2 text-xs font-semibold text-muted-foreground", className)} {...props} />
}
function Td({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2 align-top", className)} {...props} />
}
