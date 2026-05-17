import { Request, Response } from "express";
import { DEFAULT_BUSINESS_ID, DEFAULT_OWNER_ID } from "../../core/context";

export function fetchInternalContext(_req: Request, res: Response) {
  res.json({
    businessId: DEFAULT_BUSINESS_ID,
    ownerId: DEFAULT_OWNER_ID,
    authEnabled: false,
    adminOverride: true,
  });
}

