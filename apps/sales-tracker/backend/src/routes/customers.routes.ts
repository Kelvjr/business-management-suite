import { Router } from "express";
import {
  addCustomer,
  editCustomer,
  fetchCustomers,
} from "../controllers/customers.controller";

const router = Router();

router.get("/", fetchCustomers);
router.post("/", addCustomer);
router.patch("/:id", editCustomer);

export default router;
