import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler.js";
import { uploadToS3 } from "@/services/imageService.js";
import { prisma } from "@/lib/prisma.js";

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
	if (!req.file) throw new Error("Please upload an image");

	const s3Url = await uploadToS3(
		req.file.buffer,
		req.file.originalname,
		req.file.mimetype,
	);

	const newImage = await prisma.image.create({
		data: {
			url: s3Url,
			key: req.file.originalname,
			format: req.file.mimetype,
			width: 0,
			height: 0,
			userId: req.user!.id,
		},
	});

	res.status(201).json({
		message: "Image upload successfully",
		image: newImage,
	});
});
