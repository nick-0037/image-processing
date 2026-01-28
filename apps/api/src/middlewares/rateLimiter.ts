import rateLimit from "express-rate-limit";

export const transformationLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 30,
	statusCode: 429,
	message: {
		message:
			"Too many transformations requested. Please try again in 15 minutes",
		code: "RATE_LIMIT_EXCEEDED",
	},
	standardHeaders: "draft-7",
	legacyHeaders: false,
});
