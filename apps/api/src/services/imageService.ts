import sharp from "sharp";
import { prisma } from "@repo/database";

/**
 * 1. METADATA LOGIC
 * Useful for the initial upload to save original dimensions.
 */
export const getImageMetadata = async (buffer: Buffer) => {
	const metadata = await sharp(buffer).metadata();
	return {
		width: metadata.width || 0,
		height: metadata.height || 0,
		format: metadata.format || "unknown",
	};
};

/**
 * 3. DATABASE ACCESSORS
 * Centralized queries used by Controller.
 */
export const findImageById = async (id: string) => {
	return await prisma.image.findUnique({
		where: { id },
	});
};

export const findImagesPaginated = async (
	page: number,
	limit: number,
	userId: string,
) => {
	const skip = (page - 1) * limit;

	const [images, total] = await Promise.all([
		prisma.image.findMany({
			where: {
				userId,
			},
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
		}),
		prisma.image.count({ where: { userId } }),
	]);

	return {
		images,
		total,
		totalPages: Math.ceil(total / limit),
	};
};
