import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME } from "@/lib/s3.js";

export const uploadToS3 = async (fileBuffer: Buffer, fileName: string, contentType: string) => {
    const fileKey = `uploads/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: contentType,
    });

    await s3Client.send(command);
    
    // Usamos la misma fileKey para la URL
    return `https://${BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileKey}`;
};