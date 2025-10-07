"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/state";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function FiltersSheet() {
  const cities = useStore((s) => s.cities);
  const categories = useStore((s) => s.categories);
  const draft = useStore((s) => s.draft);
  const applied = useStore((s) => s.applied);
  const setDraft = useStore((s) => s.setDraft);
  const applyFilters = useStore((s) => s.applyFilters);
  const clearFilters = useStore((s) => s.clearFilters);

  const [open, setOpen] = useState(false);

  const appliedCount = useMemo(() => {
    const cityCount = applied.cityIds.length;
    const catCount = Object.values(applied.categories).filter(
      (v) => v !== "any"
    ).length;
    return cityCount + catCount;
  }, [applied]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant={appliedCount > 0 ? "default" : "outline"}
          className={cn(appliedCount > 0 ? "ring-2 ring-primary" : "")}
        >
          Filters{appliedCount > 0 ? ` (${appliedCount})` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 p-4">
          {cities?.length > 0 && (
            <section>
              <h4 className="text-sm font-medium mb-2">Cities</h4>
              <div className="grid grid-cols-2 gap-2">
                {cities.map((c) => {
                  const checked = draft.cityIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100 rounded-xl p-1 px-3 dark:hover:bg-neutral-800"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const on = !!v;
                          setDraft({
                            ...draft,
                            cityIds: on
                              ? [...draft.cityIds, c.id]
                              : draft.cityIds.filter((id) => id !== c.id),
                          });
                        }}
                      />
                      <span className="text-sm">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          {categories?.length > 0 && (
            <section>
              <h4 className="text-sm font-medium mb-2">Columns</h4>
              <div className="flex flex-col gap-3">
                {categories.map((cat) => {
                  const value = draft.categories[cat.id] ?? "any";
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <Label className="text-sm">{cat.name}</Label>
                      <div className="flex items-center gap-2">
                        {(["any", "checked", "unchecked"] as const).map(
                          (opt) => (
                            <Button
                              key={opt}
                              size="sm"
                              variant={value === opt ? "default" : "outline"}
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  categories: {
                                    ...draft.categories,
                                    [cat.id]: opt,
                                  },
                                })
                              }
                            >
                              {opt}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
        <SheetFooter className="mt-4 flex gap-2 flex-row justify-end">
          <Button variant="destructive" onClick={() => clearFilters()}>
            Clear
          </Button>
          <Button
            onClick={() => {
              applyFilters();
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
