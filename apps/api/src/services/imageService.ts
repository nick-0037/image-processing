import path from "path";
import sharp from "sharp";
import fs from "fs";
import { prisma } from "@/lib/prisma.js";
import { z } from "zod";
import { transformImageSchema } from "@/schemas/image.schema.js";
import crypto from "crypto";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3.js";
import { getFromS3, uploadToS3 } from "./s3Service.js";

type TransformOptions = z.infer<typeof transformImageSchema>["body"];

export const getImageMetadata = async (buffer: Buffer) => {
	const metadata = await sharp(buffer).metadata();
	return {
		width: metadata.width || 0,
		height: metadata.height || 0,
		format: metadata.format || "unknown",
	};
};

export const applyImageTransformations = async (
	buffer: Buffer,
	options: TransformOptions,
) => {
	let session = sharp(buffer);

	// Crop
	if (options.crop) {
		const { width, height, x, y } = options.crop;
		session = session.extract({
			left: x,
			top: y,
			width: width,
			height: height,
		});
	}

	// Resize
	if (options.resize) {
		session = session.resize(options.resize.width, options.resize.height, {
			fit: "cover",
		});
	}

	// Rotate & Flip/Flap
	if (options.rotate) session = session.rotate(options.rotate);
	if (options.flip) session = session.flip();
	if (options.flop) session = session.flop();

	// Filters
	if (options.filters?.grayscale) session = session.grayscale();
	if (options.filters?.sepia)
		session = session.recomb([
			[0.3588, 0.7044, 0.1355],
			[0.299, 0.587, 0.114],
			[0.2392, 0.4696, 0.091],
		]);

	// Format & compression
	if (options.format) {
		session = session.toFormat(options.format, {
			quality: options.compress.quality,
		});
	}

	if (options.watermark) {
		const watermarkPath = path.join(
			process.cwd(),
			"assets",
			"logo-watermark.png",
		);

		if (fs.existsSync(watermarkPath)) {
			// Get dimensions of current image processing
			const mainImageMetadata = await session.metadata();
			const mainWidth = mainImageMetadata.width || 1000;

			// Define logo 20% of width the image main
			const watermarkWidth = Math.round(mainWidth * 0.2);

			// Resize Buffer logo before apply
			const watermarkBuffer = await sharp(watermarkPath)
				.resize({ width: watermarkWidth })
				.grayscale()
				.composite([
					{
						input: Buffer.from([128, 128, 128, 77]),
						raw: { width: 1, height: 1, channels: 4 },
						tile: true,
						blend: "dest-in",
					},
				])
				.toBuffer();

			// We apply
			session = session.composite([
				{
					input: watermarkBuffer,
					gravity: "southeast", // side inferior right
					blend: "over",
				},
			]);
		}
	}

	const transformedBuffer = await session.toBuffer();
	const metadata = await sharp(transformedBuffer).metadata();

	return { transformedBuffer, metadata };
};

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

export const getOrTransformImage = async (
	imageRecord: any,
	options: TransformOptions,
	userId: string,
) => {
	// Generate unique hash based in the transformations
	const transformHash = crypto
		.createHash("md5")
		.update(JSON.stringify(options))
		.digest("hex")
		.slice(0, 12);

	const targetFormat = options.format;

	console.log("options from getOrtransformImage", JSON.stringify(options));

	// Construct the cache key: transformed/{originalId}_{optionsHash}.{format}
	const cacheKey = `transformed/${imageRecord.id}_${transformHash}.${targetFormat}`;

	// Cache check: try to find the object in S3
	try {
		await s3Client.send(
			new HeadObjectCommand({
				Bucket: process.env.S3_BUCKET_NAME,
				Key: cacheKey,
			}),
		);

		// If S3 doesn't throw, the file exists. Now verify DB record.
		const existingImage = await prisma.image.findFirst({
			where: {
				key: cacheKey,
				userId,
			},
		});

		if (existingImage) {
			return { image: existingImage, cached: true };
		}
	} catch (e) {
		// Error means file doesn't exist in S3 (Cache Miss). Proceed to Sharp.
	}

	// Cache Miss: Download, Transform, and Upload
	const originalBuffer = await getFromS3(imageRecord.key);

	const { transformedBuffer, metadata } = await applyImageTransformations(
		originalBuffer,
		options,
	);

	// Upload the new result using our deterministic cacheKey
	const { url, key } = await uploadToS3(
		transformedBuffer,
		cacheKey,
		`image/${metadata.format}`,
		"transformed",
	);

	// Create the new image record in Database
    const newImage = await prisma.image.create({
        data: {
            url,
            key,
            format: metadata.format || "unknown",
            width: metadata.width || 0,
            height: metadata.height || 0,
            userId,
        },
    });

	return { image: newImage, cached: false };
};
