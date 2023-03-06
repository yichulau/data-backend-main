import { Router } from "express";

import v1 from "@router/v1.0/index";

const router = Router();

router.use("/v1.0", v1);

export default router;