import { prisma } from "@repo/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ConflictError, UnauthorizedError } from "@/utils/errors.js";
import { registerInput, loginInput } from "@/schemas/auth.schema.js";

export const registerUser = async (data: registerInput) => {
	const { username, password, email, name } = data;

	const exitingUser = await prisma.user.findFirst({
		where: {
			OR: [{ username }, { email }],
		},
	});

	if (exitingUser) throw new ConflictError("Username or Email already exists");

	const hashedPassword = await bcrypt.hash(password, 10);

	return await prisma.user.create({
		data: {
			email,
			name,
			username,
			password: hashedPassword,
		},
		select: {
			id: true,
			username: true,
			email: true,
			createdAt: true,
		},
	});
};

export const loginUser = async (data: loginInput) => {
	const { username, password } = data;

	const user = await prisma.user.findUnique({
		where: { username },
	});

	if (!user) throw new UnauthorizedError("Invalid credentials");

	const isPassValid = await bcrypt.compare(password, user.password);

	if (!isPassValid) throw new UnauthorizedError("Invalid credentials");

	const token = jwt.sign(
		{
			id: user.id,
		},
		process.env.JWT_SECRET as string,
		{ expiresIn: "7d" },
	);

	return {
		user: {
			id: user.id,
			username: user.username,
			email: user.email,
		},
		token,
	};
};
