"use client";

import { useState } from "react";
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
import { useStore } from "@/lib/state";
import { AddCityDialog } from "./add-city-dialog";

export default function ManageCitiesDialog() {
  const cities = useStore((s) => s.cities);
  const editCity = useStore((s) => s.editCity);
  const deleteCity = useStore((s) => s.deleteCity);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [value, setValue] = useState("");

  const startEdit = (id: number, name: string) => {
    setEditingId(id);
    setValue(name);
  };

  const submitEdit = async () => {
    if (!editingId) return;
    await editCity(editingId, value);
    setEditingId(null);
    setValue("");
  };

  const confirmDelete = async (id: number) => {
    if (!confirm("Delete this city? Guests will remain but be unassigned."))
      return;
    await deleteCity(id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Cities</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Cities</DialogTitle>
        </DialogHeader>
        <div className="py-2 grid gap-2">
          <div className="flex flex-col gap-2">
            {cities.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                {editingId === c.id ? (
                  <>
                    <Input
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                    <Button onClick={submitEdit}>Save</Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">{c.name}</div>
                    <Button
                      variant="ghost"
                      onClick={() => startEdit(c.id, c.name)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => confirmDelete(c.id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
          <AddCityDialog />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
