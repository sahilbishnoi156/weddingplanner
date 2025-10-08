"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { City } from "@/lib/types";
import { CornerDownLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

// utility functions unchanged for lastWord and removeLastWord
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
  namesArray,
  onCreateGuest,
  onCreateCity,
  findCityByExactToken,
  suggestCities,
}: {
  cities: City[];
  namesArray: Set<string>;
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

  // City suggestions memo unchanged except we moved setOpen out of useMemo (to avoid react warnings)
  const citySuggestions = React.useMemo(() => {
    return suggestCities(currentPartial);
  }, [currentPartial, suggestCities]);

  React.useEffect(() => {
    setHighlight(0);
    setOpen(
      citySuggestions.length > 0 ||
        (!!currentPartial &&
          !cities.find(
            (c) => c.name.toLowerCase() === currentPartial.toLowerCase()
          ))
    );
  }, [citySuggestions, cities, currentPartial]);

  // Inline word suggestion from namesArray (only if partial length > 2)
  const inlineSuggestion = React.useMemo(() => {
    if (currentPartial.length < 3) return "";
    const match = Array.from(namesArray).find(
      (w) =>
        w.toLowerCase().startsWith(currentPartial.toLowerCase()) &&
        w.toLowerCase() !== currentPartial.toLowerCase()
    );
    if (match) {
      return match.slice(currentPartial.length); // only the remaining part
    }
    return "";
  }, [currentPartial, namesArray]);

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
    if ((e.key === " " || e.key === "Spacebar") && !e.shiftKey) {
      const token = currentPartial.trim();
      const exact = findCityByExactToken(token);
      if (exact) {
        e.preventDefault();
        attachCity(exact);
        return;
      }
    }

    if (e.key === "Tab") {
      if (inlineSuggestion) {
        e.preventDefault();
        // complete the inline suggestion
        setValue((prev) => prev + inlineSuggestion);
        return;
      } else {
        // if there are no inline suggestions then cycle through city suggestions
        if (citySuggestions.length > 0) {
          attachCity(citySuggestions[highlight] || citySuggestions[0]);
        } else if (createOptionVisible(currentPartial, citySuggestions)) {
          await createCityFromPartial();
        }
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift + Enter to add/create city label
        if (citySuggestions.length > 0) {
          attachCity(citySuggestions[highlight] || citySuggestions[0]);
        } else if (createOptionVisible(currentPartial, citySuggestions)) {
          await createCityFromPartial();
        }
      } else {
        // Enter to add guest
        const name = value.trim();
        if (name) {
          onCreateGuest(name, pendingCity ? pendingCity.id : null);
          setValue("");
          setPendingCity(null);
          setOpen(false);
        }
      }
      return;
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
        <div className="flex min-w-0 flex-1 items-center gap-2 relative">
          <div className="relative w-full">
            <input
              type="text"
              className={cn(
                "border-1 shadow-none focus-visible:ring-0 dark:bg-neutral-800 bg-neutral-200 w-full font-sans text-sm px-3 py-2 rounded-lg",
                // match all font and padding with overlay below!
              )}
              placeholder="Add guest fast... type city then space to tag (e.g., “California John Doe”)"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Add guest"
              spellCheck={false}
              style={{
                position: "relative",
                background: "transparent", // so we can see the ghost text behind
                zIndex: 2, // always above overlay
              }}
            />
            {inlineSuggestion && (
              <span
                // Absolutely position to align left with input
                className={
                  "pointer-events-none absolute left-0 top-0 h-full w-full font-sans text-sm px-3 py-2 rounded-lg" +
                  "flex items-center text-muted-foreground opacity-60 "
                }
                style={{
                  zIndex: 1, // behind the input, but visible through transparent
                  background: "transparent",
                  userSelect: "none",
                  // inherit all display/flex, font, margin, padding, radius from Input!
                }}
                aria-hidden="true"
              >
                {/* Render value + suggestion—ghost suggestion after user text */}
                <span>
                  {/* Only render the suggestion part, not duplicate the user's input */}
                  <span style={{ visibility: "hidden" }}>{value}</span>
                  {/* Suggestion, semi-translucent */}
                  <span>{inlineSuggestion}</span>
                </span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 z-10">
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

      {/* city popup for suggestions unchanged */}
      {open && (
        <div className="absolute left-0 right-0 z-10 mt-1 rounded-md border bg-popover p-1 shadow-sm">
          {citySuggestions.map((c, idx) => (
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
          {createOptionVisible(currentPartial, citySuggestions) && (
            <button
              className={cn(
                "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                citySuggestions.length === 0 && "bg-muted"
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
