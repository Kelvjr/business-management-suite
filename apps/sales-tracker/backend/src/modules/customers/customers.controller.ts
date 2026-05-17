import { Request, Response } from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerPurchaseSummary,
  updateCustomer,
} from "./customers.service";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "./customers.validator";

type CustomerParams = {
  id: string;
};

export async function fetchCustomers(_req: Request, res: Response) {
  try {
    const customers = await getAllCustomers();
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
}

export async function fetchCustomerById(req: Request<CustomerParams>, res: Response) {
  try {
    const customer = await getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
}

export async function fetchCustomerPurchaseHistory(
  req: Request<CustomerParams>,
  res: Response,
) {
  try {
    const summary = await getCustomerPurchaseSummary(req.params.id);
    if (!summary.customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(summary);
  } catch (error) {
    console.error("Error fetching customer purchase history:", error);
    res.status(500).json({ error: "Failed to fetch customer purchase history" });
  }
}

export async function addCustomer(req: Request, res: Response) {
  try {
    const parsed = createCustomerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const customer = await createCustomer(parsed.data);
    res.status(201).json(customer);
  } catch (error: any) {
    console.error("Error creating customer:", error);
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Failed to create customer" });
  }
}

export async function editCustomer(req: Request<CustomerParams>, res: Response) {
  try {
    const parsed = updateCustomerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const customer = await updateCustomer(req.params.id, parsed.data);
    res.json(customer);
  } catch (error: any) {
    console.error("Error updating customer:", error);
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Customer not found" });
    }
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Failed to update customer" });
  }
}
