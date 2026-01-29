import amqp from "amqplib";
import { getFromS3, uploadToS3 } from "@repo/storage";
import { applyImageTransformations } from "./services/imageProcessor.js";
import { prisma } from "@repo/database";
import { QUEUES } from "@repo/shared";

async function startWorker() {
	try {
		//  Connection to RabbitMQ (CloudAMQP URL)
		const connection = await amqp.connect(process.env.RABBITMQ_URL!);
		const channel = await connection.createChannel();

		// Ensure queue is durable (must match the controller's configuration)
		await channel.assertQueue(QUEUES.IMAGE_PROCESSING, { durable: true });

		// Tells RabbitMQ not to give more than 1 message to this worker
		// until it has processed and acknowledged the current one.
		channel.prefetch(1);

		console.log("Worker is online and listening for tasks...");

		channel.consume(QUEUES.IMAGE_PROCESSING, async (msg) => {
			if (!msg) return;

			// Parse the data sent by the controller
			const { imageId, originalKey, transformations, cacheKey, userId } =
				JSON.parse(msg.content.toString());

			try {
				console.log(`Processing task for image: ${imageId}`);

				// Download original from S3
				const originalBuffer = await getFromS3(originalKey);

				// Transform using Sharp (your logic in imageService)
				const { transformedBuffer, metadata } = await applyImageTransformations(
					originalBuffer,
					transformations,
				);

				// 5. Upload result to S3
				const { url, key } = await uploadToS3(
					transformedBuffer,
					cacheKey,
					`image/${metadata.format}`,
					"transformed",
				);

				// 6. Save the new transformation record to the DB
				await prisma.image.create({
					data: {
						url,
						key,
						format: metadata.format || "unknown",
						width: metadata.width || 0,
						height: metadata.height || 0,
						userId: userId,
					},
				});

				console.log(`Finished & Uploaded: ${key}`);

				// Tell RabbitMQ the task is done and can be deleted
				channel.ack(msg);
			} catch (e) {
				console.error("Worker Task Error:", e);

				/* In case of error, we acknowledge to remove it from the queue 
                   to avoid "Poison Pills" (tasks that crash the worker forever).
                   In production, you'd usually send this to a "Dead Letter Queue".
                */
				channel.ack(msg);
			}
		});
	} catch (e) {
		console.error("Worker failed to start:", e);
		process.exit(1);
	}
}

startWorker();
