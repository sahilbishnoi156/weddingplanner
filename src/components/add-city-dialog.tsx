"use client";

import { useState } from "react";
import { useStore } from "@/lib/state";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function AddCityDialog() {
  const addCity = useStore((s) => s.addCity);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const submit = async () => {
    if (!value.trim()) return;
    const trimmed = value.trim()
    if (useStore.getState().cities.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`City '${trimmed}' already exists.`)
      return
    }
    const created = await addCity(trimmed)
    if (created) toast.success(`City '${created.name}' added`)
    setValue("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add City</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a city</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <Input
            placeholder="City name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Add City</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
