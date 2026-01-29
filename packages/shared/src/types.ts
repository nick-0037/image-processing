import { z } from "zod";
import { transformImageSchema } from "./image.schema.js";

export const imageTaskSchema = z.object({
	imageId: z.string(),
	userId: z.string(),
	originalKey: z.string(),
	cacheKey: z.string(),
	transformations: transformImageSchema.shape.body,
	attempt: z.number().default(1),
});

export type ImageTaskPayload = z.infer<typeof imageTaskSchema>;
