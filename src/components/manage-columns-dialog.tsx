"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { useStore } from "@/lib/state"
import { AddColumnDialog } from "./add-column-dialog"

export default function ManageColumnsDialog() {
  const categories = useStore((s) => s.categories)
  const editCategory = useStore((s) => s.editCategory)
  const deleteCategory = useStore((s) => s.deleteCategory)

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [value, setValue] = useState("")
  const [type, setType] = useState("checkbox")

  const startEdit = (id: number, name: string, typeVal: string) => {
    setEditingId(id)
    setValue(name)
    setType(typeVal)
  }

  const submitEdit = async () => {
    if (!editingId) return
    await editCategory(editingId, value, type)
    setEditingId(null)
    setValue("")
    setType("checkbox")
  }

  const confirmDelete = async (id: number) => {
    if (!confirm("Delete this column? This will also remove associated checks.")) return
    await deleteCategory(id)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Columns</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Columns</DialogTitle>
        </DialogHeader>
        <div className="py-2 grid gap-2">

          <div className="flex flex-col gap-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                {editingId === c.id ? (
                  <>
                    <Input value={value} onChange={(e) => setValue(e.target.value)} />
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={submitEdit}>Save</Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">{c.name}</div>
                    <div className="mr-2 text-sm text-muted-foreground">{c.type}</div>
                    <Button variant="ghost" onClick={() => startEdit(c.id, c.name, c.type)}>
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => confirmDelete(c.id)}>
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
            <AddColumnDialog />

        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
