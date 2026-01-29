import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME } from "./client.js";

export const uploadToS3 = async (
	fileBuffer: Buffer,
	fileName: string,
	contentType: string,
	folder: "uploads" | "transformed" = "uploads",
) => {
	const fileKey =
		fileName.startsWith("transformed/") || fileName.startsWith("uploads/")
			? fileName
			: `${folder}/${Date.now()}-${fileName}`;

	const command = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: fileKey,
		Body: fileBuffer,
		ContentType: contentType,
	});

	await s3Client.send(command);

	const baseUrl =
		process.env.NODE_ENV === "production"
			? `https://${BUCKET_NAME}.s3.amazonaws.com`
			: `${process.env.LOCALHOST}/${BUCKET_NAME}`;

	return {
		url: `${baseUrl}/${fileKey}`,
		key: fileKey,
	};
};

export const getFromS3 = async (fileKey: string): Promise<Buffer> => {
	const command = new GetObjectCommand({
		Bucket: BUCKET_NAME,
		Key: fileKey,
	});

	const response = await s3Client.send(command);

	const byteArray = await response.Body?.transformToByteArray();
	if (!byteArray) throw new Error("Could not retrieve file from S3");

	return Buffer.from(byteArray);
};
