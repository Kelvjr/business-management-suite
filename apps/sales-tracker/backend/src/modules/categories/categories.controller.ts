import { Request, Response } from "express";
import {
  createCategory,
  getAllCategories,
  updateCategory,
} from "./categories.service";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./categories.validator";

type CategoryParams = {
  id: string;
};

export async function fetchCategories(_req: Request, res: Response) {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
}

export async function addCategory(req: Request, res: Response) {
  try {
    const parsed = createCategorySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const category = await createCategory(parsed.data);
    res.status(201).json(category);
  } catch (error: any) {
    console.error("Error creating category:", error);
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "Category already exists" });
    }
    res.status(500).json({ error: "Failed to create category" });
  }
}

export async function editCategory(req: Request<CategoryParams>, res: Response) {
  try {
    const parsed = updateCategorySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const category = await updateCategory(req.params.id, parsed.data);
    res.json(category);
  } catch (error: any) {
    console.error("Error updating category:", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Category not found" });
    }
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "Category already exists" });
    }
    res.status(500).json({ error: "Failed to update category" });
  }
}
