import { z } from "zod";

export const imageIdSchema = z.object({
	params: z.object({
		id: z.uuid("ID must be an UUID valid"),
	}),
});

export const uploadImageSchema = z.object({
	body: z.object({}).strict(),
});

export const imagePaginationSchema = z.object({
	query: z.object({
		page: z
			.string()
			.optional()
			.default("1")
			.transform((val) => Math.max(1, parseInt(val, 10))),
		limit: z
			.string()
			.optional()
			.default("10")
			.transform((val) => Math.min(10, Math.max(1, parseInt(val, 10)))),
	}),
});

export const transformImageSchema = z.object({
	params: z.object({
		id: z.uuid("ID must be an UUID valid"),
	}),
	body: z.object({
		resize: z
			.object({
				width: z.number().positive().optional(),
				height: z.number().positive().optional(),
			})
			.optional(),
		crop: z
			.object({
				width: z.number().positive(),
				height: z.number().positive(),
				x: z.number().nonnegative().optional().default(0),
				y: z.number().nonnegative().optional().default(0),
			})
			.optional(),

		rotate: z.number().int().optional(),

		flip: z.boolean().optional(),
		flop: z.boolean().optional(),

		filters: z
			.object({
				grayscale: z.boolean().optional(),
				sepia: z.boolean().optional(),
			})
			.optional(),

		format: z.enum(["jpeg", "png", "webp", "jpg"]).optional(),
		compress: z
			.object({
				quality: z.number().int().min(1).max(100).default(80),
			})
			.default({ quality: 80 }),

		watermark: z.boolean().optional(),
	}),
});
