import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler.js";
import {
	findImageById,
	getImageMetadata,
	findImagesPaginated,
} from "@/services/imageService.js";
import { prisma } from "@/lib/prisma.js";
import { uploadToS3 } from "@/services/s3Service.js";
import crypto from "crypto";
import { addTaskToQueue } from "@/services/queueService.js";

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
	if (!req.file) throw new Error("Please upload an image");

	const { width, height, format } = await getImageMetadata(req.file.buffer);

	const { url, key } = await uploadToS3(
		req.file.buffer,
		req.file.originalname,
		req.file.mimetype,
	);

	const newImage = await prisma.image.create({
		data: {
			url: url,
			key: key,
			format: format,
			width: width,
			height: height,
			userId: req.user!.id,
		},
	});

	res.status(201).json({
		message: "Image upload successfully",
		image: newImage,
	});
});

export const transformImage = asyncHandler(
	async (req: Request, res: Response) => {
		const id = req.params.id as any;
		const transformations = req.body;
		const userId = req.user!.id;

		const imageRecord = await prisma.image.findFirst({
			where: { id, userId },
		});

		if (!imageRecord) throw new Error("Image not found");

		// Generate a deterministic hash for this specific transformation
		const transformHash = crypto
			.createHash("md5")
			.update(JSON.stringify(transformations))
			.digest("hex")
			.slice(0, 12);

		const targetFormat = transformations.format || "webp";
		const cacheKey = `transformed/${id}_${transformHash}.${targetFormat}`;

		// Check if already transformed
		const existing = await prisma.image.findFirst({
			where: { key: cacheKey, userId },
		});

		if (existing) {
			res.setHeader("X-Cache", "HIT");
			return res.status(200).json(existing);
		}

		// If not, send to Queue
		addTaskToQueue({
			imageId: id,
			originalKey: imageRecord.key,
			transformations,
			cacheKey,
			userId,
		});

		// Tell the client "I'm working on it"
		res.setHeader("X-cache", "MISS");
		res.status(202).json({
            message: "Transformation request accepted and queued",
            status: "processing",
            taskId: transformHash,
            expectedKey: cacheKey
        });
	},
);

export const getImageDetail = asyncHandler(
	async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const userId = req.user!.id;

		const image = await findImageById(id);

		if (!image || image.userId !== userId) {
			return res
				.status(404)
				.json({ message: "Image not found or unauthorized" });
		}

		res.status(200).json(image);
	},
);

export const getImages = asyncHandler(async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 10;
	const { id } = req.user!;

	const { images, total, totalPages } = await findImagesPaginated(
		page,
		limit,
		id,
	);

	res.status(200).json({
		data: images,
		meta: { total, page, limit, totalPages },
	});
});
