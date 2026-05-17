import { Router } from "express";
import {
  addCustomer,
  editCustomer,
  fetchCustomerById,
  fetchCustomerPurchaseHistory,
  fetchCustomers,
} from "./customers.controller";

const router = Router();

router.get("/", fetchCustomers);
router.get("/:id", fetchCustomerById);
router.get("/:id/purchases", fetchCustomerPurchaseHistory);
router.post("/", addCustomer);
router.patch("/:id", editCustomer);

export default router;
