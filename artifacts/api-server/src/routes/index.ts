import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geminiRouter);
router.use(chatRouter);

export default router;
