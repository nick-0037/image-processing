import { Request, Response, NextFunction } from "express";

export const errorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const status = err.status || err.statusCode || 500;
	const message = err.message || "Internal Server Error";

	console.error(
		`[${new Date().toISOString()}] ${req.method} ${req.url} - ${status}: ${message}`,
	);

	res.status(status).json({
		status,
		type: err.name || "InternalServerError",
		message,
		...(err.details && { details: err.details }),
	});
};
