"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { City } from "@/lib/types";
import { CornerDownLeft, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

// utility: get last token (assumes caret at end)
const lastWord = (s: string) => {
  const trimmed = s;
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1] || "";
};
const removeLastWord = (s: string) => {
  const parts = s.split(/\s+/);
  parts.pop();
  const base = parts.join(" ");
  return base;
};

export function AddGuestInput({
  cities,
  onCreateGuest,
  onCreateCity,
  findCityByExactToken,
  suggestCities,
}: {
  cities: City[];
  onCreateGuest: (name: string, cityId: number | null) => void;
  onCreateCity: (name: string) => Promise<City | null> | City | null;
  findCityByExactToken: (token: string) => City | null;
  suggestCities: (partial: string) => City[];
}) {
  const [value, setValue] = React.useState("");
  const [pendingCity, setPendingCity] = React.useState<City | null>(null);
  const [open, setOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);

  const currentPartial = lastWord(value);
  const suggestions = React.useMemo(() => {
    const s = suggestCities(currentPartial);
    setHighlight(0);
    setOpen(
      s.length > 0 ||
        (!!currentPartial &&
          !cities.find(
            (c) => c.name.toLowerCase() === currentPartial.toLowerCase()
          ))
    );
    return s;
  }, [currentPartial, suggestCities, cities]);

  const attachCity = (city: City) => {
    setPendingCity(city);
    if (currentPartial) {
      const nextInput = removeLastWord(value).trimStart();
      setValue(nextInput.length ? nextInput + " " : "");
    }
  };

  const createCityFromPartial = async () => {
    const name = currentPartial.trim();
    if (!name) return;
    const created = await onCreateCity(name);
    if (created) attachCity(created);
  };

  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Spacebar") {
      const token = currentPartial.trim();
      const exact = findCityByExactToken(token);
      if (exact) {
        e.preventDefault();
        attachCity(exact);
        return;
      }
    }
    if (open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const hasCreate = createOptionVisible(currentPartial, suggestions);
      const max = Math.max(
        (hasCreate ? suggestions.length : suggestions.length) - 1,
        0
      );
      setHighlight((h) =>
        e.key === "ArrowDown" ? Math.min(h + 1, max) : Math.max(h - 1, 0)
      );
      return;
    }
    if (e.key === "Enter") {
      const token = currentPartial.trim();
      if (open) {
        e.preventDefault();
        if (suggestions[highlight]) {
          attachCity(suggestions[highlight]);
          return;
        }
        if (createOptionVisible(token, suggestions)) {
          await createCityFromPartial();
          return;
        }
      }
      const name = value.trim();
      if (name) {
        onCreateGuest(name, pendingCity ? pendingCity.id : null);
        setValue("");
        setPendingCity(null);
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const doCreate = () => {
    const name = value.trim();
    if (!name) return;
    onCreateGuest(name, pendingCity ? pendingCity.id : null);
    setValue("");
    setPendingCity(null);
  };

  return (
    <div className="relative w-full md:max-w-xl">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            className={cn(
              "border-0 shadow-none focus-visible:ring-0 dark:bg-neutral-800 bg-neutral-200 "
            )}
            placeholder="Add guest fast... type city then space to tag (e.g., “California John Doe”)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Add guest"
          />

          <div className="flex flex-wrap items-center gap-1.5">
            {pendingCity && (
              <Badge
                key={pendingCity.id}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {pendingCity.name}
                <button
                  className="rounded p-0.5 hover:bg-muted"
                  onClick={() => setPendingCity(null)}
                  aria-label={`Remove city ${pendingCity.name}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
        <Button variant="default" className="shrink-0" onClick={doCreate}>
          <kbd className="hidden md:block">
            <CornerDownLeft className="mr-1 inline size-3" />
          </kbd>
          Guest
        </Button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-10 mt-1 rounded-md border bg-popover p-1 shadow-sm">
          {suggestions.map((c, idx) => (
            <button
              key={c.id}
              className={cn(
                "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                idx === highlight && "bg-muted"
              )}
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                attachCity(c);
              }}
            >
              Add city label: <span className="font-medium">{c.name}</span>
            </button>
          ))}
          {createOptionVisible(currentPartial, suggestions) && (
            <button
              className={cn(
                "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                suggestions.length === 0 && "bg-muted"
              )}
              onMouseDown={async (e) => {
                e.preventDefault();
                await createCityFromPartial();
              }}
            >
              Create and label city:{" "}
              <span className="font-medium">{currentPartial.trim()}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function createOptionVisible(partial: string, suggestions: City[]) {
  const token = partial.trim();
  if (!token) return false;
  const hasExact = suggestions.some(
    (s) => s.name.toLowerCase() === token.toLowerCase()
  );
  return !hasExact;
}
