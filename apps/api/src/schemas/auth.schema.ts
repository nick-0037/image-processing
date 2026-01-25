import { z } from "zod";

export const registerSchema = z.object({
	body: z.object({
		username: z.string().min(6, "Username must be at least 6 characters long"),
		email: z.email("Invalid email format"),
		password: z.string().min(6, "Password must be at least 6 characters long"),
		name: z.string().optional(),
	}).strict(),
});

export const loginSchema = z.object({
	body: z.object({
		username: z.string().min(1, "Username is required"),
		password: z.string().min(1, "Password is required"),
	}).strict(),
});

export type registerInput = z.infer<typeof registerSchema>["body"];
export type loginInput = z.infer<typeof loginSchema>["body"];