"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createCategory, fetchCategories, updateCategory, type Category } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SalesCategoriesPageContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {
        toast.error("Failed to load categories.");
      });
  }, []);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      const created = await createCategory({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setDescription("");
      toast.success("Category created.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create category.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editingName.trim()) {
      toast.error("Category name is required.");
      return;
    }

    try {
      const updated = await updateCategory(id, {
        name: editingName.trim(),
        description: editingDescription.trim() || undefined,
      });
      setCategories((prev) =>
        prev
          .map((item) => (item.id === id ? updated : item))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
      toast.success("Category updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update category.";
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto max-w-[1164px] space-y-6">
      <div className="rounded-[20px] border-0 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Sales Categories</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create and manage reusable categories for sales entry and filtering.
        </p>
      </div>

      <Card className="rounded-[20px] border-0 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Create Category</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Category name"
            className="h-10 rounded-xl border-zinc-200"
          />
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description (optional)"
            className="h-10 rounded-xl border-zinc-200"
          />
          <Button
            className="h-10 rounded-xl bg-fuchsia-600 px-5 hover:bg-fuchsia-700"
            onClick={() => void handleCreate()}
            disabled={saving}
          >
            Add Category
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-0 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Existing Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!categories.length ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-gray-500">
              No categories created yet.
            </div>
          ) : (
            categories.map((category) => {
              const editing = editingId === category.id;
              return (
                <div
                  key={category.id}
                  className="grid gap-3 rounded-xl border border-zinc-200 p-3 md:grid-cols-[1fr_1fr_auto]"
                >
                  <Input
                    value={editing ? editingName : category.name}
                    onChange={(event) => setEditingName(event.target.value)}
                    className="h-10 rounded-xl border-zinc-200"
                    readOnly={!editing}
                  />
                  <Input
                    value={editing ? editingDescription : category.description ?? ""}
                    onChange={(event) => setEditingDescription(event.target.value)}
                    className="h-10 rounded-xl border-zinc-200"
                    readOnly={!editing}
                    placeholder="Description"
                  />
                  {editing ? (
                    <div className="flex gap-2">
                      <Button
                        className="h-10 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700"
                        onClick={() => void handleUpdate(category.id)}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 rounded-xl border-zinc-200"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl border-zinc-200"
                      onClick={() => {
                        setEditingId(category.id);
                        setEditingName(category.name);
                        setEditingDescription(category.description ?? "");
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

