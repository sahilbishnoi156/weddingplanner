"use client";

import * as React from "react";
import { ThemeToggle } from "./theme-toggle";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { Guest } from "@/lib/types";
import { GuestsTable } from "./guests-table";
import { AddGuestInput } from "./input-add-guest";
import { FiltersSheet } from "./filters-sheet";
import ManageCitiesDialog from "./manage-cities-dialog";
import ManageColumnsDialog from "./manage-columns-dialog";
import { useStore } from "@/lib/state";
import NavbarActions from "./navbar-actions";

export function GuestManager({ code }: { code: string }) {
  if(!code) throw new Error("GuestManager requires code prop");
  // Select individual slices to avoid full-state subscription churn
  const cities = useStore((s) => s.cities);
  const categories = useStore((s) => s.categories);
  const guests = useStore((s) => s.guests);
  const checks = useStore((s) => s.checks);
  const applied = useStore((s) => s.applied);
  const addCity = useStore((s) => s.addCity);
  const addGuest = useStore((s) => s.addGuest);
  const toggleCheck = useStore((s) => s.toggleCheck);

  const [ready, setReady] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Call bootstrap once without depending on a changing function reference
  React.useEffect(() => {
    const doBootstrap = async () => {
      try {
        await useStore.getState().bootstrap();
      } finally {
        setReady(true);
      }
    };
    doBootstrap();
  }, []);

  const onAddCity = React.useCallback(
    async (nameRaw: string) => {
      const name = nameRaw.trim();
      if (!name) return null;
      const exists = cities.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) return exists;
      return await addCity(name);
    },
    [cities, addCity]
  );

  const createGuest = React.useCallback(
    async (name: string, cityId: number | null) => {
      await addGuest(name, cityId);
    },
    [addGuest]
  );

  // Derived filtered guests: apply store filters only when user clicks Apply
  const filteredGuests = React.useMemo(() => {
    const text = search.trim().toLowerCase();
    const cityActive = applied.cityIds.length > 0;
    return guests.filter((g: Guest) => {
      if (text && !g.name.toLowerCase().includes(text)) return false;
      if (cityActive) {
        const ok = g.city_id != null && applied.cityIds.includes(g.city_id);
        if (!ok) return false;
      }
      for (const col of categories) {
        const f = applied.categories[col.id] || "any";
        if (f === "any") continue;
        const key = `${g.id}:${col.id}`;
        const val = Boolean(checks[key]);
        if (f === "checked" && !val) return false;
        if (f === "unchecked" && val) return false;
      }
      return true;
    });
  }, [guests, categories, checks, search, applied]);

  const findCityByExactToken = (token: string) =>
    cities.find((c) => c.name.toLowerCase() === token.toLowerCase()) || null;
  const suggestCities = (partial: string) => {
    const p = partial.trim().toLowerCase();
    if (!p) return [];
    return cities
      .filter(
        (c) =>
          c.name.toLowerCase().startsWith(p) || c.name.toLowerCase().includes(p)
      )
      .slice(0, 5);
  };

  if (!ready) return null;

  return (
    <main className="p-2 md:p-4">
      <header className="flex items-center justify-between mb-2">
        <span className="text-lg font-semibold">Wedding Planner</span>
        <NavbarActions code={code}/>
      </header>

      <Card className="p-2 md:p-4">
        <div className="flex flex-col gap-4">
          {/* Row: Add guest + Search + Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <AddGuestInput
              cities={cities}
              onCreateGuest={createGuest}
              onCreateCity={onAddCity}
              findCityByExactToken={findCityByExactToken}
              suggestCities={suggestCities}
            />
            {guests.length > 0 && (
              <div className="md:ml-auto">
                <FiltersSheet />
              </div>
            )}
          </div>

          {/* Row: Add city/column dialogs */}
          <div className="flex flex-wrap gap-2">
            <ManageCitiesDialog />
            <ManageColumnsDialog />
          </div>

          {/* Row: Search */}
          {guests.length > 0 && (
            <div className="flex w-full md:max-w-sm">
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:max-w-xs"
                aria-label="Search guests"
              />
            </div>
          )}
        </div>

        {/* Table */}
        <div className="mt-6">
          <GuestsTable
            guests={filteredGuests}
            allCities={cities}
            categories={categories}
            checks={checks}
            onDeleteGuest={async (id) => {
              const confirmed = confirm(
                "Are you sure you want to delete this guest?"
              );
              if (confirmed) {
                await useStore.getState().deleteGuest(id);
              }
            }}
            onToggleCheckbox={(guestId, categoryId) => {
              const key = `${guestId}:${categoryId}`;
              const current = Boolean(checks[key]);
              toggleCheck(guestId, categoryId, !current);
            }}
          />
          {guests.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Start by adding a city (optional) and typing a guest name above.
              Tag a city inline by typing its name then pressing space.
            </p>
          )}
        </div>
      </Card>
    </main>
  );
}
