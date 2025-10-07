"use client";

import * as React from "react";
import type { Guest, City, Category, ID } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trash2Icon } from "lucide-react";

export function GuestsTable({
  guests,
  allCities,
  categories,
  checks,
  onToggleCheckbox,
  onDeleteGuest,
}: {
  guests: Guest[];
  allCities: City[];
  categories: Category[];
  checks: Record<string, boolean>;
  onToggleCheckbox: (guestId: ID, colId: ID) => void;
  onDeleteGuest: (guestId: ID) => void;
}) {
  const cityName = React.useCallback(
    (id: ID | null) => {
      if (id == null) return "—";
      return allCities.find((c) => c.id === id)?.name || "—";
    },
    [allCities]
  );

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <Th className="w-[72px]">Sr n</Th>
            <Th>Name</Th>
            <Th>City</Th>
            {categories.map((col) => (
              <Th key={col.id}>{col.name}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guests.map((g, idx) => (
            <tr key={g.id} className="border-t">
              <Td className="text-muted-foreground">{idx + 1}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{g.name || "—"}</span>
                  <button onClick={() => g.id && onDeleteGuest(g.id)} aria-label={`Delete ${g.name}`}>
                    <Trash2Icon className="inline size-5 mb-0.5 text-red-600 cursor-pointer hover:bg-neutral-800 p-0.5 rounded-sm" />
                  </button>
                </div>
              </Td>
              <Td>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {g.city_id == null ? (
                    <span className="text-xs text-muted-foreground">
                      No city
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {cityName(g.city_id)}
                    </Badge>
                  )}
                </div>
              </Td>
              {categories.map((col) => (
                <Td key={col.id}>
                  {col.type === "checkbox" ? (
                    <Checkbox
                      checked={Boolean(checks[`${g.id}:${col.id}`])}
                      onCheckedChange={() => onToggleCheckbox(g.id, col.id)}
                      aria-label={`${col.name} for ${g.name}`}
                      className="cursor-pointer"
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
  );
}

function Th({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-3 py-2 text-xs font-semibold text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
function Td({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2 align-top", className)} {...props} />;
}
