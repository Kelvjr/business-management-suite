import { Router } from "express";
import {
  addCategory,
  editCategory,
  fetchCategories,
} from "../controllers/categories.controller";

const router = Router();

router.get("/", fetchCategories);
router.post("/", addCategory);
router.patch("/:id", editCategory);

export default router;
