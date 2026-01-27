import { Router } from "express";
import { login, register } from "@/controllers/authController.js";
import { validate } from "@/middlewares/validate.js";
import { registerSchema, loginSchema } from "@/schemas/auth.schema.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

export default router;
