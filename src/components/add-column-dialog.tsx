"use client"

import { useState } from "react"
import { useStore } from "@/lib/state"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"

export function AddColumnDialog() {
  const addCategory = useStore((s) => s.addCategory)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("checkbox")

  const submit = async () => {
    if (!name.trim()) return
    const trimmed = name.trim()
    if (useStore.getState().categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Column '${trimmed}' already exists.`)
      return
    }
    const created = await addCategory(trimmed, type)
    if (created) toast.success(`Column '${created.name}' added`)
    setName("")
    setType("checkbox")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Column</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a column</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <Input
            placeholder="Column name (e.g., Invite Ready)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit()
            }}
          />
          <div>
            <label className="text-sm block mb-1">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                {/* Extendable for other types in future */}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Add Column</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
