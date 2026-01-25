import { Request, Response } from "express";
import { loginUser, registerUser } from "@/services/authService.js";
import { registerInput, loginInput } from "@/schemas/auth.schema.js";
import { asyncHandler } from "@/utils/asyncHandler.js";

export const register = asyncHandler(
	async (req: Request<{}, {}, registerInput>, res) => {
		const newUser = await registerUser(req.body);

		return res
			.status(201)
			.json({ message: "User registered successfully", user: newUser });
	},
);

export const login = asyncHandler(
	async (req: Request<{}, {}, loginInput>, res: Response) => {
		const user = await loginUser(req.body);

		return res
			.status(200)
			.json({ message: "User logged successfully", ...user });
	},
);
