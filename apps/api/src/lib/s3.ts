import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.REGION;
const endpoint = process.env.S3_ENDPOINT
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
	throw new Error("S3 credentials are missing in .env");
}

export const s3Client = new S3Client({
	endpoint,
	region,
	credentials: {
		accessKeyId,
		secretAccessKey,
	},
	forcePathStyle: true,
	signer: { sign: async (request) => request }
});

export const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
