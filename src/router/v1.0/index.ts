import { Router } from "express";

// import authentication from "@middleware/authentication";

import btc from "@router/v1.0/coinCurrency/btc";
import eth from "@router/v1.0/coinCurrency/eth";
import sol from "@router/v1.0/coinCurrency/sol";

const router = Router();

// router.use(authentication);

router.use("/btc", btc);
router.use("/eth", eth);
router.use("/sol", sol);

export default router;