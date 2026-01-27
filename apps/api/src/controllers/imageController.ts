import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler.js";
import {
	applyImageTransformations,
	findImageById,
	getImageMetadata,
	findImagesPaginated,
} from "@/services/imageService.js";
import { prisma } from "@/lib/prisma.js";
import { uploadToS3, getFromS3 } from "@/services/s3Service.js";

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
		const { id } = req.params;
		const transformations = req.body;
		const user = req.user!;

		if (!id || typeof id !== "string") throw new Error("Invalid Image ID");

		const imageRecord = await prisma.image.findFirst({
			where: { id, userId: user.id },
		});

		if (!imageRecord) throw new Error("Image not found");

		// download from S3
		const originalBuffer = await getFromS3(imageRecord.key);

		const { transformedBuffer, metadata } = await applyImageTransformations(
			originalBuffer,
			transformations,
		);

		const baseName = imageRecord.key.split("-").pop()?.split(".")[0] ?? "image";
		const finalFileName = `${baseName}.${metadata.format}`;

		const { url: newUrl, key: newKey } = await uploadToS3(
			transformedBuffer,
			finalFileName,
			`image/${metadata.format}`,
			"transformed",
		);

		const newImage = await prisma.image.create({
			data: {
				url: newUrl,
				key: newKey,
				format: metadata.format || "unknown",
				width: metadata.width || 0,
				height: metadata.height || 0,
				userId: user.id,
			},
		});

		res.status(201).json(newImage);
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
