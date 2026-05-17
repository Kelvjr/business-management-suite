import { Router } from "express";
import { fetchInternalContext } from "./internal.controller";

const router = Router();

router.get("/context", fetchInternalContext);

export default router;

