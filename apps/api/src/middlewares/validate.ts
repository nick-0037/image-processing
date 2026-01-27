import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import createError from "http-errors";

export const validate = (schema: z.ZodType<any, any, any>) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const parsed = await schema.parseAsync({
				body: req.body,
				query: req.query,
				params: req.params,
			});

			Object.defineProperty(req, 'body', { value: parsed.body ?? req.body });
            Object.defineProperty(req, 'query', { value: parsed.query ?? req.query });
            Object.defineProperty(req, 'params', { value: parsed.params ?? req.params });

			next();
		} catch (e: unknown) {
			if (e instanceof ZodError) {
				const err = createError(400, "Validation Error");

				(err as any).details = e.issues.map((iss) => ({
					field: iss.path.length > 0 ? iss.path.join(".") : "request",
					message: iss.message,
				}));

				return next(err);
			}

			next(e);
		}
	};
};
