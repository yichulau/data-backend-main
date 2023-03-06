import { Router } from "express";

import optionChart from "@controller/optionChart";

const router = Router();

router.get("/option-chart", optionChart);

export default router;